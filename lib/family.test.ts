import { describe, expect, it } from "vitest";
import { answerQuestion, chatContext, forecastCard, suggestedQuestions, type AssistantData } from "./assistant";
import { canFillLate } from "./progress";
import { buildCheckin, challengeXp, oneOffKg, wentOutInGoTime } from "./checkin";
import { familyFootprint, familyStreak, profileAlert, profileLives, squadGoal, type FamilyProfile, type Member, type MemberDay } from "./family";
import { nextGoTime } from "./home";
import { badgeStates } from "./ranks";
import type { Checkin, HourlyAir, SetupAnswers } from "./types";

const setup: SetupAnswers = {
  location: { lat: 28.6, lng: 77, area: "Dwarka" },
  people: 4,
  homeType: "flat",
  pets: { dog: 1, cat: 0, bird: 0, other: 0 },
  extraCare: ["elderly"],
  trip: { kind: "college", kmOneWay: 12, daysPerWeek: 6, mode: "two-wheeler", fuel: "petrol" },
  outdoorBlocks: ["morning"],
  exercise: "no",
  acs: 2,
  acHoursBand: "4-6",
  cooking: "lpg",
  cylinderLasts: "2",
  purifier: "no",
  billBand: null,
  diet: "non-veg",
  nonVegFrequency: "few",
  ordersPerWeek: "1-3",
  flights: { domestic: "0", international: "0" },
};

const TODAY = "2026-11-04"; // Wednesday
const TOMORROW = "2026-11-05";

function day(date: string, pm25: (hour: number) => number): HourlyAir[] {
  return Array.from({ length: 24 }, (_, h) => ({
    time: `${date}T${String(h).padStart(2, "0")}:00`,
    concentrations: { pm25: pm25(h), pm10: 10, no2: 10 },
  }));
}

function checkin(date: string, changes: Partial<Checkin> = {}): Checkin {
  return {
    date,
    meals: [],
    trips: [],
    energy: { acDayHours: 0, acNight: "off", heaterHours: 0, geyser: "no" },
    deliveries: { food: 1, grocery: 0, parcel: 0 },
    outdoorBlocks: [],
    missionStatus: null,
    co2Breakdown: { electricity: 0, cooking: 0, travel: 0, food: 0, deliveries: 0, oneOffs: 0 },
    livesKept: 5,
    ...changes,
  };
}

const hours = [...day(TODAY, (h) => (h === 14 || h === 15 ? 45 : 150)), ...day(TOMORROW, () => 150)];
const go = nextGoTime(hours, TODAY, TOMORROW, `${TODAY}T08:00`)!;
const members: Member[] = [
  { userId: "a", displayName: "A", role: "owner" },
  { userId: "b", displayName: "B", role: "member" },
];
const row = (userId: string, date: string, sharedKg = 1, personalKg = 2): MemberDay => ({ userId, date, livesKept: 4, sharedKg, personalKg });
const dadi: FamilyProfile = { id: "1", kind: "elder", name: "Dadi", careNeeds: ["elderly"], petType: null, outdoorBlocks: ["early"] };
const eva: FamilyProfile = { id: "2", kind: "pet", name: "Eva", careNeeds: [], petType: "dog", outdoorBlocks: ["early"] };

