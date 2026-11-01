// Fetches the air for a user, keeping the last good reading so a failed request doesn't blank the screen.

import type { AqiCategory, HourlyAir, SetupAnswers } from "./types";

export interface AirData {
  aqi: number;
  category: AqiCategory;
  mainPollutant: string;
  pm25Mean: number | null;
  hours: HourlyAir[];
}

export interface AirResult {
  air: AirData | null;
  staleAt: number | null; // When the reading was taken, if this is an old one
}

const AIR_KEY = "edith.lastAir";

function lastGoodAir(): { air: AirData; at: number } | null {
  try {
    return JSON.parse(localStorage.getItem(AIR_KEY) ?? "null");
  } catch {
    return null;
  }
}

export async function loadAir(setup: SetupAnswers): Promise<AirResult> {
  const { lat, lng } = setup.location;
  const query = lat != null && lng != null ? `?lat=${lat}&lng=${lng}` : "";
  try {
    const response = await fetch(`/api/air${query}`);
    if (!response.ok) throw new Error("Air unavailable");
    const air = (await response.json()) as AirData;
    try {
      localStorage.setItem(AIR_KEY, JSON.stringify({ air, at: Date.now() }));
    } catch {
      // Storage full: the fresh reading still works, there's just no backup
    }
    return { air, staleAt: null };
  } catch {
    const saved = lastGoodAir();
    return { air: saved?.air ?? null, staleAt: saved?.at ?? null };
  }
}
