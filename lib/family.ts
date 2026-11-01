// The logic behind Squad / Family, kept apart from the screen so it can be tested.

import { categoryFor } from "./aqi";
import { timelineRows, type TimelineRow } from "./airspace";
import { AC_KW, DELIVERY_KG, ELECTRICITY_INR_PER_KWH, GRID_KG_PER_KWH, LIVES_PER_DAY, ORDERS_BAND_PER_WEEK } from "./factors";
import { billForMonth, isWinter } from "./footprint";
import { isBad, type GoTimeInfo } from "./home";
import { FAMILY_TEXT } from "./labels";
import { livesKept, livesLost } from "./lives";
import { currentStreak, familyDates } from "./progress";
import { weekStart } from "./ranks";
import type { AqiCategory, Bill, Checkin, HourlyAir, Mode, Purifier, SetupAnswers, TimeBlock } from "./types";

export type ProfileKind = "elder" | "child" | "pet";
export type PetType = "dog" | "cat" | "bird" | "other";

export interface FamilyProfile {
  id: string;
  kind: ProfileKind;
  name: string;
  careNeeds: string[];
  petType: PetType | null;
  outdoorBlocks: TimeBlock[];
}

export interface Member {
  userId: string;
  displayName: string | null;
  role: "owner" | "member";
}

export interface MemberDay {
  userId: string;
  date: string;
  livesKept: number;
  sharedKg: number;
  electricityKg?: number; // Part of sharedKg
  personalKg: number;
}

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  members: Member[];
  days: MemberDay[];
  profiles: FamilyProfile[];
  goalJoins: string[]; // User ids who joined this week's goal
}

const DAY_MS = 86_400_000;

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export interface FamilyFootprint {
  totalKg: number;
  sharedKg: number;
  personal: { userId: string; kg: number }[];
  previousKg: number | null;
}

function electricityOf(days: MemberDay[], userId: string): number {
  return days.filter((d) => d.userId === userId).reduce((sum, d) => sum + (d.electricityKg ?? d.sharedKg), 0);
}

function totals(members: Member[], days: MemberDay[], people: number, bill?: Bill, wholeMonth: MemberDay[] = days) {
  // Each check-in holds one person's share of the home, so scale one member's up to the whole home
  // once. Taking the fullest record means shared energy is never added twice.
  const sharedOf = (userId: string) => days.filter((d) => d.userId === userId).reduce((sum, d) => sum + d.sharedKg, 0);
  const fullest = members.reduce<Member | null>((top, m) => (!top || sharedOf(m.userId) > sharedOf(top.userId) ? m : top), null);
  let sharedKg = (fullest ? sharedOf(fullest.userId) : 0) * Math.max(1, people);

  // A bill replaces the estimate for the whole home, spread like the estimate across the month so far.
  const estimatedMonth = fullest ? electricityOf(wholeMonth, fullest.userId) : 0;
  if (fullest && bill && estimatedMonth > 0) {
    const soFar = electricityOf(days, fullest.userId);
    sharedKg += (bill.units * GRID_KG_PER_KWH * soFar) / estimatedMonth - soFar * Math.max(1, people);
  }
  const personal = members.map((m) => ({
    userId: m.userId,
    kg: days.filter((d) => d.userId === m.userId).reduce((sum, d) => sum + d.personalKg, 0),
  }));
  return { sharedKg, personal, totalKg: sharedKg + personal.reduce((sum, p) => sum + p.kg, 0) };
}

export function familyFootprint(
  members: Member[],
  days: MemberDay[],
  people: number,
  today: string,
  bills: Bill[] = [],
): FamilyFootprint {
  const month = today.slice(0, 7);
  const inMonth = (m: string) => days.filter((d) => d.date.startsWith(m));
  const current = totals(members, inMonth(month).filter((d) => d.date <= today), people, billForMonth(bills, month), inMonth(month));

  const [year, m, day] = today.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, m - 1, 0)).getUTCDate();
  const previousDate = new Date(Date.UTC(year, m - 2, Math.min(day, lastDay))).toISOString().slice(0, 10);
  const previousDays = days.filter((d) => d.date.startsWith(previousDate.slice(0, 7)) && d.date <= previousDate);
  return {
    ...current,
    previousKg: previousDays.length
      ? totals(members, previousDays, people, billForMonth(bills, previousDate.slice(0, 7)), inMonth(previousDate.slice(0, 7))).totalKg
      : null,
  };
}

