import { describe, expect, it } from "vitest";
import { MISSIONS, metroFare, type MissionContext } from "@/config/missions";
import {
  applicableMissions,
  careAlert,
  chartBars,
  footprintInfo,
  headline,
  livesInfo,
  nextGoTime,
  pickMission,
  typicalDay,
  windowLabel,
} from "./home";
import type { Checkin, HourlyAir, SetupAnswers } from "./types";

const setup: SetupAnswers = {
  location: { lat: 28.6, lng: 77, area: "Dwarka" },
  people: 4,
  homeType: "flat",
  pets: { dog: 2, cat: 0, bird: 0, other: 0 },
  extraCare: ["children", "elderly"],
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

const DATE = "2026-11-03";
const TOMORROW = "2026-11-04";

function day(date: string, pm25: (hour: number) => number): HourlyAir[] {
  return Array.from({ length: 24 }, (_, h) => ({
    time: `${date}T${String(h).padStart(2, "0")}:00`,
    concentrations: { pm25: pm25(h), pm10: 10, no2: 10 },
  }));
}

const cleanAfternoon = [...day(DATE, (h) => (h === 14 || h === 15 ? 45 : 150)), ...day(TOMORROW, () => 150)];
const go = nextGoTime(cleanAfternoon, DATE, TOMORROW, `${DATE}T08:00`)!;

describe("go time", () => {
  it("labels windows", () => {
    expect(go.label).toBe("2–4 PM");
    expect(windowLabel({ start: `${DATE}T11:00`, end: `${DATE}T12:00`, index: 1 })).toBe("11 AM–1 PM");
    expect(windowLabel({ start: `${DATE}T10:00`, end: `${DATE}T11:00`, index: 1 })).toBe("10 AM–12 PM");
  });

  it("moves to tomorrow once today's daytime has passed", () => {
    const late = nextGoTime(cleanAfternoon, DATE, TOMORROW, `${DATE}T22:00`)!;
    expect(late.tomorrow).toBe(true);
  });
});

describe("headline", () => {
  it("says stay in till the clean window", () => {
    expect(headline("hero", "Very Poor", go, `${DATE}T08:00`)).toBe("Heavy air today! Stay in till 2, then you're good to go.");
    expect(headline("plain", "Very Poor", go, `${DATE}T08:00`)).toBe("The air is heavy today. Stay in till 2 PM, then it's fine to go out.");
  });

  it("doesn't promise good air when the best window is still bad", () => {
    const allBad = [...day(DATE, () => 150), ...day(TOMORROW, () => 150)];
    const bad = nextGoTime(allBad, DATE, TOMORROW, `${DATE}T08:00`)!;
    const text = headline("hero", "Very Poor", bad, `${DATE}T08:00`);
    expect(text).not.toContain("good to go");
    expect(text).toContain("least bad");
  });

  it("covers clean air, an open window and no data", () => {
    expect(headline("hero", "Good", go, `${DATE}T08:00`)).toBe("Clean skies! Perfect day for a walk.");
    expect(headline("hero", "Very Poor", go, `${DATE}T14:00`)).toContain("till 4 PM");
    expect(headline("plain", null, null, `${DATE}T08:00`)).toContain("can't");
  });
});

describe("care alert", () => {
  it("stays quiet when the air isn't bad", () => {
    expect(careAlert("hero", setup, "Moderate", go)).toBeNull();
  });

  it("stays quiet with nobody at risk and no pets", () => {
    const alone = { ...setup, extraCare: ["none" as const], pets: { dog: 0, cat: 0, bird: 0, other: 0 } };
    expect(careAlert("hero", alone, "Very Poor", go)).toBeNull();
  });

  it("names the household's own people and pets", () => {
    const alert = careAlert("hero", setup, "Very Poor", go)!;
    expect(alert.people).toBe("Keep the little ones and elders inside till 2 PM.");
    expect(alert.pets).toContain("dogs");
    expect(alert.pets).not.toContain("birds");
  });
});

describe("care alert names", () => {
  const dadi = { id: "1", kind: "elder" as const, name: "Dadi", careNeeds: [], petType: null, outdoorBlocks: [] };
  const eva = { id: "2", kind: "pet" as const, name: "Eva", careNeeds: [], petType: "dog" as const, outdoorBlocks: [] };

  it("uses real names from family profiles", () => {
    const alert = careAlert("hero", setup, "Very Poor", go, [dadi, eva])!;
    expect(alert.people).toBe("Keep the little ones and Dadi inside till 2 PM.");
    expect(alert.pets).toBe("Walk Eva during Go Time, and keep it short.");
  });

  it("alerts for a profile even if setup didn't mention them", () => {
    const quiet = { ...setup, extraCare: ["none" as const], pets: { dog: 0, cat: 0, bird: 0, other: 0 } };
    expect(careAlert("plain", quiet, "Poor", go, [dadi])!.people).toBe("Keep Dadi inside till 2 PM.");
  });
});

describe("chart", () => {
  it("has nine bars and marks the window", () => {
    const bars = chartBars(cleanAfternoon, DATE, go);
    expect(bars).toHaveLength(9);
    expect(bars.filter((b) => b.inWindow).map((b) => b.label)).toEqual(["2 PM", "4 PM"]);
  });
});

describe("lives", () => {
  it("counts hearts at risk and what moving the walk keeps", () => {
    const info = livesInfo(cleanAfternoon.slice(0, 24), setup, 350, go);
    expect(info.atRisk).toBe(3);
    expect(info.safe).toBe(2);
    expect(info.keepMore).toBe(1);
    expect(info.hasWalk).toBe(true);
  });

  it("never loses hearts for an indoor person on a clean day", () => {
    const home = { ...setup, outdoorBlocks: [], exercise: "no" as const };
    expect(livesInfo(day(DATE, () => 10), home, 30, go)).toMatchObject({ atRisk: 0, safe: 5 });
  });
});

describe("footprint", () => {
  const checkin = (date: string, kg: number): Checkin => ({
    date,
    meals: [],
    trips: [],
    energy: { acDayHours: 0, acNight: "off", heaterHours: 0, geyser: "no" },
    deliveries: { food: 0, grocery: 0, parcel: 0 },
    outdoorBlocks: [],
    missionStatus: null,
    co2Breakdown: { electricity: 0, cooking: 0, travel: kg, food: 0, deliveries: 0, oneOffs: 0 },
    livesKept: 5,
  });

  it("has nothing to compare in the first month", () => {
    expect(footprintInfo(DATE, [checkin("2026-11-01", 5)], [], [], setup)).toEqual({ kg: 5, previousKg: null });
  });

  it("compares with the same date last month, not the whole month", () => {
    const checkins = [checkin("2026-10-02", 4), checkin("2026-10-20", 90), checkin("2026-11-01", 3)];
    expect(footprintInfo(DATE, checkins, [], [], setup)).toEqual({ kg: 3, previousKg: 4 });
  });
});

describe("typical day", () => {
  it("skips travel for work from home", () => {
    const wfh = { ...setup, trip: { ...setup.trip, kind: "wfh" as const, kmOneWay: 0 } };
    expect(typicalDay(wfh, DATE).trips).toEqual([]);
  });

  it("uses no AC in winter", () => {
    expect(typicalDay(setup, DATE).energy.acDayHours).toBe(0);
    expect(typicalDay(setup, "2026-06-01").energy.acDayHours).toBe(5);
  });
});

describe("missions", () => {
  const context: MissionContext = { setup, winter: true };

  it("has about thirty missions with unique ids", () => {
    expect(MISSIONS.length).toBeGreaterThanOrEqual(28);
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(MISSIONS.length);
  });

  it("charges Metro fares by distance", () => {
    expect(metroFare(1)).toBe(11);
    expect(metroFare(12)).toBe(32);
    expect(metroFare(13)).toBe(43);
    expect(metroFare(40)).toBe(64);
  });

  it("computes Metro savings from the user's own trip", () => {
    const metro = applicableMissions(context).find((m) => m.id === "metro-instead")!;
    expect(metro.saving.kg).toBeCloseTo((2.3 / 45) * 24 - 0.03 * 24);
    expect(metro.saving.inr).toBeCloseTo((102.12 / 45) * 24 - 64);
  });

  it("never suggests what doesn't fit", () => {
    const ids = (c: MissionContext) => applicableMissions(c).map((m) => m.id);
    expect(ids({ ...context, setup: { ...setup, trip: { ...setup.trip, mode: "metro" } } })).not.toContain("metro-instead");
    expect(ids({ setup: { ...setup, acs: 0 }, winter: false })).not.toContain("ac-26");
    expect(ids(context)).not.toContain("ac-26");
    expect(ids({ ...context, setup: { ...setup, diet: "veg" } })).not.toContain("veg-dinner");
    expect(ids({ ...context, setup: { ...setup, cooking: "induction" } })).not.toContain("lid-on");
    expect(ids({ ...context, setup: { ...setup, ordersPerWeek: "none" } })).not.toContain("club-orders");
    expect(ids(context)).not.toContain("heater-less");
    expect(ids({ ...context, lastEnergy: { ...noEnergy, heaterHours: 2 } })).toContain("heater-less");
    const wfh = { ...setup, trip: { ...setup.trip, kind: "wfh" as const, kmOneWay: 0, mode: "walk" as const } };
    expect(applicableMissions({ ...context, setup: wfh }).filter((m) => m.sector === "travel")).toEqual([]);
  });

  it("picks from the user's biggest sector, and varies by day", () => {
    const first = pickMission(context, DATE)!;
    const ids = new Set(["2026-11-03", "2026-11-04", "2026-11-05"].map((d) => pickMission(context, d)!.id));
    expect(first).toBeTruthy();
    expect(ids.size).toBeGreaterThan(1);
  });
});

const noEnergy = { acDayHours: 0, acNight: "off", heaterHours: 0, geyser: "no" } as const;
