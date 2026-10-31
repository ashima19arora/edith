import { describe, expect, it } from "vitest";
import { aqiFromConcentrations, categoryFor, cigarettesOutAllDay, goTime, headlineAqi, parseOpenMeteo, subIndex } from "./aqi";
import {
  biggestSource,
  dailyBreakdown,
  foodKg,
  monthToDate,
  nextCalibration,
  sameDateLastMonth,
  setupFlightsKgPerMonth,
  travelKg,
} from "./footprint";
import { livesKept, livesLost } from "./lives";
import { canFillLate, currentStreak, familyDates, longestStreak, rankFor } from "./progress";
import type { Checkin, HourlyAir, SetupAnswers } from "./types";

const setup: SetupAnswers = {
  location: { lat: null, lng: null, area: "Dwarka" },
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
  flights: { domestic: "1-2", international: "0" },
};

const noEnergy = { acDayHours: 0, acNight: "off", heaterHours: 0, geyser: "no" } as const;
const noDeliveries = { food: 0, grocery: 0, parcel: 0 };

function hours(date: string, pm25: (hour: number) => number): HourlyAir[] {
  return Array.from({ length: 24 }, (_, h) => ({
    time: `${date}T${String(h).padStart(2, "0")}:00`,
    concentrations: { pm25: pm25(h), pm10: 10, no2: 10 },
  }));
}

describe("AQI", () => {
  it("interpolates each CPCB band", () => {
    expect(subIndex("pm25", 0)).toBe(0);
    expect(subIndex("pm25", 30)).toBe(50);
    expect(subIndex("pm25", 60)).toBe(100);
    expect(subIndex("pm25", 90)).toBe(200);
    expect(subIndex("pm25", 120)).toBe(300);
    expect(subIndex("pm25", 250)).toBe(400);
    expect(subIndex("co", 2)).toBe(100);
    expect(subIndex("o3", 168)).toBe(200);
  });

  it("handles the gaps between bands and caps at 500", () => {
    expect(subIndex("pm25", 30.5)).toBe(51);
    expect(subIndex("pm25", 5000)).toBe(500);
  });

  it("names the categories at their edges", () => {
    expect(categoryFor(50)).toBe("Good");
    expect(categoryFor(51)).toBe("Satisfactory");
    expect(categoryFor(300)).toBe("Poor");
    expect(categoryFor(301)).toBe("Very Poor");
    expect(categoryFor(500)).toBe("Severe");
  });

  it("takes the highest sub-index and needs 3 pollutants with a PM", () => {
    const result = aqiFromConcentrations({ pm25: 100, pm10: 50, no2: 40 });
    expect(result?.mainPollutant).toBe("pm25");
    expect(result?.category).toBe("Poor");
    expect(aqiFromConcentrations({ pm25: 100, pm10: 50 })).toBeNull();
    expect(aqiFromConcentrations({ no2: 40, o3: 40, so2: 40 })).toBeNull();
  });

  it("uses the trailing 24-hour mean for the headline", () => {
    const day = hours("2026-11-01", (h) => (h === 23 ? 500 : 60));
    expect(headlineAqi(day, 23)?.aqi).toBe(subIndex("pm25", (60 * 23 + 500) / 24));
  });

  it("returns no headline without enough hours of data", () => {
    expect(headlineAqi(hours("2026-11-01", () => 60), 5)).toBeNull();
  });

  it("finds the cleanest daytime window, ignoring cleaner night hours", () => {
    const day = hours("2026-11-01", (h) => (h < 6 ? 1 : h === 14 || h === 15 ? 40 : 200));
    const window = goTime(day, "2026-11-01");
    expect(window?.start).toBe("2026-11-01T14:00");
    expect(window?.end).toBe("2026-11-01T15:00");
  });

  it("skips windows that have already passed", () => {
    const day = hours("2026-11-01", (h) => (h === 8 || h === 9 ? 40 : 100));
    expect(goTime(day, "2026-11-01", "2026-11-01T12:00")?.start).not.toBe("2026-11-01T08:00");
  });

  it("converts PM2.5 to cigarettes", () => {
    expect(cigarettesOutAllDay(220)).toBe(10);
  });

  it("converts Open-Meteo CO from ug/m3 to mg/m3", () => {
    const [hour] = parseOpenMeteo({
      hourly: {
        time: ["2026-11-01T00:00"],
        pm2_5: [100],
        pm10: [150],
        nitrogen_dioxide: [50],
        ozone: [20],
        carbon_monoxide: [1500],
        sulphur_dioxide: [null],
      },
    });
    expect(hour.concentrations.co).toBe(1.5);
    expect(hour.concentrations.so2).toBeNull();
  });
});

