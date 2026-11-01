import { describe, expect, it } from "vitest";
import { DIWALI, isDiwaliSeason } from "@/config/diwali";
import {
  defenceTips,
  forecastBars,
  historyDays,
  outdoorHoursSoFar,
  pollutantRows,
  timelineRows,
  tomorrowCategory,
  weekTrend,
  worstWindow,
} from "./airspace";
import {
  buildCheckin,
  checkinSteps,
  currentCalibration,
  estimatedMonthUnits,
  isUsualTravelDay,
  prefillCheckin,
  xpForCheckin,
} from "./checkin";
import { lastSixMonths, shiftMonth, sourceRows, topCuts, yearlyPace } from "./collateral";
import { monthToDate } from "./footprint";
import { nextGoTime } from "./home";
import type { Bill, Checkin, HourlyAir, SetupAnswers } from "./types";

const setup: SetupAnswers = {
  location: { lat: 28.6, lng: 77, area: "Dwarka" },
  people: 4,
  homeType: "flat",
  pets: { dog: 1, cat: 0, bird: 0, other: 0 },
  extraCare: ["elderly"],
  trip: { kind: "college", kmOneWay: 12, daysPerWeek: 6, mode: "two-wheeler", fuel: "petrol" },
  outdoorBlocks: ["morning", "evening"],
  exercise: "evenings",
  acs: 2,
  acHoursBand: "4-6",
  cooking: "lpg",
  cylinderLasts: "2",
  purifier: "one",
  billBand: null,
  diet: "non-veg",
  nonVegFrequency: "few",
  ordersPerWeek: "1-3",
  flights: { domestic: "0", international: "0" },
};

const noEnergy = { acDayHours: 0, acNight: "off", heaterHours: 0, geyser: "no" } as const;

function checkin(date: string, changes: Partial<Checkin> = {}): Checkin {
  return {
    date,
    meals: ["veg"],
    trips: [],
    energy: noEnergy,
    deliveries: { food: 0, grocery: 0, parcel: 0 },
    outdoorBlocks: ["morning"],
    missionStatus: null,
    co2Breakdown: { electricity: 1, cooking: 0, travel: 2, food: 0, deliveries: 0, oneOffs: 0 },
    livesKept: 5,
    ...changes,
  };
}

function day(date: string, pm25: (hour: number) => number): HourlyAir[] {
  return Array.from({ length: 24 }, (_, h) => ({
    time: `${date}T${String(h).padStart(2, "0")}:00`,
    concentrations: { pm25: pm25(h), pm10: 10, no2: 10 },
  }));
}

const TODAY = "2026-11-04"; // Wednesday
const TOMORROW = "2026-11-05";
const hours = [...day(TODAY, (h) => (h === 21 || h === 22 ? 300 : h === 14 || h === 15 ? 45 : 110)), ...day(TOMORROW, () => 100)];
const go = nextGoTime(hours, TODAY, TOMORROW, `${TODAY}T08:00`)!;

