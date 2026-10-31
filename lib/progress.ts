import { LATE_FILL_DAYS, RANK_THRESHOLDS } from "./factors";

const DAY_MS = 86_400_000;

function dayNumber(date: string): number {
  return Math.round(Date.parse(`${date}T00:00:00Z`) / DAY_MS);
}

export function canFillLate(date: string, today: string): boolean {
  const age = dayNumber(today) - dayNumber(date);
  return age >= 0 && age <= LATE_FILL_DAYS;
}

// A streak survives until today is over, so an unfinished today doesn't break it.
export function currentStreak(dates: string[], today: string): number {
  const days = new Set(dates.map(dayNumber));
  let day = dayNumber(today);
  if (!days.has(day)) day -= 1;
  let streak = 0;
  while (days.has(day)) {
    streak += 1;
    day -= 1;
  }
  return streak;
}

export function longestStreak(dates: string[]): number {
  const days = [...new Set(dates.map(dayNumber))].sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  days.forEach((day, i) => {
    run = i > 0 && day === days[i - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  });
  return longest;
}

// Days when every app member checked in.
export function familyDates(memberDates: string[][]): string[] {
  if (memberDates.length === 0) return [];
  const [first, ...rest] = memberDates;
  return first.filter((date) => rest.every((dates) => dates.includes(date)));
}

export interface RankProgress {
  rank: number; // 0-based index into RANK_THRESHOLDS
  xpToNext: number | null; // null at the top rank
  progress: number; // 0 to 1 through the current rank
}

export function rankFor(xp: number): RankProgress {
  let rank = 0;
  RANK_THRESHOLDS.forEach((threshold, i) => {
    if (xp >= threshold) rank = i;
  });
  const next = RANK_THRESHOLDS[rank + 1];
  if (next === undefined) return { rank, xpToNext: null, progress: 1 };
  const start = RANK_THRESHOLDS[rank];
  return { rank, xpToNext: next - xp, progress: (xp - start) / (next - start) };
}
