import { describe, expect, it } from "vitest";
import {
  EMPTY_DRAFT,
  finalizeSetup,
  isStepComplete,
  progressFill,
  recapLines,
  stepPosition,
  toggleExclusive,
  visibleSteps,
  type SetupDraft,
} from "./setup";

const complete: SetupDraft = {
  ...EMPTY_DRAFT,
  location: { area: "Dwarka", lat: 28.6, lng: 77 },
  homeType: "flat",
  pets: { dog: 2, cat: 0, bird: 0, other: 0 },
  extraCare: ["elderly"],
  tripKind: "college",
  mode: "metro",
  outdoor: ["morning", "evening"],
  exercise: "no",
  acs: 2,
  acHoursBand: "4-6",
  cooking: "lpg",
  cylinderLasts: "2",
  purifier: "no",
  diet: "non-veg",
  nonVegFrequency: "few",
  ordersPerWeek: "1-3",
  domestic: "0",
  international: "0",
};

describe("setup steps", () => {
  it("shows the fuel step only for an own vehicle", () => {
    expect(visibleSteps({ ...EMPTY_DRAFT, mode: "metro" })).not.toContain("fuel");
    expect(visibleSteps({ ...EMPTY_DRAFT, mode: "car" })).toContain("fuel");
    expect(stepPosition("outdoors", { ...EMPTY_DRAFT, mode: "metro" })).toMatchObject({ step: 4, total: 5 });
    expect(stepPosition("fuel", { ...EMPTY_DRAFT, mode: "two-wheeler" })).toMatchObject({ step: 4, total: 6 });
  });

  it("skips the journey questions for work from home", () => {
    const steps = visibleSteps({ ...EMPTY_DRAFT, tripKind: "wfh", mode: "car" });
    expect(steps).not.toContain("distance");
    expect(steps).not.toContain("mode");
    expect(steps).not.toContain("fuel");
  });

  it("fills the progress bars section by section", () => {
    expect(progressFill("location", EMPTY_DRAFT)[0]).toBeCloseTo(1 / 3);
    expect(progressFill("acs", EMPTY_DRAFT)).toEqual([1, 1, 0.25, 0]);
  });

  it("holds Next until a choice is made", () => {
    expect(isStepComplete("location", EMPTY_DRAFT)).toBe(false);
    expect(isStepComplete("bill", EMPTY_DRAFT)).toBe(true);
    expect(isStepComplete("acs", EMPTY_DRAFT)).toBe(true);
    expect(isStepComplete("acs", { ...EMPTY_DRAFT, acs: 1 })).toBe(false);
    expect(isStepComplete("cooking", { ...EMPTY_DRAFT, cooking: "lpg" })).toBe(false);
    expect(isStepComplete("cooking", { ...EMPTY_DRAFT, cooking: "png" })).toBe(true);
    expect(isStepComplete("diet", { ...EMPTY_DRAFT, diet: "veg" })).toBe(true);
    expect(isStepComplete("diet", { ...EMPTY_DRAFT, diet: "non-veg" })).toBe(false);
  });

  it("makes the exclusive option replace the others", () => {
    expect(toggleExclusive(["a", "b"], "none", "none")).toEqual(["none"]);
    expect(toggleExclusive(["none"], "a", "none")).toEqual(["a"]);
    expect(toggleExclusive(["a", "b"], "a", "none")).toEqual(["b"]);
  });
});

describe("finalizing", () => {
  it("drops 'mostly indoors' from the blocks", () => {
    expect(finalizeSetup({ ...complete, outdoor: ["indoors"] }).outdoorBlocks).toEqual([]);
  });

  it("zeroes the trip for work from home, even after a vehicle was picked", () => {
    const { trip } = finalizeSetup({ ...complete, tripKind: "wfh", mode: "car", fuel: "petrol", mileage: "15" });
    expect(trip).toMatchObject({ kmOneWay: 0, daysPerWeek: 0, mode: "walk" });
    expect(trip.fuel).toBeUndefined();
    expect(trip.mileage).toBeUndefined();
  });

  it("keeps mileage only when it is a usable number for a fuel vehicle", () => {
    const bike = { ...complete, mode: "two-wheeler" as const, fuel: "petrol" as const };
    expect(finalizeSetup({ ...bike, mileage: "40" }).trip.mileage).toBe(40);
    expect(finalizeSetup({ ...bike, mileage: "abc" }).trip.mileage).toBeUndefined();
    expect(finalizeSetup({ ...bike, mileage: "-5" }).trip.mileage).toBeUndefined();
    expect(finalizeSetup({ ...bike, fuel: "electric", mileage: "40" }).trip.mileage).toBeUndefined();
  });

  it("writes the recap in each mode's words", () => {
    const answers = finalizeSetup(complete);
    expect(recapLines(answers, "hero")).toEqual([
      "Dwarka · 4 people",
      "Metro to college · 12 km",
      "2 dogs",
      "2 ACs · LPG",
      "Non-veg · 1–3 deliveries a week",
    ]);
    expect(recapLines(answers, "plain")[4]).toBe("Non-veg · 1–3 orders a week");
  });

  it("handles singular and empty recap values", () => {
    const answers = finalizeSetup({
      ...complete,
      people: 1,
      pets: { dog: 1, cat: 0, bird: 0, other: 0 },
      acs: 0,
      ordersPerWeek: "none",
      tripKind: "wfh",
    });
    expect(recapLines(answers, "plain")).toEqual([
      "Dwarka · 1 person",
      "Works from home",
      "1 dog",
      "No AC · LPG",
      "Non-veg · No orders",
    ]);
  });
});
