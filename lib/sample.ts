// Six months of made-up history for showing what EDITH looks like over time. It stays in one browser
// and the app labels it on every screen. The past air here is illustrative too; today's air is live.

import { headlineAqi } from "./aqi";
import { buildCheckin, challengeXp, currentCalibration, estimatedMonthUnits, isUsualTravelDay, oneOffKg, xpForCheckin, type CheckinDraft, type XpEvent } from "./checkin";
import { SPEED_KMH, XP } from "./factors";
import { isWinter } from "./footprint";
import { typicalDay } from "./home";
import type { Bill, Checkin, HourlyAir, Meal, OneOff, SetupAnswers, TimeBlock, Trip } from "./types";

export interface SampleData {
  setup: SetupAnswers;
  checkins: Checkin[];
  oneOffs: OneOff[];
  bills: Bill[];
  xp: XpEvent[];
}

export const SAMPLE_DAYS = 184;
export const SAMPLE_STREAK = 18; // Long enough to look lived-in, short of the 30-day badge

const DAY_MS = 86_400_000;
const BILL_MONTHS = 3;
// How far each sample bill lands from EDITH's estimate, so the bill correction has something to do.
const BILL_VS_ESTIMATE = [1.12, 1.06, 0.96];
// Illustrative PM2.5 by month, January first: heaviest in winter, cleanest in the monsoon.
const SAMPLE_PM25 = [190, 120, 75, 60, 55, 50, 30, 28, 32, 95, 200, 210];

const SETUP: SetupAnswers = {
  location: { lat: 28.59, lng: 77.04, area: "Dwarka" },
  people: 4,
  homeType: "flat",
  pets: { dog: 1, cat: 0, bird: 0, other: 0 },
  extraCare: ["elderly"],
  trip: { kind: "college", kmOneWay: 12, daysPerWeek: 6, mode: "metro" },
  outdoorBlocks: ["morning", "evening"],
  exercise: "no",
  acs: 1,
  acHoursBand: "4-6",
  cooking: "lpg",
  cylinderLasts: "2",
  purifier: "no",
  billBand: "1000-2500",
  diet: "non-veg",
  nonVegFrequency: "few",
  ordersPerWeek: "1-3",
  flights: { domestic: "0", international: "0" }, // The one flight is logged as a one-off below
};

function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

// A small seeded generator, so the sample looks the same every time.
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleAir(date: string, random: () => number): HourlyAir[] {
  const base = SAMPLE_PM25[Number(date.slice(5, 7)) - 1] * (0.75 + random() * 0.5);
  return Array.from({ length: 24 }, (_, hour) => {
    // Cleanest in the mid-afternoon, heaviest overnight
    const pm25 = base * (1 + 0.35 * Math.cos(((hour - 3) / 24) * 2 * Math.PI));
    return {
      time: `${date}T${String(hour).padStart(2, "0")}:00`,
      concentrations: { pm25, pm10: pm25 * 1.6, no2: 40, o3: 30, co: 1, so2: 10 },
    };
  });
}

function sampleDay(date: string, progress: number, random: () => number): CheckinDraft {
  const typical = typicalDay(SETUP, date);

  const dinner: Meal = random() < 0.5 - progress * 0.25 ? "chicken" : random() < 0.3 ? "veg-dairy" : "veg";
  const meals: Meal[] = ["veg", random() < 0.25 ? "veg-dairy" : "veg", dinner];

  // Early on this household takes more cabs and autos, and moves to the Metro over time.
  const km = SETUP.trip.kmOneWay;
  const leg = (mode: Trip["mode"]): Trip => ({ mode, minutes: (km / SPEED_KMH[mode]) * 60 });
  let trips: Trip[] = [];
  if (isUsualTravelDay(SETUP, date)) {
    const mode: Trip["mode"] = random() < 0.45 - progress * 0.37 ? (random() < 0.5 ? "cab" : "auto") : "metro";
    trips = [leg(mode), leg(mode)];
  }

  const winter = isWinter(date);
  const energy: CheckinDraft["energy"] = {
    acDayHours: winter ? 0 : Math.max(0, typical.energy.acDayHours - 1 + Math.round(random() * 2)),
    acNight: winter ? "off" : random() < 0.6 - progress * 0.3 ? "whole" : "part",
    heaterHours: winter && random() < 0.4 ? 1 : 0,
    geyser: winter ? "short" : "no",
  };

  const deliveries = {
    food: random() < 0.65 - progress * 0.55 ? 1 : 0,
    grocery: random() < 0.15 ? 1 : 0,
    parcel: random() < 0.08 ? 1 : 0,
  };

  const outdoorBlocks: TimeBlock[] = random() < 0.25 ? ["afternoon"] : SETUP.outdoorBlocks;
  return { meals, trips, energy, deliveries, outdoorBlocks };
}

function monthEnd(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m, 0)).toISOString().slice(0, 10);
}

// Today stays empty, so a check-in can still be logged live.
export function buildSampleData(today: string): SampleData {
  const random = seeded(2026);
  const checkins: Checkin[] = [];
  const bills: Bill[] = [];
  const xp: XpEvent[] = [];
  const earned: string[] = [];

  const billMonths = Array.from({ length: BILL_MONTHS }, (_, i) => {
    const [year, m] = today.split("-").map(Number);
    return new Date(Date.UTC(year, m - 2 - (BILL_MONTHS - 1 - i), 1)).toISOString().slice(0, 7);
  });

  let calibration = 1;
  for (let age = SAMPLE_DAYS; age >= 1; age--) {
    const date = addDays(today, -age);

    // The first of a month: the bill for the month just ended arrives.
    if (date.endsWith("-01")) {
      const month = addDays(date, -1).slice(0, 7);
      const billIndex = billMonths.indexOf(month);
      const estimate = billIndex >= 0 ? estimatedMonthUnits(month, checkins, SETUP) : null;
      if (estimate) {
        bills.push({
          periodStart: `${month}-01`,
          periodEnd: monthEnd(month),
          units: Math.round(estimate * BILL_VS_ESTIMATE[billIndex]),
          source: "manual",
        });
        xp.push({ date, kind: "bill", xp: XP.bill });
        calibration = currentCalibration(bills, checkins, SETUP);
      }
    }

    const progress = 1 - age / SAMPLE_DAYS;
    const draft = sampleDay(date, progress, random);
    const air = sampleAir(date, random);
    const missedChance = 0.2 - progress * 0.12;
    const missed = age === SAMPLE_STREAK + 1 || (age > SAMPLE_STREAK && random() < missedChance);
    const missionRoll = random();
    if (missed) continue;

    const status = missionRoll < 0.2 ? "yes" : missionRoll < 0.6 ? "partly" : missionRoll < 0.85 ? "no" : null;
    const checkin = buildCheckin(draft, SETUP, date, air, headlineAqi(air, 23)?.aqi ?? null, status, calibration);
    const events = [...xpForCheckin(checkin, checkins), ...challengeXp(SETUP, [...checkins, checkin], date, earned)];
    earned.push(...events.map((e) => e.kind));
    xp.push(...events);
    checkins.push(checkin);
  }

  const oneOff = (age: number, input: Parameters<typeof oneOffKg>[0]): OneOff => {
    const { kind, ...details } = input;
    return { date: addDays(today, -age), kind, details, co2Kg: oneOffKg(input) };
  };
  const oneOffs = [
    oneOff(110, { kind: "purchase", size: "medium" }),
    oneOff(62, { kind: "flight", route: "domestic", trip: "return" }),
    oneOff(26, { kind: "guests", people: 8 }),
  ];

  return { setup: SETUP, checkins, oneOffs, bills, xp };
}