describe("footprint", () => {
  it("does the fuel maths with default mileage", () => {
    const minutes = (12 / 25) * 60;
    expect(travelKg([{ mode: "two-wheeler", minutes }], setup)).toBeCloseTo((12 / 45) * 2.3);
  });

  it("uses the user's mileage and halves a shared cab", () => {
    const own = { ...setup, trip: { ...setup.trip, mileage: 30 } };
    const minutes = (30 / 25) * 60;
    expect(travelKg([{ mode: "two-wheeler", minutes }], own)).toBeCloseTo(2.3);
    const cab = { mode: "cab", minutes: 60 } as const;
    expect(travelKg([{ ...cab, shared: true }], setup)).toBeCloseTo(travelKg([cab], setup) / 2);
  });

  it("keeps walking and cycling at zero", () => {
    expect(travelKg([{ mode: "walk", minutes: 60 }, { mode: "cycle", minutes: 60 }], setup)).toBe(0);
  });

  it("keeps the required food order", () => {
    expect(foodKg(["veg"])).toBeLessThan(foodKg(["veg-dairy"]));
    expect(foodKg(["veg-dairy"])).toBeLessThan(foodKg(["egg"]));
    expect(foodKg(["egg"])).toBeLessThan(foodKg(["fish"]));
    expect(foodKg(["chicken"])).toBeLessThan(foodKg(["mutton"]));
    expect(foodKg(["skipped"])).toBe(0);
  });

  it("splits home energy between the people living there", () => {
    const day = { meals: [], trips: [], energy: noEnergy, deliveries: noDeliveries };
    const b = dailyBreakdown(day, setup);
    expect(b.electricity).toBeCloseTo((4 * 0.727) / 4);
    expect(b.cooking).toBeCloseTo(42 / 60 / 4);
  });

  it("adds AC night hours to the estimate", () => {
    const day = { meals: [], trips: [], deliveries: noDeliveries };
    const off = dailyBreakdown({ ...day, energy: noEnergy }, setup);
    const whole = dailyBreakdown({ ...day, energy: { ...noEnergy, acNight: "whole" } }, setup);
    expect(whole.electricity - off.electricity).toBeCloseTo((2 * 1.2 * 7 * 0.727) / 4);
  });

  it("makes travel the demo user's biggest source without AC", () => {
    const minutes = (12 / 25) * 60;
    const trips = [
      { mode: "two-wheeler", minutes },
      { mode: "two-wheeler", minutes },
    ] as const;
    const day = {
      meals: ["veg", "veg", "chicken"] as const,
      trips,
      energy: noEnergy,
      deliveries: noDeliveries,
    };
    const b = dailyBreakdown({ ...day, meals: [...day.meals], trips: [...trips] }, setup);
    expect(biggestSource(b)).toBe("travel");
  });

  it("spreads setup flights across the year", () => {
    expect(setupFlightsKgPerMonth({ domestic: "1-2", international: "0" })).toBeCloseTo(37.5);
  });

  it("clamps and smooths the bill calibration", () => {
    expect(nextCalibration(1, 300, 300)).toBe(1);
    expect(nextCalibration(1, 900, 100)).toBe(1.5);
    expect(nextCalibration(1, 10, 100)).toBe(0.75);
  });

  it("replaces a month's electricity estimate with the bill", () => {
    const b = { electricity: 10, cooking: 1, travel: 2, food: 3, deliveries: 0, oneOffs: 0 };
    const checkin = (date: string): Checkin => ({
      date,
      meals: [],
      trips: [],
      energy: noEnergy,
      deliveries: noDeliveries,
      outdoorBlocks: [],
      missionStatus: null,
      co2Breakdown: b,
      livesKept: 5,
    });
    const checkins = [checkin("2026-10-01"), checkin("2026-10-02")];
    const estimated = monthToDate("2026-10-02", checkins, [], [], setup);
    expect(estimated.electricitySource).toBe("estimated");
    expect(estimated.breakdown.electricity).toBe(20);

    const bill = { periodStart: "2026-10-01", periodEnd: "2026-10-31", units: 220, source: "photo" as const };
    const corrected = monthToDate("2026-10-01", checkins, [], [bill], setup);
    expect(corrected.electricitySource).toBe("bill");
    expect(corrected.breakdown.electricity).toBeCloseTo((220 * 0.727) / 4 / 2);
  });

  it("caps same-date comparisons to the shorter month", () => {
    expect(sameDateLastMonth("2026-11-15")).toBe("2026-10-15");
    expect(sameDateLastMonth("2026-03-31")).toBe("2026-02-28");
    expect(sameDateLastMonth("2026-01-10")).toBe("2025-12-10");
  });

  it("finds the biggest source", () => {
    const b = { electricity: 1, cooking: 1, travel: 5, food: 2, deliveries: 0, oneOffs: 0 };
    expect(biggestSource(b)).toBe("travel");
  });
});

