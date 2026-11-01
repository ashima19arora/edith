// The logic behind Airspace / Air Today.

import { categoryFor, headlineAqi, hourlyIndex, subIndex } from "./aqi";
import { GO_TIME, OUTDOOR_HOURS_PER_BLOCK, TIME_BLOCK_HOURS } from "./factors";
import { isBad, windowLabel, type GoTimeInfo } from "./home";
import { AIR_TEXT } from "./labels";
import { blockLoss } from "./lives";
import type { AqiCategory, HourlyAir, Mode, Pollutant, SetupAnswers, TimeBlock } from "./types";

const hourOf = (time: string) => Number(time.slice(11, 13));

export interface ForecastBar {
  time: string;
  hour: number;
  aqi: number;
  category: AqiCategory;
  go: boolean;
  worst: boolean;
}

export interface WorstWindow {
  start: string;
  end: string;
  label: string;
}

// The most polluted two contiguous hours in the next 24.
export function worstWindow(hours: HourlyAir[], nowIndex: number): WorstWindow | null {
  const next = hours.slice(nowIndex, nowIndex + 24);
  let worst: { start: string; end: string; score: number } | null = null;
  for (let i = 0; i + GO_TIME.hours <= next.length; i++) {
    const pair = next.slice(i, i + GO_TIME.hours).map(hourlyIndex);
    if (pair.some((r) => !r)) continue;
    const score = pair.reduce((sum, r) => sum + r!.aqi, 0);
    if (!worst || score > worst.score) {
      worst = { start: next[i].time, end: next[i + GO_TIME.hours - 1].time, score };
    }
  }
  return worst && { start: worst.start, end: worst.end, label: windowLabel({ ...worst, index: 0 }) };
}

export function forecastBars(hours: HourlyAir[], nowIndex: number, go: GoTimeInfo | null, worst: WorstWindow | null): ForecastBar[] {
  return hours.slice(nowIndex, nowIndex + 24).flatMap((slot) => {
    const result = hourlyIndex(slot);
    if (!result) return [];
    return [{
      time: slot.time,
      hour: hourOf(slot.time),
      aqi: result.aqi,
      category: result.category,
      go: !!go && slot.time >= go.window.start && slot.time <= go.window.end,
      worst: !!worst && slot.time >= worst.start && slot.time <= worst.end,
    }];
  });
}

// Tomorrow's overall daytime category, for the strip under the chart.
export function tomorrowCategory(hours: HourlyAir[], tomorrow: string): AqiCategory | null {
  const indexes = hours
    .filter((h) => h.time.startsWith(tomorrow) && hourOf(h.time) >= GO_TIME.dayStart && hourOf(h.time) < GO_TIME.dayEnd)
    .map((h) => hourlyIndex(h)?.aqi)
    .filter((v): v is number => v !== undefined);
  if (indexes.length === 0) return null;
  return categoryFor(indexes.reduce((sum, v) => sum + v, 0) / indexes.length);
}

export interface PollutantRow {
  id: Pollutant;
  value: number;
  index: number;
  category: AqiCategory;
}

// Right now, worst first, using each pollutant's latest hourly reading.
export function pollutantRows(hour: HourlyAir | undefined): PollutantRow[] {
  if (!hour) return [];
  const ids: Pollutant[] = ["pm25", "pm10", "no2", "o3", "co", "so2"];
  return ids
    .flatMap((id) => {
      const value = hour.concentrations[id];
      if (value == null) return [];
      const index = subIndex(id, value);
      return [{ id, value, index, category: categoryFor(index) }];
    })
    .sort((a, b) => b.index - a.index);
}

export interface HistoryDay {
  date: string;
  aqi: number;
  category: AqiCategory;
}

