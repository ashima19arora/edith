import {
  AQI_AVERAGING_HOURS,
  AQI_BREAKPOINTS,
  AQI_CATEGORIES,
  AQI_INDEX_BANDS,
  AQI_MIN_COVERAGE,
  AQI_MIN_POLLUTANTS,
  GO_TIME,
  INDOOR_PM_FACTOR,
  PM25_PER_CIGARETTE,
} from "./factors";
import type { AqiCategory, Concentrations, HourlyAir, Pollutant, Purifier } from "./types";

export interface AqiResult {
  aqi: number;
  category: AqiCategory;
  mainPollutant: Pollutant;
}

const POLLUTANTS = Object.keys(AQI_BREAKPOINTS) as Pollutant[];

export function subIndex(pollutant: Pollutant, concentration: number): number {
  const bands = AQI_BREAKPOINTS[pollutant];
  const c = Math.max(0, concentration);
  // CPCB ranges leave small gaps (30 then 31), so take the first band whose top reaches c.
  const band = bands.findIndex(([, high]) => c <= high);
  if (band === -1) return 500;

  const [low, high] = bands[band];
  const [indexLow, indexHigh] = AQI_INDEX_BANDS[band];
  const index = indexLow + ((indexHigh - indexLow) * (c - low)) / (high - low);
  return Math.round(Math.max(indexLow, index));
}

export function categoryFor(aqi: number): AqiCategory {
  return AQI_CATEGORIES.find(([, top]) => aqi <= top)?.[0] ?? "Severe";
}

// AQI = highest sub-index, valid only with enough pollutants including a particulate one.
export function aqiFromConcentrations(values: Concentrations): AqiResult | null {
  const known = POLLUTANTS.filter((p) => values[p] != null);
  if (known.length < AQI_MIN_POLLUTANTS) return null;
  if (!known.includes("pm25") && !known.includes("pm10")) return null;

  let aqi = -1;
  let mainPollutant = known[0];
  for (const p of known) {
    const index = subIndex(p, values[p]!);
    if (index > aqi) {
      aqi = index;
      mainPollutant = p;
    }
  }
  return { aqi, category: categoryFor(aqi), mainPollutant };
}

// Label this as an hourly index in the UI: it is not the official 24-hour AQI.
export function hourlyIndex(hour: HourlyAir): AqiResult | null {
  return aqiFromConcentrations(hour.concentrations);
}

function trailingMean(hours: HourlyAir[], end: number, pollutant: Pollutant, window: number) {
  const values = hours
    .slice(Math.max(0, end - window + 1), end + 1)
    .map((h) => h.concentrations[pollutant])
    .filter((v): v is number => v != null);
  if (values.length < window * AQI_MIN_COVERAGE) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Trailing 24-hour PM2.5 mean ending at hour `end`, for the cigarette equivalent.
export function pm25Mean(hours: HourlyAir[], end: number): number | null {
  return trailingMean(hours, end, "pm25", 24);
}

// Headline AQI: CPCB trailing averages (24 h, or 8 h for O3 and CO) ending at hour `end`.
export function headlineAqi(hours: HourlyAir[], end: number): AqiResult | null {
  const means: Concentrations = {};
  for (const p of POLLUTANTS) means[p] = trailingMean(hours, end, p, AQI_AVERAGING_HOURS[p]);
  return aqiFromConcentrations(means);
}

export interface GoTimeWindow {
  start: string;
  end: string; // Hour of the last slot, inclusive
  index: number;
}

// Cleanest contiguous window on `date`, starting no earlier than `from` when given.
export function goTime(hours: HourlyAir[], date: string, from?: string): GoTimeWindow | null {
  const slots = hours
    .filter((h) => h.time.startsWith(date))
    .filter((h) => !from || h.time >= from)
    .filter((h) => {
      const hour = Number(h.time.slice(11, 13));
      return hour >= GO_TIME.dayStart && hour < GO_TIME.dayEnd;
    });

  let best: GoTimeWindow | null = null;
  for (let i = 0; i + GO_TIME.hours <= slots.length; i++) {
    const window = slots.slice(i, i + GO_TIME.hours);
    // `slots` can skip an hour if the API has a hole, which would break the window.
    const first = Number(window[0].time.slice(11, 13));
    const last = Number(window[window.length - 1].time.slice(11, 13));
    if (last - first !== GO_TIME.hours - 1) continue;

    const indexes = window.map(hourlyIndex);
    if (indexes.some((r) => r === null)) continue;
    const index = indexes.reduce((sum, r) => sum + r!.aqi, 0) / indexes.length;
    if (!best || index < best.index) {
      best = { start: window[0].time, end: window[window.length - 1].time, index };
    }
  }
  return best;
}

export function cigarettesOutAllDay(pm25Mean: number): number {
  return pm25Mean / PM25_PER_CIGARETTE;
}

// "So far": each elapsed hour counts in full outdoors and at a reduced factor indoors.
export function cigarettesSoFar(
  hours: HourlyAir[],
  outdoorHours: Set<number>,
  purifier: Purifier,
): number {
  const total = hours.reduce((sum, h) => {
    const pm25 = h.concentrations.pm25 ?? 0;
    const hour = Number(h.time.slice(11, 13));
    return sum + (outdoorHours.has(hour) ? pm25 : pm25 * INDOOR_PM_FACTOR[purifier]);
  }, 0);
  return total / 24 / PM25_PER_CIGARETTE;
}

interface OpenMeteoAir {
  hourly: {
    time: string[];
    pm2_5: (number | null)[];
    pm10: (number | null)[];
    nitrogen_dioxide: (number | null)[];
    ozone: (number | null)[];
    carbon_monoxide: (number | null)[];
    sulphur_dioxide: (number | null)[];
  };
}

export function parseOpenMeteo(data: OpenMeteoAir): HourlyAir[] {
  const h = data.hourly;
  return h.time.map((time, i) => ({
    time,
    concentrations: {
      pm25: h.pm2_5[i],
      pm10: h.pm10[i],
      no2: h.nitrogen_dioxide[i],
      o3: h.ozone[i],
      co: h.carbon_monoxide[i] == null ? null : h.carbon_monoxide[i]! / 1000, // ug/m3 to mg/m3
      so2: h.sulphur_dioxide[i],
    },
  }));
}
