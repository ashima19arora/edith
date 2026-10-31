// Every emission, AQI and game constant lives here.
// "Placeholder" marks an EDITH estimate that has no authoritative source yet.

import type { AqiCategory, Pollutant, TimeBlock, TravelMode, Fuel } from "./types";

// --- Electricity ---

// CEA CO2 Baseline Database v20.0 (Dec 2024), weighted average, 2023-24.
export const GRID_KG_PER_KWH = 0.727;

// Estimate: household use before logged AC and heating, scaled by home type. Gives 180 units a month
// for 4 people, matching CSE's typical Delhi home of about 181 kWh a month (household size assumed).
// Other sources run from about 260 to over 500 units, so each home's bills correct this.
// https://www.cseindia.org/cse-analysis-of-delhis-power-consumption-paints-a-dark-picture-5877
export const BASE_KWH = { fixed: 2, perPerson: 1 };
export const HOME_TYPE_MULTIPLIER = { flat: 1, house: 1.2, pg: 0.7 };

// Placeholders: typical appliance draw.
export const AC_KW = 1.2;
export const AC_NIGHT_HOURS = { off: 0, part: 3, whole: 7 };
export const HEATER_KW = 1.5;
export const GEYSER_KWH = { no: 0, short: 0.5, long: 1.5 };

// Placeholder: daily household cooking on induction.
export const INDUCTION_KWH_PER_DAY = 1.5;

// Bill correction loop: ratio limits, and how much weight a new bill gets over the old ratio.
export const CALIBRATION = { min: 0.5, max: 2, smoothing: 0.5 };

// Winter months (1 = January); everything else is summer.
export const WINTER_MONTHS = [11, 12, 1, 2];

// --- Cooking ---

// About 2.96 kg CO2 per kg LPG x 14.2 kg cylinder.
export const LPG_KG_PER_CYLINDER = 42;
export const LPG_CYCLE_DAYS = { "1": 30, "2": 60, "3+": 90 };

// Placeholder: household per day.
export const PNG_KG_PER_DAY = 0.6;

// --- Travel ---

// kg CO2 per litre (per kg for CNG). Approximate combustion factors; CNG is a kg-equivalent.
export const FUEL_KG_PER_UNIT: Record<Exclude<Fuel, "electric">, number> = {
  petrol: 2.3,
  diesel: 2.7,
  cng: 2.0,
};

// Placeholders: mileage used when the user skips it, in km per litre.
export const DEFAULT_MILEAGE = { "two-wheeler": 45, car: 15 };

// Placeholders: kWh per km for electric vehicles.
export const EV_KWH_PER_KM = { "two-wheeler": 0.03, car: 0.15 };

// Placeholders: kg CO2 per passenger-km. Own vehicles come from fuel maths instead.
export const PASSENGER_KG_PER_KM = {
  metro: 0.03,
  bus: 0.05,
  auto: 0.08,
  cab: 0.15,
  walk: 0,
  cycle: 0,
};

// Assumed passengers when a cab or car is shared.
export const SHARED_PASSENGERS = 2;

// Placeholders: typical Delhi speeds, km/h, to convert logged minutes to distance.
export const SPEED_KMH: Record<TravelMode, number> = {
  metro: 35,
  bus: 15,
  auto: 20,
  cab: 22,
  "two-wheeler": 25,
  car: 22,
  cycle: 12,
  walk: 5,
};

// --- Food and deliveries (kg CO2) ---

// Estimates anchored on Pathak et al. (2010): about 0.6 kg a day for a vegetarian Indian diet
// (0.2 a meal) and about 1 kg for a non-vegetarian one (two veg meals plus one chicken meal).
// The other meals are placed between and above those to keep the required order.
export const MEAL_KG = {
  veg: 0.2,
  "veg-dairy": 0.35,
  egg: 0.4,
  chicken: 0.6,
  fish: 0.55,
  mutton: 1.5,
  skipped: 0,
};

// Placeholders.
export const DELIVERY_KG = { food: 0.5, grocery: 0.3, parcel: 0.6 };

// --- Flights (placeholders, kg CO2 per round trip) ---

export const FLIGHT_KG = { domestic: 300, international: 1500 };

