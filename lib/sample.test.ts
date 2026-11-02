import { describe, expect, it } from "vitest";
import { dailyBreakdown, totalKg } from "./footprint";
import { currentStreak, longestStreak, rankFor } from "./progress";
import { badgeStates, heatmap } from "./ranks";
import { buildSampleData, SAMPLE_STREAK } from "./sample";

const today = "2026-11-03";
const sample = buildSampleData(today);

describe("sample data", () => {
  it("gives the same result every time", () => {
    expect(buildSampleData(today)).toEqual(sample);
  });

  it("stops before today, so a check-in can still be logged live", () => {
    expect(sample.checkins.some((c) => c.date >= today)).toBe(false);
    expect(sample.checkins.at(-1)?.date).toBe("2026-11-02");
  });

  it("uses the app's own footprint calculation", () => {
    const first = sample.checkins[0];
    expect(first.co2Breakdown).toEqual(dailyBreakdown(first, sample.setup, 1));
    expect(totalKg(first.co2Breakdown)).toBeGreaterThan(0);
  });

  it("has a streak, with missed days in the heat map", () => {
    const dates = sample.checkins.map((c) => c.date);
    expect(currentStreak(dates, today)).toBe(SAMPLE_STREAK);
    expect(longestStreak(dates)).toBeLessThan(30);
    const days = heatmap(sample.checkins, today).flat();
    expect(days).toContain("mission");
    expect(days).toContain("in");
    expect(days).toContain("missed");
  });

  it("shows some lives lost, and more in winter than in the monsoon", () => {
    const average = (month: string) => {
      const days = sample.checkins.filter((c) => c.date.startsWith(month));
      return days.reduce((sum, c) => sum + c.livesKept, 0) / days.length;
    };
    expect(average("2026-10")).toBeLessThan(average("2026-08"));
  });

  it("earns ranks and some badges, but not all of them", () => {
    const xp = sample.xp.reduce((sum, e) => sum + e.xp, 0);
    expect(rankFor(xp).rank).toBeGreaterThan(0);
    const badges = badgeStates(sample.setup, sample.checkins, sample.bills, false, sample.oneOffs, today);
    expect(badges.filter((b) => b.earned).length).toBeGreaterThan(3);
    expect(badges.find((b) => b.id === "great-responsibility")?.earned).toBe(false);
    expect(badges.find((b) => b.id === "paper-trail")?.earned).toBe(true);
  });

  it("has a bill for each of the last three full months", () => {
    expect(sample.bills.map((b) => b.periodEnd)).toEqual(["2026-08-31", "2026-09-30", "2026-10-31"]);
  });
});
