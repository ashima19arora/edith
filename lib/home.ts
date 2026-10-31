// The logic behind Home, kept apart from the screen so it can be tested.

import { MISSIONS, type Mission, type MissionContext, type Saving } from "@/config/missions";
import { categoryFor, goTime, hourlyIndex, type GoTimeWindow } from "./aqi";
import {
  AC_HOURS_BAND,
  AQI_BAD_CATEGORIES,
  LIVES_LOST_PER_OUTDOOR_HOUR,
  LIVES_PER_DAY,
  OUTDOOR_HOURS_PER_BLOCK,
  SPEED_KMH,
} from "./factors";
import { biggestSource, dailyBreakdown, isWinter, monthToDate, sameDateLastMonth, totalKg } from "./footprint";
import { HOME_TEXT } from "./labels";
import { blockLoss, exerciseBlocks, predictedLivesLost } from "./lives";
import type {
  AqiCategory,
  Bill,
  Checkin,
  Co2Breakdown,
  EnergyLog,
  HourlyAir,
  Meal,
  Mode,
  OneOff,
  SetupAnswers,
  Trip,
} from "./types";

const hourOf = (time: string) => Number(time.slice(11, 13));

function clock(hour: number): string {
  const h = hour % 24;
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve} ${h < 12 ? "AM" : "PM"}`;
}

// "2–4 PM", or "11 AM–1 PM" across noon. A window's end is its last hour, so it finishes an hour later.
export function windowLabel(window: GoTimeWindow): string {
  const start = hourOf(window.start);
  const end = hourOf(window.end) + 1;
  const [startText, startPeriod] = clock(start).split(" ");
  const [endText, endPeriod] = clock(end).split(" ");
  return startPeriod === endPeriod ? `${startText}–${endText} ${endPeriod}` : `${clock(start)}–${clock(end)}`;
}

export function isBad(category: AqiCategory): boolean {
  return AQI_BAD_CATEGORIES.includes(category);
}

export interface GoTimeInfo {
  window: GoTimeWindow;
  tomorrow: boolean;
  label: string;
  index: number;
}

// Today's cleanest window still ahead, or tomorrow's once today's daytime has passed.
export function nextGoTime(hours: HourlyAir[], date: string, tomorrow: string, now: string): GoTimeInfo | null {
  const today = goTime(hours, date, now);
  const window = today ?? goTime(hours, tomorrow);
  if (!window) return null;
  return { window, tomorrow: !today, label: windowLabel(window), index: Math.round(window.index) };
}

export function headline(mode: Mode, category: AqiCategory | null, go: GoTimeInfo | null, now: string): string {
  const text = HOME_TEXT.headline[mode];
  if (!category) return text.unknown;
  if (category === "Good" || category === "Satisfactory") return text.clean;
  if (!go) return isBad(category) ? text.heavyNoWindow : text.okayNoWindow;
  if (!isBad(category)) return go.tomorrow ? text.okayTomorrow(go.label) : text.okay(go.label);
  if (go.tomorrow) return text.heavyTomorrow(go.label);
  if (isBad(categoryFor(go.index))) return text.heavyAllDay(go.label);
  const start = hourOf(go.window.start);
  if (now >= go.window.start && now <= go.window.end) return text.windowOpen(clock(hourOf(go.window.end) + 1));
  return text.heavyUntil(mode === "hero" ? clock(start).split(" ")[0] : clock(start));
}

export interface CareAlert {
  people: string | null;
  pets: string | null;
}

// Only when the air is Poor or worse, and only for those it matters to at this home.
export function careAlert(mode: Mode, setup: SetupAnswers, category: AqiCategory | null, go: GoTimeInfo | null): CareAlert | null {
  if (!category || !isBad(category)) return null;
  const text = HOME_TEXT.alert[mode];
  const groups: string[] = [];
  if (setup.extraCare.includes("children")) groups.push(text.children);
  if (setup.extraCare.includes("elderly")) groups.push(text.elderly);
  if (setup.extraCare.includes("breathing") || setup.extraCare.includes("heart")) groups.push(text.breathing);

  const clean = go && !go.tomorrow && !isBad(categoryFor(go.index));
  const who = groups.join(" and ");
  const people = !who ? null : clean ? text.insideTill(who, clock(hourOf(go.window.start))) : text.insideToday(who);

  const { dog, cat, bird, other } = setup.pets;
  const petLines: string[] = [];
  if (dog > 0) petLines.push(text.dog(dog));
  if (bird > 0) petLines.push(text.bird);
  if (cat > 0 || other > 0) petLines.push(text.otherPets);
  const pets = petLines.length ? petLines.join(" ") : null;

  return people || pets ? { people, pets } : null;
}

export interface ChartBar {
  label: string;
  aqi: number;
  category: AqiCategory;
  inWindow: boolean;
}

// Nine bars from 6 AM to 10 PM, two hours apart.
export function chartBars(hours: HourlyAir[], date: string, go: GoTimeInfo | null): ChartBar[] {
  const bars: ChartBar[] = [];
  for (let hour = 6; hour <= 22; hour += 2) {
    const time = `${date}T${String(hour).padStart(2, "0")}:00`;
    const slot = hours.find((h) => h.time === time);
    const result = slot && hourlyIndex(slot);
    if (!result) continue;
    const inWindow =
      !!go && !go.tomorrow && hour >= hourOf(go.window.start) && hour <= hourOf(go.window.end) + 1;
    bars.push({ label: clock(hour), aqi: result.aqi, category: result.category, inWindow });
  }
  return bars;
}

export interface LivesInfo {
  safe: number;
  atRisk: number;
  keepMore: number; // Hearts saved by moving outdoor time into Go Time
  hasWalk: boolean;
}

export function livesInfo(day: HourlyAir[], setup: SetupAnswers, aqi: number, go: GoTimeInfo | null): LivesInfo {
  const lost = predictedLivesLost(day, setup, aqi);
  const atRisk = Math.min(LIVES_PER_DAY, Math.ceil(lost));
  const walk = exerciseBlocks(setup.exercise);
  const movable = walk.length ? walk : setup.outdoorBlocks;

  let keepMore = 0;
  if (go && !go.tomorrow) {
    const atGoTime = LIVES_LOST_PER_OUTDOOR_HOUR[categoryFor(go.index)] * OUTDOOR_HOURS_PER_BLOCK;
    const saved = movable.reduce((sum, block) => sum + Math.max(0, blockLoss(block, day) - atGoTime), 0);
    keepMore = Math.min(atRisk, Math.round(saved));
  }
  return { safe: LIVES_PER_DAY - atRisk, atRisk, keepMore, hasWalk: walk.length > 0 };
}

export interface FootprintInfo {
  kg: number;
  previousKg: number | null; // Null in the first month, when there's nothing to compare with
}

export function footprintInfo(
  date: string,
  checkins: Checkin[],
  oneOffs: OneOff[],
  bills: Bill[],
  setup: SetupAnswers,
): FootprintInfo {
  const kg = totalKg(monthToDate(date, checkins, oneOffs, bills, setup).breakdown);
  const previousDate = sameDateLastMonth(date);
  const hadLastMonth = checkins.some((c) => c.date.startsWith(previousDate.slice(0, 7)));
  return {
    kg,
    previousKg: hadLastMonth ? totalKg(monthToDate(previousDate, checkins, oneOffs, bills, setup).breakdown) : null,
  };
}

// An ordinary day for this user, from their setup answers.
export function typicalDay(setup: SetupAnswers, date: string) {
  const meat: Record<SetupAnswers["nonVegFrequency"], Meal> = { daily: "chicken", few: "chicken", rarely: "veg" };
  const last: Meal = setup.diet === "veg" ? "veg" : setup.diet === "egg" ? "egg" : meat[setup.nonVegFrequency];
  const meals: Meal[] = ["veg", "veg", last];

  const trips: Trip[] = [];
  if (setup.trip.kind !== "wfh" && setup.trip.kmOneWay > 0) {
    const minutes = (setup.trip.kmOneWay / SPEED_KMH[setup.trip.mode]) * 60;
    trips.push({ mode: setup.trip.mode, minutes }, { mode: setup.trip.mode, minutes });
  }

  const energy: EnergyLog = {
    acDayHours: isWinter(date) || setup.acs === 0 ? 0 : AC_HOURS_BAND[setup.acHoursBand],
    acNight: "off",
    heaterHours: 0,
    geyser: "no",
  };
  return { meals, trips, energy, deliveries: { food: 0, grocery: 0, parcel: 0 } };
}

export function applicableMissions(context: MissionContext): (Mission & { saving: Saving })[] {
  return MISSIONS.filter((m) => m.applies(context))
    .map((m) => ({ ...m, saving: m.saves(context) }))
    .filter((m) => m.saving.kg > 0);
}

// Rule-based pick: the biggest sector that has a mission, rotating through its largest by day.
export function pickMission(context: MissionContext, date: string): (Mission & { saving: Saving }) | null {
  const missions = applicableMissions(context);
  if (missions.length === 0) return null;

  const breakdown = dailyBreakdown(typicalDay(context.setup, date), context.setup);
  const sectors = (Object.keys(breakdown) as (keyof Co2Breakdown)[]).sort((a, b) => breakdown[b] - breakdown[a]);
  const sector = sectors.find((s) => missions.some((m) => m.sector === s)) ?? biggestSource(breakdown);

  const inSector = missions.filter((m) => m.sector === sector).sort((a, b) => b.saving.kg - a.saving.kg);
  // Tiny actions don't earn a daily slot when a much bigger one is available.
  const top = inSector.filter((m) => m.saving.kg >= inSector[0].saving.kg * 0.2).slice(0, 3);
  const dayNumber = Math.round(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
  return top[dayNumber % top.length];
}
