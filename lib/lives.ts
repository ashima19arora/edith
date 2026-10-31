import { categoryFor, hourlyIndex } from "./aqi";
import {
  LIVES_LOST_INDOORS,
  LIVES_LOST_PER_OUTDOOR_HOUR,
  LIVES_PER_DAY,
  OUTDOOR_HOURS_PER_BLOCK,
  TIME_BLOCK_HOURS,
} from "./factors";
import type { AqiCategory, HourlyAir, Purifier, SetupAnswers, TimeBlock } from "./types";

export function blockHours(block: TimeBlock): number[] {
  const [start, end] = TIME_BLOCK_HOURS[block];
  return Array.from({ length: end - start }, (_, i) => start + i);
}

// Exercise is an extra outdoor hour in its own block, on top of the usual routine.
export function exerciseBlocks(exercise: SetupAnswers["exercise"]): TimeBlock[] {
  if (exercise === "mornings") return ["early"];
  if (exercise === "evenings") return ["evening"];
  if (exercise === "both") return ["early", "evening"];
  return [];
}

// Average loss across a block's hours, since we don't know which of them the user is outside.
function blockLoss(block: TimeBlock, day: HourlyAir[]): number {
  const hours = blockHours(block);
  const slots = day.filter((h) => hours.includes(Number(h.time.slice(11, 13))));
  const losses = slots
    .map(hourlyIndex)
    .filter((r) => r !== null)
    .map((r) => LIVES_LOST_PER_OUTDOOR_HOUR[r.category]);
  if (losses.length === 0) return 0;
  return (losses.reduce((sum, v) => sum + v, 0) / losses.length) * OUTDOOR_HOURS_PER_BLOCK;
}

export function livesLost(
  day: HourlyAir[],
  blocks: TimeBlock[],
  purifier: Purifier,
  dayCategory: AqiCategory,
): number {
  const outdoors = blocks.reduce((sum, block) => sum + blockLoss(block, day), 0);
  const badDay = dayCategory === "Very Poor" || dayCategory === "Severe";
  const indoors = badDay && purifier === "no" ? LIVES_LOST_INDOORS : 0;
  return outdoors + indoors;
}

// Floors at 0. A planning guide, not a medical measure.
export function livesKept(lost: number): number {
  return Math.max(0, LIVES_PER_DAY - lost);
}

// Morning prediction from the usual routine. Pass today's AQI as `dayAqi`.
export function predictedLivesLost(day: HourlyAir[], setup: SetupAnswers, dayAqi: number): number {
  const blocks = [...setup.outdoorBlocks, ...exerciseBlocks(setup.exercise)];
  return livesLost(day, blocks, setup.purifier, categoryFor(dayAqi));
}