describe("family", () => {
  it("adds shared energy once for the home, and personal totals per member", () => {
    const days = [row("a", "2026-11-01"), row("b", "2026-11-01"), row("a", "2026-11-02")];
    const result = familyFootprint(members, days, 4, TODAY);
    expect(result.sharedKg).toBe(8); // A's 2 kg share x 4 people, not A + B added together
    expect(result.personal).toEqual([{ userId: "a", kg: 4 }, { userId: "b", kg: 2 }]);
    expect(result.totalKg).toBe(14);
    expect(result.previousKg).toBeNull();
  });

  it("compares with the same date last month", () => {
    const days = [row("a", "2026-10-02"), row("a", "2026-10-20"), row("a", "2026-11-01")];
    expect(familyFootprint(members, days, 1, TODAY).previousKg).toBe(3);
  });

  it("only counts streak days when everyone checked in", () => {
    const days = [row("a", "2026-11-02"), row("b", "2026-11-02"), row("a", "2026-11-03"), row("b", "2026-11-03"), row("a", TODAY)];
    const result = familyStreak(members, days, TODAY);
    expect(result.streak).toBe(2);
    expect(result.doneToday).toEqual(["a"]);
    expect(result.week[6].state).toBe("waiting");
    expect(result.week[5].state).toBe("done");
    expect(result.week[0].state).toBe("missed");
  });

  it("alerts profiles only on bad air, fitted to who they are", () => {
    expect(profileAlert(dadi, "hero", "Moderate", go)).toBeNull();
    expect(profileAlert(dadi, "hero", "Very Poor", go)).toBe("Stay inside till 2 PM.");
    expect(profileAlert(eva, "hero", "Very Poor", go)).toContain("Go Time");
    expect(profileAlert(eva, "plain", "Very Poor", go)).not.toContain("Go Time");
    expect(profileAlert({ ...eva, petType: "bird" }, "plain", "Poor", go)).toContain("smoke");
  });

  it("estimates a profile's lives from their usual outdoor time", () => {
    const today = day(TODAY, () => 150);
    expect(profileLives(dadi, today, "one", 350, `${TODAY}T08:00`).safe).toBe(4);
    expect(profileLives({ ...dadi, outdoorBlocks: [] }, today, "one", 350, `${TODAY}T08:00`)).toEqual({ safe: 5, rows: [] });
  });

  it("picks a weekly goal that fits the home", () => {
    expect(squadGoal(setup, [], TODAY).kind).toBe("delivery");
    expect(squadGoal(setup, [], "2026-06-03").kind).toBe("ac");
    expect(squadGoal({ ...setup, ordersPerWeek: "none" }, [], TODAY).kind).toBe("checkin");
    const free = checkin("2026-11-02", { deliveries: { food: 0, grocery: 0, parcel: 0 } });
    expect(squadGoal(setup, [free, checkin("2026-11-03")], TODAY).done).toBe(1);
  });
});

describe("assistant", () => {
  const data: AssistantData = {
    mode: "hero",
    setup,
    air: { aqi: 340, category: "Very Poor", mainPollutant: "pm25", pm25Mean: 150, hours },
    breakdown: { electricity: 2, cooking: 1, travel: 9, food: 5, deliveries: 0, oneOffs: 0 },
    missionContext: { setup, winter: true },
    profiles: [dadi, eva],
    date: TODAY,
    tomorrow: TOMORROW,
    now: `${TODAY}T08:00`,
  };

  it("uses real names, and leaves out what doesn't fit", () => {
    const texts = suggestedQuestions(data).map((q) => q.text);
    expect(texts).toContain("Is it safe for Dadi to go out?");
    expect(texts).toContain("Can I take Eva out now?");
    const alone = { ...data, profiles: [], setup: { ...setup, extraCare: ["none" as const], pets: { dog: 0, cat: 0, bird: 0, other: 0 } } };
    expect(suggestedQuestions(alone).map((q) => q.id)).toEqual(expect.not.arrayContaining(["elder", "pet"]));
  });

  it("answers from the live window", () => {
    expect(answerQuestion("walk", data).reply).toContain("2–4 PM");
    const elder = answerQuestion("elder", data);
    expect(elder.reply).toContain("Not before 2 PM");
    expect(elder.reply).toContain("Dadi");
    expect(elder.health).toBe(true);
    expect(answerQuestion("windows", data).reply).toContain("2–4 PM");
    expect(answerQuestion("windows", { ...data, now: `${TODAY}T14:00` }).reply).toContain("Open");
  });

  it("doesn't call a still-bad window safe", () => {
    const heavy = [...day(TODAY, () => 150), ...day(TOMORROW, () => 150)];
    const air = { ...data.air!, hours: heavy };
    expect(answerQuestion("elder", { ...data, air }).reply).toContain("Keep Dadi inside");
    expect(answerQuestion("windows", { ...data, air }).reply).toContain("shut");
  });

  it("names the footprint's biggest sources and copes with none", () => {
    expect(answerQuestion("footprint", data).reply).toMatch(/Travel.*Food/);
    const empty = { electricity: 0, cooking: 0, travel: 0, food: 0, deliveries: 0, oneOffs: 0 };
    expect(answerQuestion("footprint", { ...data, breakdown: empty }).card).toBeUndefined();
  });

  it("handles missing air", () => {
    expect(answerQuestion("walk", { ...data, air: null }).reply).toContain("can't");
    expect(forecastCard({ ...data, air: null }).bars).toEqual([]);
  });

  it("builds twelve forecast bars and marks the window", () => {
    const { bars } = forecastCard(data);
    expect(bars).toHaveLength(12);
    expect(bars.filter((b) => b.go).map((b) => b.hour)).toEqual([14, 15]);
  });

  it("sends the AI numbers but no coordinates", () => {
    const context = chatContext(data);
    expect(context).toContain("Very Poor");
    expect(context).not.toContain("28.6");
    expect(context).not.toContain("Dwarka");
  });
});