export type StreakDay = { date: string; state: "done" | "missed" | "waiting" };

export function familyStreak(members: Member[], days: MemberDay[], today: string) {
  const everyone = familyDates(members.map((m) => days.filter((d) => d.userId === m.userId).map((d) => d.date)));
  const week: StreakDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    if (everyone.includes(date)) return { date, state: "done" };
    return { date, state: date === today ? "waiting" : "missed" };
  });
  return {
    streak: currentStreak(everyone, today),
    week,
    doneToday: members.filter((m) => days.some((d) => d.userId === m.userId && d.date === today)).map((m) => m.userId),
  };
}

export function profileAlert(profile: FamilyProfile, mode: Mode, category: AqiCategory | null, go: GoTimeInfo | null): string | null {
  if (!category || !isBad(category)) return null;
  const text = FAMILY_TEXT.alerts;
  const clean = go && !go.tomorrow && !isBad(categoryFor(go.index)) ? go : null;
  if (profile.kind !== "pet") return clean ? text.insideTill(clean.label.split("–")[0], clean.label) : text.insideToday;
  if (profile.petType === "dog") return clean ? text.dogWalk[mode](clean.label) : text.dogShort;
  if (profile.petType === "bird") return text.bird;
  return text.otherPet;
}

export interface ProfileLives {
  safe: number;
  rows: TimelineRow[];
}

export function profileLives(
  profile: FamilyProfile,
  day: HourlyAir[],
  purifier: Purifier,
  aqi: number,
  now: string,
): ProfileLives {
  const lost = livesLost(day, profile.outdoorBlocks, purifier, categoryFor(aqi));
  return {
    safe: Math.floor(Math.min(LIVES_PER_DAY, livesKept(lost))),
    rows: timelineRows(profile.outdoorBlocks, day, now),
  };
}

export interface SquadGoal {
  kind: "ac" | "delivery" | "checkin";
  done: number;
  target: number;
  kg: number;
  inr: number;
}

const nightHours = (c: Checkin) => ({ off: 0, part: 3, whole: 7 })[c.energy.acNight];

// One rule-based goal a week, from what fits this home, counted from this person's own check-ins.
export function squadGoal(setup: SetupAnswers, checkins: Checkin[], today: string): SquadGoal {
  const start = weekStart(today);
  const week = checkins.filter((c) => c.date >= start && c.date <= today);

  if (setup.acs > 0 && !isWinter(today)) {
    const earlier = checkins.filter((c) => c.date < start);
    const usual = earlier.length ? earlier.reduce((sum, c) => sum + nightHours(c), 0) / earlier.length : 7;
    const kwh = AC_KW * 7;
    return {
      kind: "ac",
      target: 7,
      done: week.filter((c) => nightHours(c) <= usual - 1).length,
      kg: kwh * GRID_KG_PER_KWH,
      inr: kwh * ELECTRICITY_INR_PER_KWH,
    };
  }
  if (setup.ordersPerWeek !== "none") {
    const skipped = Math.min(3, ORDERS_BAND_PER_WEEK[setup.ordersPerWeek]);
    return {
      kind: "delivery",
      target: 3,
      done: Math.min(3, week.filter((c) => c.deliveries.food + c.deliveries.grocery + c.deliveries.parcel === 0).length),
      kg: skipped * DELIVERY_KG.food,
      inr: 0,
    };
  }
  return { kind: "checkin", target: 7, done: week.length, kg: 0, inr: 0 };
}

export function whatsappLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