describe("airspace", () => {
  it("finds the worst two hours and marks the bars", () => {
    const worst = worstWindow(hours, 8)!;
    expect(worst.label).toBe("9–11 PM");
    const bars = forecastBars(hours, 8, go, worst);
    expect(bars).toHaveLength(24);
    expect(bars.filter((b) => b.go).map((b) => b.hour)).toEqual([14, 15]);
    expect(bars.filter((b) => b.worst).map((b) => b.hour)).toEqual([21, 22]);
  });

  it("describes tomorrow", () => {
    expect(tomorrowCategory(hours, TOMORROW)).toBe("Poor");
    expect(tomorrowCategory(hours, "2026-12-01")).toBeNull();
  });

  it("lists pollutants worst first and skips missing ones", () => {
    const rows = pollutantRows({ time: "", concentrations: { pm25: 135, no2: 62, o3: null } });
    expect(rows.map((r) => r.id)).toEqual(["pm25", "no2"]);
    expect(rows[0].category).toBe("Very Poor");
    expect(pollutantRows(undefined)).toEqual([]);
  });

  it("builds seven days of history and compares weeks", () => {
    const fortnight: HourlyAir[] = [];
    for (let d = 14; d >= 0; d--) {
      const date = new Date(Date.parse(`${TODAY}T00:00:00Z`) - d * 86_400_000).toISOString().slice(0, 10);
      fortnight.push(...day(date, () => (d < 7 ? 150 : 70)));
    }
    const now = fortnight.findIndex((h) => h.time === `${TODAY}T20:00`);
    const history = historyDays(fortnight, now, TODAY);
    expect(history).toHaveLength(7);
    expect(history[6].date).toBe(TODAY);
    expect(weekTrend(fortnight, now, TODAY)).toBe("worse");
    expect(weekTrend(hours, 8, TODAY)).toBeNull();
  });

  it("marks later blocks as planned and counts only hours gone by", () => {
    const rows = timelineRows(["evening", "morning"], hours.slice(0, 24), `${TODAY}T12:00`);
    expect(rows.map((r) => [r.block, r.planned])).toEqual([["morning", false], ["evening", true]]);
    expect([...outdoorHoursSoFar(["morning", "evening"], `${TODAY}T12:00`)]).toEqual([9]);
  });

  it("fits safety tips to the air and the home", () => {
    const heavy = defenceTips("hero", "Very Poor", setup, go);
    expect(heavy.some((t) => t.text.includes("N95"))).toBe(true);
    expect(heavy.some((t) => t.tag === "family")).toBe(true);
    expect(heavy.some((t) => t.text.includes("dog"))).toBe(true);
    expect(heavy.some((t) => t.text.includes("irds"))).toBe(false);
    const alone = { ...setup, extraCare: ["none" as const], pets: { dog: 0, cat: 0, bird: 0, other: 0 }, exercise: "no" as const };
    expect(defenceTips("plain", "Very Poor", alone, go).some((t) => t.tag)).toBe(false);
    expect(defenceTips("hero", "Good", setup, go).some((t) => t.text.includes("N95"))).toBe(false);
  });

  it("shows Diwali only in season, and states no unconfirmed rule", () => {
    expect(isDiwaliSeason("2026-11-08")).toBe(true);
    expect(isDiwaliSeason("2026-10-20")).toBe(false);
    expect(isDiwaliSeason("2026-11-20")).toBe(false);
    expect(DIWALI.firecrackers).toBeNull();
    expect(DIWALI.noticeUrl).toBeNull();
  });
});

describe("check-in", () => {
  it("skips what doesn't apply", () => {
    expect(checkinSteps(setup, "2026-06-01", true)).toHaveLength(6);
    expect(checkinSteps(setup, "2026-06-01", false)).not.toContain("mission");
    expect(checkinSteps({ ...setup, acs: 0 }, "2026-06-01", false)).not.toContain("energy");
    expect(checkinSteps({ ...setup, acs: 0 }, TODAY, false)).toContain("energy");
  });

  it("knows usual travel days", () => {
    expect(isUsualTravelDay(setup, "2026-11-07")).toBe(true); // Saturday
    expect(isUsualTravelDay(setup, "2026-11-08")).toBe(false); // Sunday
    expect(isUsualTravelDay({ ...setup, trip: { ...setup.trip, kind: "wfh" } }, TODAY)).toBe(false);
  });

  it("prefills from setup, then yesterday, then today's own answers", () => {
    const first = prefillCheckin(setup, [], TODAY);
    expect(first.trips).toHaveLength(2);
    expect(first.outdoorBlocks).toEqual(["morning", "evening"]);

    const yesterday = checkin("2026-11-03", { meals: ["mutton"], outdoorBlocks: ["night"], trips: [{ mode: "metro", minutes: 30 }] });
    const second = prefillCheckin(setup, [yesterday], TODAY);
    expect(second.meals).toEqual(["mutton"]);
    expect(second.trips).toEqual([{ mode: "metro", minutes: 30 }]);

    const sunday = prefillCheckin(setup, [yesterday], "2026-11-08");
    expect(sunday.trips).toEqual([]);

    const today = checkin(TODAY, { meals: ["egg"] });
    expect(prefillCheckin(setup, [yesterday, today], TODAY).meals).toEqual(["egg"]);
  });

  it("computes the day's footprint and lives from the answers", () => {
    const draft = prefillCheckin(setup, [], TODAY);
    const heavy = day(TODAY, () => 150);
    const built = buildCheckin(draft, setup, TODAY, heavy, 350, "yes", 1);
    expect(built.co2Breakdown.travel).toBeGreaterThan(0);
    expect(built.livesKept).toBe(3);
    expect(buildCheckin({ ...draft, outdoorBlocks: [] }, setup, TODAY, heavy, 350, null, 1).livesKept).toBe(5);
    expect(buildCheckin(draft, setup, TODAY, [], null, null, 1).livesKept).toBe(5);
  });

  it("awards XP once, and only for what's new", () => {
    const first = checkin(TODAY);
    expect(xpForCheckin(first, []).map((e) => e.xp)).toEqual([10]);
    expect(xpForCheckin(first, [first])).toEqual([]);
    expect(xpForCheckin({ ...first, missionStatus: "yes" }, [first]).map((e) => e.xp)).toEqual([20]);
    const done = { ...first, missionStatus: "yes" as const };
    expect(xpForCheckin(done, [done])).toEqual([]);
  });

  it("adds streak bonuses on the day they're reached", () => {
    const six = ["10-29", "10-30", "10-31", "11-01", "11-02", "11-03"].map((d) => checkin(`2026-${d}`));
    expect(xpForCheckin(checkin(TODAY), six).map((e) => e.kind)).toEqual(["checkin", "streak7"]);
  });

  it("tunes future estimates from real bills, but not from too few days", () => {
    const logged = Array.from({ length: 10 }, (_, i) => checkin(`2026-09-${String(i + 1).padStart(2, "0")}`));
    const bill: Bill = { periodStart: "2026-09-01", periodEnd: "2026-09-30", units: 330, source: "manual" };
    const estimate = estimatedMonthUnits("2026-09", logged, setup)!;
    expect(estimate).toBeCloseTo(((10 * 4) / 0.727) * 3);
    expect(currentCalibration([bill], logged, setup)).toBeCloseTo(1 + (2 - 1) * 0.5);
    expect(currentCalibration([bill], logged.slice(0, 3), setup)).toBe(1);
    expect(currentCalibration([], logged, setup)).toBe(1);
  });
});

