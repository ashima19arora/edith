// The logic behind Ranks / Progress, kept apart from the screen so it can be tested.

import { ORDERS_BAND_PER_WEEK } from "./factors";
import { longestStreak } from "./progress";
import type { Bill, Checkin, SetupAnswers } from "./types";

const DAY_MS = 86_400_000;

function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function weekStart(date: string): string {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return addDays(date, -((weekday + 6) % 7)); // Weeks start on Monday
}

export type DayState = "missed" | "in" | "mission";

// Twelve weeks of seven days, oldest first. Days still to come count as missed, so they stay dark.
export function heatmap(checkins: Checkin[], today: string): DayState[][] {
  const byDate = new Map(checkins.map((c) => [c.date, c]));
  const first = addDays(weekStart(today), -77);
  return Array.from({ length: 12 }, (_, week) =>
    Array.from({ length: 7 }, (_, day): DayState => {
      const checkin = byDate.get(addDays(first, week * 7 + day));
      if (!checkin) return "missed";
      return checkin.missionStatus === "yes" ? "mission" : "in";
    }),
  );
}

function groupByWeek(checkins: Checkin[]): Checkin[][] {
  const weeks = new Map<string, Checkin[]>();
  for (const c of checkins) {
    const key = weekStart(c.date);
    weeks.set(key, [...(weeks.get(key) ?? []), c]);
  }
  return [...weeks.values()];
}

const usedMetro = (c: Checkin) => c.trips.some((t) => t.mode === "metro");
const deliveries = (c: Checkin) => c.deliveries.food + c.deliveries.grocery + c.deliveries.parcel;
const acHours = (c: Checkin) => c.energy.acDayHours + { off: 0, part: 3, whole: 7 }[c.energy.acNight];

export type ChallengeKind = "metro" | "no-delivery" | "check-in";

export interface Challenge {
  kind: ChallengeKind;
  done: number;
  target: number;
}

// One rule-based goal a week, chosen from what fits this user, and counted from this week's check-ins.
export function weeklyChallenge(setup: SetupAnswers, checkins: Checkin[], today: string): Challenge {
  const start = weekStart(today);
  const week = checkins.filter((c) => c.date >= start && c.date <= today);
  const hasCommute = setup.trip.kind !== "wfh" && setup.trip.kmOneWay >= 3;

  if (hasCommute && ["two-wheeler", "car", "cab", "auto"].includes(setup.trip.mode)) {
    return { kind: "metro", target: 3, done: Math.min(3, week.filter(usedMetro).length) };
  }
  if (setup.ordersPerWeek !== "none") {
    return { kind: "no-delivery", target: 3, done: Math.min(3, week.filter((c) => deliveries(c) === 0).length) };
  }
  return { kind: "check-in", target: 5, done: Math.min(5, week.length) };
}

export type BadgeId =
  | "suit-up" | "seven-day" | "great-responsibility" | "rail-rider" | "cool-head"
  | "fewer-drops" | "diyas-only" | "assemble" | "paper-trail" | "clean-escape";

export interface BadgeState {
  id: BadgeId;
  earned: boolean;
  count?: [number, number]; // Progress towards a locked badge
}

const MIN_DAYS_FOR_A_WEEK = 5;

export function badgeStates(
  setup: SetupAnswers,
  checkins: Checkin[],
  bills: Bill[],
  hasSquad: boolean,
): BadgeState[] {
  const longest = longestStreak(checkins.map((c) => c.date));
  const fullWeeks = groupByWeek(checkins).filter((week) => week.length >= MIN_DAYS_FOR_A_WEEK);

  const averageAc = checkins.length ? checkins.reduce((sum, c) => sum + acHours(c), 0) / checkins.length : 0;
  const coolHead =
    setup.acs > 0 &&
    averageAc > 0 &&
    fullWeeks.some((week) => week.reduce((sum, c) => sum + acHours(c), 0) / week.length < averageAc);

  const usualOrders = ORDERS_BAND_PER_WEEK[setup.ordersPerWeek];
  const fewerDrops =
    usualOrders > 0 && fullWeeks.some((week) => week.reduce((sum, c) => sum + deliveries(c), 0) <= usualOrders / 2);

  return [
    { id: "suit-up", earned: checkins.length > 0 },
    { id: "seven-day", earned: longest >= 7 },
    { id: "great-responsibility", earned: longest >= 30, count: [Math.min(longest, 30), 30] },
    { id: "rail-rider", earned: groupByWeek(checkins).some((week) => week.filter(usedMetro).length >= 3) },
    { id: "cool-head", earned: coolHead },
    { id: "fewer-drops", earned: fewerDrops, count: [fewerDrops ? 1 : 0, 1] },
    { id: "diyas-only", earned: false },
    { id: "assemble", earned: hasSquad },
    { id: "paper-trail", earned: bills.length >= 3, count: [Math.min(bills.length, 3), 3] },
    { id: "clean-escape", earned: false, count: [0, 5] },
  ];
}
