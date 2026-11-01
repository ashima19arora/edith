// Shapes shared by the engine, the storage layer and the UI. They mirror supabase/migrations.

export type Mode = "hero" | "plain";

export type Pollutant = "pm25" | "pm10" | "no2" | "o3" | "co" | "so2";
export type AqiCategory = "Good" | "Satisfactory" | "Moderate" | "Poor" | "Very Poor" | "Severe";

export type TravelMode = "metro" | "bus" | "auto" | "cab" | "two-wheeler" | "car" | "walk" | "cycle";
export type Fuel = "petrol" | "diesel" | "cng" | "electric";
export type TimeBlock = "early" | "morning" | "afternoon" | "evening" | "night";
export type Purifier = "no" | "one" | "most";
export type Meal = "veg" | "veg-dairy" | "egg" | "chicken" | "fish" | "mutton" | "skipped";

// Concentrations as the air API gives them: ug/m3, with CO converted to mg/m3.
export type Concentrations = Partial<Record<Pollutant, number | null>>;

export interface HourlyAir {
  time: string; // Local "YYYY-MM-DDTHH:00"
  concentrations: Concentrations;
}

export interface SetupAnswers {
  location: { lat: number | null; lng: number | null; area: string };
  people: number;
  homeType: "flat" | "house" | "pg";
  pets: { dog: number; cat: number; bird: number; other: number };
  extraCare: ("children" | "elderly" | "breathing" | "heart" | "pregnant" | "none")[];
  trip: {
    kind: "college" | "office" | "school" | "wfh";
    kmOneWay: number;
    address?: string;
    daysPerWeek: number;
    mode: TravelMode;
    fuel?: Fuel;
    mileage?: number;
  };
  outdoorBlocks: TimeBlock[]; // Empty means mostly indoors
  exercise: "no" | "mornings" | "evenings" | "both";
  acs: number;
  acHoursBand: "1-3" | "4-6" | "7-10" | "10+";
  cooking: "lpg" | "png" | "induction";
  cylinderLasts: "1" | "2" | "3+";
  purifier: Purifier;
  billBand: "under1000" | "1000-2500" | "2500-5000" | "over5000" | null;
  diet: "veg" | "egg" | "non-veg";
  nonVegFrequency: "daily" | "few" | "rarely";
  ordersPerWeek: "none" | "1-3" | "4-7" | "8+";
  flights: {
    domestic: "0" | "1-2" | "3-5" | "6+";
    international: "0" | "1" | "2-3" | "4+";
  };
}

export interface Trip {
  mode: TravelMode;
  minutes: number;
  shared?: boolean;
}

export interface EnergyLog {
  acDayHours: number;
  acNight: "off" | "part" | "whole";
  heaterHours: number;
  geyser: "no" | "short" | "long";
}

export interface Deliveries {
  food: number;
  grocery: number;
  parcel: number;
}

export type MissionStatus = "yes" | "partly" | "no" | null;

export interface Co2Breakdown {
  electricity: number;
  cooking: number;
  travel: number;
  food: number;
  deliveries: number;
  oneOffs: number;
}

export interface Checkin {
  date: string; // "YYYY-MM-DD"
  meals: Meal[];
  trips: Trip[];
  energy: EnergyLog;
  deliveries: Deliveries;
  outdoorBlocks: TimeBlock[];
  missionStatus: MissionStatus;
  co2Breakdown: Co2Breakdown;
  livesKept: number;
  inGoTime?: boolean; // Outdoor time overlapped that day's Go Time
}

export interface OneOff {
  date: string;
  kind: "flight" | "long-trip" | "purchase" | "guests" | "crackers";
  details: Record<string, unknown>;
  co2Kg: number;
}

export interface Bill {
  periodStart: string;
  periodEnd: string;
  units: number;
  source: "photo" | "manual";
}