// Placeholder midpoints for the setup answer bands, in round trips a year.
export const FLIGHT_BAND_TRIPS = {
  domestic: { "0": 0, "1-2": 1.5, "3-5": 4, "6+": 7 },
  international: { "0": 0, "1": 1, "2-3": 2.5, "4+": 5 },
};

// Global Carbon Project via Our World in Data: India's fossil CO2 per person, 2024.
export const AVERAGE_INDIAN_KG_PER_YEAR = 2200;

// --- AQI ---

export const AQI_INDEX_BANDS: [number, number][] = [
  [0, 50],
  [51, 100],
  [101, 200],
  [201, 300],
  [301, 400],
  [401, 500],
];

// CPCB National Air Quality Index (2014), as published by IES Arthapedia:
// https://ies.gov.in/arthapedia/concept/national-air-quality-index
// Concentration ranges matching AQI_INDEX_BANDS. ug/m3, except CO in mg/m3.
// The last row's upper limit is not part of the CPCB table, which only says "250+" etc.
// Placeholder: chosen to extrapolate the top band, and readings above it cap at 500.
export const AQI_BREAKPOINTS: Record<Pollutant, [number, number][]> = {
  pm25: [[0, 30], [31, 60], [61, 90], [91, 120], [121, 250], [250, 380]],
  pm10: [[0, 50], [51, 100], [101, 250], [251, 350], [351, 430], [430, 510]],
  no2: [[0, 40], [41, 80], [81, 180], [181, 280], [281, 400], [400, 800]],
  o3: [[0, 50], [51, 100], [101, 168], [169, 208], [209, 748], [748, 1000]],
  co: [[0, 1], [1.1, 2], [2.1, 10], [10, 17], [17, 34], [34, 50]],
  so2: [[0, 40], [41, 80], [81, 380], [381, 800], [801, 1600], [1600, 2100]],
};

// CPCB averaging periods, in hours.
export const AQI_AVERAGING_HOURS: Record<Pollutant, number> = {
  pm25: 24,
  pm10: 24,
  no2: 24,
  so2: 24,
  o3: 8,
  co: 8,
};

// CPCB: a sub-index needs 16 of 24 hours of data, and the AQI needs 3 pollutants including a PM.
export const AQI_MIN_COVERAGE = 2 / 3;
export const AQI_MIN_POLLUTANTS = 3;

// Upper limit of each CPCB category.
export const AQI_CATEGORIES: [AqiCategory, number][] = [
  ["Good", 50],
  ["Satisfactory", 100],
  ["Moderate", 200],
  ["Poor", 300],
  ["Very Poor", 400],
  ["Severe", 500],
];

// Go Time: contiguous window inside daytime. Hours of day, end exclusive.
export const GO_TIME = { hours: 2, dayStart: 6, dayEnd: 21 };

// --- Exposure ---

// Berkeley Earth: 22 ug/m3 PM2.5 for 24 hours is about 1 cigarette.
export const PM25_PER_CIGARETTE = 22;

// Placeholders: share of outdoor PM2.5 reaching you indoors.
export const INDOOR_PM_FACTOR = { no: 0.6, one: 0.4, most: 0.25 };

// Hours of day covered by each setup block, end exclusive.
export const TIME_BLOCK_HOURS: Record<TimeBlock, [number, number]> = {
  early: [5, 8],
  morning: [8, 11],
  afternoon: [11, 16],
  evening: [16, 20],
  night: [20, 24],
};

// --- Lives ---

export const LIVES_PER_DAY = 5;

export const LIVES_LOST_PER_OUTDOOR_HOUR: Record<AqiCategory, number> = {
  Good: 0,
  Satisfactory: 0,
  Moderate: 0.25,
  Poor: 0.5,
  "Very Poor": 1,
  Severe: 1.5,
};

// Indoors on a Very Poor or Severe day, without a purifier. With one the loss is 0.
export const LIVES_LOST_INDOORS = 0.5;

// Placeholder: a ticked block is a few hours long, but people are outside for only part of it.
export const OUTDOOR_HOURS_PER_BLOCK = 1;

// --- Streaks, XP, ranks ---

export const LATE_FILL_DAYS = 2;

export const XP = {
  checkin: 10,
  mission: 20,
  weeklyChallenge: 50,
  bill: 30,
  streak7: 50,
  streak30: 200,
  squadGoal: 75,
};

export const RANK_THRESHOLDS = [0, 200, 500, 1000, 2000, 4000];
