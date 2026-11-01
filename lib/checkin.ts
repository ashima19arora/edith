// The logic behind Canon Event / Check-in.

import { categoryFor } from "./aqi";
import { GRID_KG_PER_KWH, XP } from "./factors";
import { billForMonth, dailyBreakdown, isWinter, nextCalibration } from "./footprint";
import { typicalDay } from "./home";
import { livesLost, livesKept } from "./lives";
import { currentStreak } from "./progress";
import type {
  Bill,
  Checkin,
  Deliveries,
  EnergyLog,
  HourlyAir,
  Meal,
  MissionStatus,
  SetupAnswers,
  TimeBlock,
  Trip,
} from "./types";

export interface CheckinDraft {
  meals: Meal[];
  trips: Trip[];
  energy: EnergyLog;
  deliveries: Deliveries;
  outdoorBlocks: TimeBlock[];
}

export type CheckinStep = "meals" | "travel" | "energy" | "deliveries" | "outdoors" | "mission";

export function checkinSteps(setup: SetupAnswers, date: string, hasMission: boolean): CheckinStep[] {
  const steps: CheckinStep[] = ["meals", "travel"];
  // In summer the energy step is about ACs, so it only shows for homes that have one.
  if (isWinter(date) || setup.acs > 0) steps.push("energy");
  steps.push("deliveries", "outdoors");
  if (hasMission) steps.push("mission");
  return steps;
}

// Monday to Saturday counts first: 6 days a week means every day but Sunday.
export function isUsualTravelDay(setup: SetupAnswers, date: string): boolean {
  if (setup.trip.kind === "wfh" || setup.trip.daysPerWeek <= 0) return false;
  const weekday = (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
  return weekday < setup.trip.daysPerWeek;
}

// Today's saved answers if any. Otherwise yesterday's, then setup's, with travel only on usual travel days.
export function prefillCheckin(setup: SetupAnswers, checkins: Checkin[], date: string): CheckinDraft {
  const existing = checkins.find((c) => c.date === date);
  if (existing) {
    return {
      meals: existing.meals,
      trips: existing.trips,
      energy: existing.energy,
      deliveries: existing.deliveries,
      outdoorBlocks: existing.outdoorBlocks,
    };
  }

  const typical = typicalDay(setup, date);
  const usualTrips = isUsualTravelDay(setup, date) ? typical.trips : [];
  const latest = checkins.filter((c) => c.date < date).sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!latest) {
    return { meals: typical.meals, trips: usualTrips, energy: typical.energy, deliveries: typical.deliveries, outdoorBlocks: setup.outdoorBlocks };
  }
  return {
    meals: latest.meals,
    trips: isUsualTravelDay(setup, date) ? (latest.trips.length ? latest.trips : usualTrips) : [],
    energy: latest.energy,
    deliveries: latest.deliveries,
    outdoorBlocks: latest.outdoorBlocks,
  };
}

export function buildCheckin(
  draft: CheckinDraft,
  setup: SetupAnswers,
  date: string,
  day: HourlyAir[],
  aqi: number | null,
  missionStatus: MissionStatus,
  calibration: number,
): Checkin {
  const lost = aqi === null ? 0 : livesLost(day, draft.outdoorBlocks, setup.purifier, categoryFor(aqi));
  return {
    date,
    ...draft,
    missionStatus,
    co2Breakdown: dailyBreakdown(draft, setup, calibration),
    livesKept: livesKept(lost),
  };
}

export interface XpEvent {
  date: string;
  kind: string;
  xp: number;
}

// XP for a new check-in. Editing a day already logged earns nothing more, except a mission newly done.
export function xpForCheckin(checkin: Checkin, previous: Checkin[]): XpEvent[] {
  const date = checkin.date;
  const earlier = previous.find((c) => c.date === date);
  const events: XpEvent[] = [];
  if (checkin.missionStatus === "yes" && earlier?.missionStatus !== "yes") {
    events.push({ date, kind: "mission", xp: XP.mission });
  }
  if (earlier) return events;

  events.push({ date, kind: "checkin", xp: XP.checkin });
  const streak = currentStreak([...previous.map((c) => c.date), date], date);
  if (streak === 7) events.push({ date, kind: "streak7", xp: XP.streak7 });
  if (streak === 30) events.push({ date, kind: "streak30", xp: XP.streak30 });
  return events;
}

const MIN_LOGGED_DAYS = 5;

function daysInMonth(month: string): number {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m, 0)).getUTCDate();
}

// What EDITH estimated a month's household units to be, scaled up if some days weren't logged.
export function estimatedMonthUnits(month: string, checkins: Checkin[], setup: SetupAnswers): number | null {
  const logged = checkins.filter((c) => c.date.startsWith(month));
  if (logged.length < MIN_LOGGED_DAYS) return null;
  const kg = logged.reduce((sum, c) => sum + c.co2Breakdown.electricity, 0);
  return ((kg * Math.max(1, setup.people)) / GRID_KG_PER_KWH) * (daysInMonth(month) / logged.length);
}

// How far real bills have differed from estimates, applied to future estimates.
export function currentCalibration(bills: Bill[], checkins: Checkin[], setup: SetupAnswers): number {
  let ratio = 1;
  const months = [...new Set(bills.map((b) => monthOfBill(b)))].sort();
  for (const month of months) {
    const estimate = estimatedMonthUnits(month, checkins, setup);
    const bill = billForMonth(bills, month);
    // Stored estimates already include the earlier ratio, so compare against the uncorrected figure.
    if (estimate && bill) ratio = nextCalibration(ratio, bill.units, estimate / ratio);
  }
  return ratio;
}

export function monthOfBill(bill: Bill): string {
  const middle = (Date.parse(bill.periodStart) + Date.parse(bill.periodEnd)) / 2;
  return new Date(middle).toISOString().slice(0, 7);
}