// The AQI at the end of each of the last `count` days, ending with today so far.
export function historyDays(hours: HourlyAir[], nowIndex: number, today: string, count = 7): HistoryDay[] {
  const days: HistoryDay[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(Date.parse(`${today}T00:00:00Z`) - i * 86_400_000).toISOString().slice(0, 10);
    const end = date === today ? nowIndex : hours.findIndex((h) => h.time === `${date}T23:00`);
    if (end < 0) continue;
    const result = headlineAqi(hours, end);
    if (result) days.push({ date, aqi: result.aqi, category: result.category });
  }
  return days;
}

export type WeekTrend = "worse" | "better" | "same" | null;

// This week's average against the seven days before it.
export function weekTrend(hours: HourlyAir[], nowIndex: number, today: string): WeekTrend {
  const all = historyDays(hours, nowIndex, today, 14);
  if (all.length < 10) return null;
  const mean = (days: HistoryDay[]) => days.reduce((sum, d) => sum + d.aqi, 0) / days.length;
  const recent = mean(all.slice(-7));
  const earlier = mean(all.slice(0, -7));
  if (recent > earlier * 1.05) return "worse";
  if (recent < earlier * 0.95) return "better";
  return "same";
}

export interface TimelineRow {
  block: TimeBlock;
  planned: boolean;
  cost: number;
}

export function timelineRows(blocks: TimeBlock[], day: HourlyAir[], now: string): TimelineRow[] {
  const hour = hourOf(now);
  return [...new Set(blocks)]
    .sort((a, b) => TIME_BLOCK_HOURS[a][0] - TIME_BLOCK_HOURS[b][0])
    .map((block) => ({ block, planned: hour < TIME_BLOCK_HOURS[block][0], cost: blockLoss(block, day) }));
}

// The hours of the day a user is likely outside, up to now, for the "so far" cigarette count.
export function outdoorHoursSoFar(blocks: TimeBlock[], now: string): Set<number> {
  const hour = hourOf(now);
  const outside = new Set<number>();
  for (const block of blocks) {
    const [start, end] = TIME_BLOCK_HOURS[block];
    const middle = Math.floor((start + end) / 2);
    for (let i = 0; i < OUTDOOR_HOURS_PER_BLOCK; i++) {
      if (middle + i <= hour) outside.add(middle + i);
    }
  }
  return outside;
}

export interface Tip {
  text: string;
  tag?: "family" | "pet";
}

// Actions that change with the air, and fit who actually lives at this home.
export function defenceTips(mode: Mode, category: AqiCategory, setup: SetupAnswers, go: GoTimeInfo | null): Tip[] {
  const text = AIR_TEXT.tips;
  const when = go && !go.tomorrow && !isBad(categoryFor(go.index)) ? go.label : null;
  const windowName = mode === "hero" ? "Go Time" : "the best time out";
  const tips: Tip[] = [];

  if (!isBad(category)) {
    if (category === "Moderate") tips.push({ text: text.moderateOutdoors(when) });
    else tips.push({ text: text.cleanWindows }, { text: text.cleanOutside });
  } else {
    if (category !== "Poor") tips.push({ text: text.n95 });
    tips.push({ text: when ? text.windowsTill(when) : text.windowsShut });
    if (setup.purifier !== "no") tips.push({ text: text.purifierOn });
    else tips.push({ text: text.cleanRoom });
    if (setup.exercise !== "no") tips.push({ text: text.skipExercise });
  }

  const care = setup.extraCare.filter((c) => c === "children" || c === "elderly" || c === "breathing" || c === "heart");
  if (isBad(category) && care.length > 0) tips.push({ text: text.family(when), tag: "family" });
  if (category === "Moderate" && setup.extraCare.includes("breathing")) tips.push({ text: text.sensitive, tag: "family" });

  if (isBad(category) || category === "Moderate") {
    if (setup.pets.dog > 0) tips.push({ text: text.dog(setup.pets.dog, windowName), tag: "pet" });
    if (setup.pets.bird > 0) tips.push({ text: text.bird, tag: "pet" });
    if (setup.pets.cat > 0 || setup.pets.other > 0) tips.push({ text: text.otherPets, tag: "pet" });
  }
  return tips;
}