describe("lives", () => {
  // PM2.5 of 150 is Very Poor and 100 is Poor on the hourly index.
  const veryPoor = hours("2026-11-01", () => 150);
  const poor = hours("2026-11-01", () => 100);

  it("costs one life per Very Poor outdoor block", () => {
    expect(livesLost(veryPoor, ["morning", "evening"], "one", "Very Poor")).toBe(2);
  });

  it("charges 0.5 indoors on a very bad day only without a purifier", () => {
    expect(livesLost(veryPoor, [], "no", "Very Poor")).toBe(0.5);
    expect(livesLost(veryPoor, [], "one", "Very Poor")).toBe(0);
    expect(livesLost(poor, [], "no", "Poor")).toBe(0);
  });

  it("floors at zero", () => {
    expect(livesKept(9)).toBe(0);
    expect(livesKept(1.5)).toBe(3.5);
  });
});

describe("progress", () => {
  it("counts a streak that survives an unfinished today", () => {
    const dates = ["2026-10-29", "2026-10-30"];
    expect(currentStreak(dates, "2026-10-31")).toBe(2);
    expect(currentStreak([...dates, "2026-10-31"], "2026-10-31")).toBe(3);
    expect(currentStreak(dates, "2026-11-01")).toBe(0);
  });

  it("finds the longest streak across a month boundary", () => {
    expect(longestStreak(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-05"])).toBe(3);
  });

  it("allows filling up to 2 days late", () => {
    expect(canFillLate("2026-10-29", "2026-10-31")).toBe(true);
    expect(canFillLate("2026-10-28", "2026-10-31")).toBe(false);
    expect(canFillLate("2026-11-01", "2026-10-31")).toBe(false);
  });

  it("counts family days only when everyone checked in", () => {
    expect(familyDates([["2026-10-30", "2026-10-31"], ["2026-10-31"]])).toEqual(["2026-10-31"]);
  });

  it("works out rank and progress", () => {
    expect(rankFor(0).rank).toBe(0);
    expect(rankFor(350)).toEqual({ rank: 1, xpToNext: 150, progress: 0.5 });
    expect(rankFor(9000)).toEqual({ rank: 5, xpToNext: null, progress: 1 });
  });
});
