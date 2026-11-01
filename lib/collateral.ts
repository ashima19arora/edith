// The logic behind Collateral / My Footprint.

import type { Mission, MissionContext, Saving } from "@/config/missions";
import { billForMonth, monthToDate, totalKg } from "./footprint";
import { applicableMissions } from "./home";
import type { Bill, Checkin, Co2Breakdown, OneOff, SetupAnswers } from "./types";

export function shiftMonth(month: string, by: number): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1 + by, 1)).toISOString().slice(0, 7);
}

function lastDayOf(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m, 0)).toISOString().slice(0, 10);
}

export interface MonthBar {
  month: string;
  kg: number;
  fromBill: boolean;
  logged: boolean;
}

export function lastSixMonths(
  today: string,
  checkins: Checkin[],
  oneOffs: OneOff[],
  bills: Bill[],
  setup: SetupAnswers,
): MonthBar[] {
  const thisMonth = today.slice(0, 7);
  return Array.from({ length: 6 }, (_, i) => {
    const month = shiftMonth(thisMonth, i - 5);
    const end = month === thisMonth ? today : lastDayOf(month);
    const result = monthToDate(end, checkins, oneOffs, bills, setup);
    return {
      month,
      kg: totalKg(result.breakdown),
      fromBill: !!billForMonth(bills, month),
      logged: checkins.some((c) => c.date.startsWith(month)),
    };
  });
}

// Every source added across the months that have any data.
export function sumBreakdowns(
  today: string,
  checkins: Checkin[],
  oneOffs: OneOff[],
  bills: Bill[],
  setup: SetupAnswers,
): Co2Breakdown {
  const total: Co2Breakdown = { electricity: 0, cooking: 0, travel: 0, food: 0, deliveries: 0, oneOffs: 0 };
  const thisMonth = today.slice(0, 7);
  for (let i = 0; i < 6; i++) {
    const month = shiftMonth(thisMonth, -i);
    const { breakdown } = monthToDate(month === thisMonth ? today : lastDayOf(month), checkins, oneOffs, bills, setup);
    for (const key of Object.keys(total) as (keyof Co2Breakdown)[]) total[key] += breakdown[key];
  }
  return total;
}

export interface SourceRow {
  source: keyof Co2Breakdown;
  kg: number;
  share: number; // Of the total, 0 to 1
  width: number; // Of the biggest bar, 0 to 1
  biggest: boolean;
}

export function sourceRows(breakdown: Co2Breakdown): SourceRow[] {
  const keys = Object.keys(breakdown) as (keyof Co2Breakdown)[];
  const total = keys.reduce((sum, k) => sum + breakdown[k], 0);
  const top = Math.max(...keys.map((k) => breakdown[k]));
  return keys.map((source) => ({
    source,
    kg: breakdown[source],
    share: total > 0 ? breakdown[source] / total : 0,
    width: top > 0 ? breakdown[source] / top : 0,
    biggest: top > 0 && breakdown[source] === top,
  }));
}

// A realistic number of times a month for each kind of change, to turn one day's saving into a month's.
const TIMES_PER_MONTH: Record<keyof Co2Breakdown, number> = {
  travel: 8,
  electricity: 30,
  cooking: 30,
  food: 8,
  deliveries: 4,
  oneOffs: 1,
};

export interface Cut {
  mission: Mission;
  kg: number;
  inr: number;
}

// The three biggest changes that fit this user, from different parts of their life where possible.
export function topCuts(context: MissionContext): Cut[] {
  const monthly = (m: Mission & { saving: Saving }): Cut => ({
    mission: m,
    kg: m.saving.kg * (m.timesPerMonth ?? TIMES_PER_MONTH[m.sector]),
    inr: m.saving.inr * (m.timesPerMonth ?? TIMES_PER_MONTH[m.sector]),
  });
  const cuts = applicableMissions(context).map(monthly).sort((a, b) => b.kg - a.kg);

  const picked: Cut[] = [];
  for (const cut of cuts) {
    if (!picked.some((p) => p.mission.sector === cut.mission.sector)) picked.push(cut);
    if (picked.length === 3) return picked;
  }
  return [...picked, ...cuts.filter((c) => !picked.includes(c))].slice(0, 3);
}

// Tonnes a year at this month's rate so far. Null until there are a few days to go on.
export function yearlyPace(today: string, checkins: Checkin[], kgThisMonth: number): number | null {
  const days = checkins.filter((c) => c.date.startsWith(today.slice(0, 7)) && c.date <= today).length;
  if (days < 3) return null;
  return ((kgThisMonth / days) * 365) / 1000;
}
