import { describe, expect, it } from "vitest";
import { badgeStates, heatmap, weekStart, weeklyChallenge } from "./ranks";
import { detailLines, draftFromAnswers, finalizeSetup, isStepComplete, visibleSteps } from "./setup";
import type { Checkin, SetupAnswers } from "./types";

const setup: SetupAnswers = {
  location: { lat: 28.6, lng: 77, area: "Dwarka" },
  people: 4,
  homeType: "flat",
  pets: { dog: 2, cat: 0, bird: 0, other: 0 },
  extraCare: ["elderly"],
  trip: { kind: "college", kmOneWay: 12, daysPerWeek: 6, mode: "two-wheeler", fuel: "petrol", mileage: 40 },
  outdoorBlocks: ["morning"],
  exercise: "no",
  acs: 2,
  acHoursBand: "4-6",
  cooking: "lpg",
  cylinderLasts: "2",
  purifier: "one",
  billBand: "1000-2500",
  diet: "non-veg",
  nonVegFrequency: "few",
  ordersPerWeek: "1-3",
  flights: { domestic: "1-2", international: "0" },
};

function checkin(date: string, changes: Partial<Checkin> = {}): Checkin {
  return {
    date,
    meals: [],
    trips: [],
    energy: { acDayHours: 0, acNight: "off", heaterHours: 0, geyser: "no" },
    deliveries: { food: 0, grocery: 0, parcel: 0 },
    outdoorBlocks: [],
    missionStatus: null,
    co2Breakdown: { electricity: 0, cooking: 0, travel: 0, food: 0, deliveries: 0, oneOffs: 0 },
    livesKept: 5,
    ...changes,
  };
}

const TODAY = "2026-11-04"; // A Wednesday
const metroTrip = [{ mode: "metro" as const, minutes: 20 }];

describe("heatmap", () => {
  it("has twelve weeks of seven days, ending this week", () => {
    const weeks = heatmap([], TODAY);
    expect(weeks).toHaveLength(12);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weekStart(TODAY)).toBe("2026-11-02");
  });

  it("marks check-ins and completed missions", () => {
    const weeks = heatmap([checkin("2026-11-02"), checkin("2026-11-03", { missionStatus: "yes" })], TODAY);
    expect(weeks[11].slice(0, 3)).toEqual(["in", "mission", "missed"]);
  });
});

describe("weekly challenge", () => {
  it("asks vehicle users for Metro days, counting only this week", () => {
    const checkins = [checkin("2026-10-30", { trips: metroTrip }), checkin("2026-11-02", { trips: metroTrip })];
    expect(weeklyChallenge(setup, checkins, TODAY)).toEqual({ kind: "metro", target: 3, done: 1 });
  });

  it("never asks Metro users or home workers to take the Metro", () => {
    const metro = { ...setup, trip: { ...setup.trip, mode: "metro" as const } };
    expect(weeklyChallenge(metro, [], TODAY).kind).toBe("no-delivery");
    const home = { ...setup, ordersPerWeek: "none" as const, trip: { ...setup.trip, kind: "wfh" as const, kmOneWay: 0 } };
    expect(weeklyChallenge(home, [], TODAY).kind).toBe("check-in");
  });
});

describe("badges", () => {
  const earned = (checkins: Checkin[], bills = 0, squad = false) =>
    badgeStates(
      setup,
      checkins,
      Array.from({ length: bills }, (_, i) => ({ periodStart: `2026-0${i + 1}-01`, periodEnd: `2026-0${i + 1}-28`, units: 1, source: "manual" as const })),
      squad,
    )
      .filter((b) => b.earned)
      .map((b) => b.id);

  it("earns nothing for a new user, and lists all ten", () => {
    expect(badgeStates(setup, [], [], false)).toHaveLength(10);
    expect(earned([])).toEqual([]);
  });

  it("earns from real activity", () => {
    expect(earned([checkin("2026-11-02")])).toEqual(["suit-up"]);
    expect(earned([], 3)).toEqual(["paper-trail"]);
    expect(earned([], 0, true)).toEqual(["assemble"]);
    const week = ["2026-11-02", "2026-11-03", "2026-11-04"].map((d) => checkin(d, { trips: metroTrip }));
    expect(earned(week)).toContain("rail-rider");
  });

  it("counts two uploads for one month once", () => {
    const bill = { periodStart: "2026-09-01", periodEnd: "2026-09-30", units: 1, source: "manual" as const };
    const state = badgeStates(setup, [], [bill, bill, bill], false).find((b) => b.id === "paper-trail")!;
    expect(state.earned).toBe(false);
    expect(state.count).toEqual([1, 3]);
  });

  it("counts a seven-day streak", () => {
    const days = Array.from({ length: 7 }, (_, i) => checkin(`2026-10-${String(20 + i).padStart(2, "0")}`));
    const ids = earned(days);
    expect(ids).toContain("seven-day");
    expect(ids).not.toContain("great-responsibility");
  });

  it("gives the fewer-deliveries badge only for a mostly logged week", () => {
    const short = [checkin("2026-11-02")];
    expect(earned(short)).not.toContain("fewer-drops");
    const full = ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"].map((d) => checkin(d));
    expect(earned(full)).toContain("fewer-drops");
  });
});

describe("editing saved answers", () => {
  it("gives back the same answers", () => {
    expect(finalizeSetup(draftFromAnswers(setup))).toEqual(setup);
  });

  it("handles mostly indoors and work from home", () => {
    const home = {
      ...setup,
      outdoorBlocks: [],
      trip: { kind: "wfh" as const, kmOneWay: 0, daysPerWeek: 0, mode: "walk" as const },
    };
    const draft = draftFromAnswers(home);
    expect(draft.outdoor).toEqual(["indoors"]);
    expect(visibleSteps(draft)).not.toContain("mode");
    expect(isStepComplete("outdoors", draft)).toBe(true);
  });

  it("describes each section in a line", () => {
    expect(detailLines(setup, "hero")).toEqual([
      "Dwarka · 4 people · Flat · 2 dogs",
      "Two-wheeler to college · 12 km · 6 days",
      "2 ACs · LPG · purifier in one room",
      "Non-veg · 1–3 deliveries · 1–2 flights",
    ]);
    expect(detailLines(setup, "plain")[3]).toBe("Non-veg · 1–3 orders · 1–2 flights");
  });
});