describe("collateral", () => {
  const checkins = [checkin("2026-09-10"), checkin("2026-11-01"), checkin("2026-11-02"), checkin("2026-11-03")];

  it("shows six months ending now, and marks those with a bill", () => {
    const bill: Bill = { periodStart: "2026-09-01", periodEnd: "2026-09-30", units: 40, source: "photo" };
    const bars = lastSixMonths(TODAY, checkins, [], [bill], setup);
    expect(bars.map((b) => b.month)).toEqual(["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"]);
    expect(bars[3].fromBill).toBe(true);
    expect(bars[5].kg).toBe(9);
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("gives shares and labels the biggest source", () => {
    const rows = sourceRows({ electricity: 1, cooking: 0, travel: 3, food: 0, deliveries: 0, oneOffs: 0 });
    const travel = rows.find((r) => r.source === "travel")!;
    expect(travel.biggest).toBe(true);
    expect(travel.share).toBe(0.75);
    expect(rows.filter((r) => r.biggest)).toHaveLength(1);
    expect(sourceRows({ electricity: 0, cooking: 0, travel: 0, food: 0, deliveries: 0, oneOffs: 0 }).some((r) => r.biggest)).toBe(false);
  });

  it("picks three cuts from different parts of life", () => {
    const cuts = topCuts({ setup, winter: false });
    expect(cuts).toHaveLength(3);
    expect(new Set(cuts.map((c) => c.mission.sector)).size).toBe(3);
    expect(cuts[0].kg).toBeGreaterThanOrEqual(cuts[1].kg);
  });

  it("works out the yearly pace only with a few days logged", () => {
    expect(yearlyPace(TODAY, checkins, 9)).toBeCloseTo(((9 / 3) * 365) / 1000);
    expect(yearlyPace(TODAY, checkins.slice(0, 2), 9)).toBeNull();
  });

  it("spreads setup's flights across the month", () => {
    const flying = { ...setup, flights: { domestic: "1-2" as const, international: "0" as const } };
    const { breakdown } = monthToDate("2026-11-15", checkins, [], [], flying);
    expect(breakdown.oneOffs).toBeCloseTo(34.75 * (15 / 30));
    expect(monthToDate("2026-08-15", checkins, [], [], flying).breakdown.oneOffs).toBe(0);
  });
});
