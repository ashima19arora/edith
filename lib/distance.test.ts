import { describe, expect, it } from "vitest";
import { estimateTripKm, placeFromLookup } from "@/lib/distance";

const dwarka = { lat: 28.59, lng: 77.04 };
const rohini = { latitude: 28.74322, longitude: 77.06778 };
const maitVillage = { latitude: 29.94579, longitude: 78.75952 };

describe("estimateTripKm", () => {
  it("estimates a nearby place", () => {
    expect(estimateTripKm(dwarka, [rohini])).toBe(22);
  });

  it("picks the closest of several matches", () => {
    expect(estimateTripKm(dwarka, [maitVillage, rohini])).toBe(22);
  });

  it("rejects a far-off place with the same name", () => {
    expect(estimateTripKm(dwarka, [maitVillage])).toBeNull();
  });

  it("returns null when nothing was found", () => {
    expect(estimateTripKm(dwarka, [])).toBeNull();
  });
});

describe("placeFromLookup", () => {
  const admin = (...names: string[]) => ({ administrative: names.map((name) => ({ name })) });

  it("uses a plain locality", () => {
    expect(placeFromLookup({ locality: "Dwarka", city: "Delhi", localityInfo: admin("Najafgarh", "Dwarka") })).toBe("Dwarka");
  });

  it("skips district names for the area inside them", () => {
    const data = { locality: "Outer North Delhi district", city: "Delhi", localityInfo: admin("Delhi", "Outer North Delhi district", "Rohini") };
    expect(placeFromLookup(data)).toBe("Rohini");
  });

  it("falls back to the city, then to nothing", () => {
    expect(placeFromLookup({ locality: "Some tehsil", city: "Agra" })).toBe("Agra");
    expect(placeFromLookup({})).toBeNull();
  });
});