describe("check-in extras", () => {
  it("allows filling only the last two days", () => {
    expect(canFillLate("2026-11-02", TODAY)).toBe(true);
    expect(canFillLate("2026-11-01", TODAY)).toBe(false);
  });

  it("prices one-offs", () => {
    expect(oneOffKg({ kind: "flight", route: "domestic", trip: "return" })).toBe(300);
    expect(oneOffKg({ kind: "flight", route: "international", trip: "one-way" })).toBe(750);
    expect(oneOffKg({ kind: "long-trip", mode: "train", km: 100 })).toBeCloseTo(3);
    expect(oneOffKg({ kind: "guests", people: 4 })).toBeGreaterThan(0);
    expect(oneOffKg({ kind: "purchase", size: "large" })).toBeGreaterThan(oneOffKg({ kind: "purchase", size: "small" }));
  });

  it("knows whether outdoor time overlapped Go Time", () => {
    const today = day(TODAY, (h) => (h === 14 || h === 15 ? 45 : 150));
    expect(wentOutInGoTime(["afternoon"], today, TODAY)).toBe(true);
    expect(wentOutInGoTime(["morning"], today, TODAY)).toBe(false);
    expect(wentOutInGoTime(["afternoon"], [], TODAY)).toBe(false);
    const built = buildCheckin({ meals: [], trips: [], energy: checkin(TODAY).energy, deliveries: checkin(TODAY).deliveries, outdoorBlocks: ["afternoon"] }, setup, TODAY, today, 300, null, 1);
    expect(built.inGoTime).toBe(true);
  });

  it("awards the weekly challenge once", () => {
    const metro = [{ mode: "metro" as const, minutes: 20 }];
    const all = ["2026-11-02", "2026-11-03", TODAY].map((d) => checkin(d, { trips: metro }));
    expect(challengeXp(setup, all, TODAY, [])).toEqual([{ date: TODAY, kind: "challenge-2026-11-02", xp: 50 }]);
    expect(challengeXp(setup, all, TODAY, ["challenge-2026-11-02"])).toEqual([]);
    expect(challengeXp(setup, all.slice(0, 2), TODAY, [])).toEqual([]);
  });
});

describe("remaining badges", () => {
  const ids = (c: Checkin[], oneOffs: Parameters<typeof badgeStates>[4] = [], today = TODAY) =>
    badgeStates(setup, c, [], false, oneOffs, today).filter((b) => b.earned).map((b) => b.id);

  it("counts Clean Escape from real check-ins", () => {
    const days = ["10-20", "10-21", "10-22", "10-23", "10-24"].map((d) => checkin(`2026-${d}`, { inGoTime: true }));
    expect(ids(days)).toContain("clean-escape");
    expect(ids(days.slice(0, 4))).not.toContain("clean-escape");
    const state = badgeStates(setup, days.slice(0, 3), [], false, [], TODAY).find((b) => b.id === "clean-escape");
    expect(state?.count).toEqual([3, 5]);
  });

  it("gives Diyas Only after Diwali week, unless crackers were logged", () => {
    const week = ["11-05", "11-06", "11-07", "11-08", "11-09", "11-10"].map((d) => checkin(`2026-${d}`));
    expect(ids(week, [], "2026-11-08")).not.toContain("diyas-only");
    expect(ids(week, [], "2026-11-12")).toContain("diyas-only");
    const crackers = { date: "2026-11-08", kind: "crackers" as const, details: {}, co2Kg: 5 };
    expect(ids(week, [crackers], "2026-11-12")).not.toContain("diyas-only");
    expect(ids(week.slice(0, 2), [], "2026-11-12")).not.toContain("diyas-only");
  });
});
