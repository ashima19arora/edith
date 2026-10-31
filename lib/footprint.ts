import {
  AC_KW,
  AC_NIGHT_HOURS,
  BASE_KWH,
  CALIBRATION,
  DEFAULT_MILEAGE,
  DELIVERY_KG,
  EV_KWH_PER_KM,
  FLIGHT_BAND_TRIPS,
  FLIGHT_KG,
  FUEL_KG_PER_UNIT,
  GEYSER_KWH,
  GRID_KG_PER_KWH,
  HEATER_KW,
  HOME_TYPE_MULTIPLIER,
  INDUCTION_KWH_PER_DAY,
  LPG_CYCLE_DAYS,
  LPG_KG_PER_CYLINDER,
  MEAL_KG,
  PASSENGER_KG_PER_KM,
  PNG_KG_PER_DAY,
  SHARED_PASSENGERS,
  SPEED_KMH,
  WINTER_MONTHS,
} from "./factors";
import type {
  Bill,
  Checkin,
  Co2Breakdown,
  Deliveries,
  EnergyLog,
  Meal,
  OneOff,
  SetupAnswers,
  Trip,
} from "./types";

export function isWinter(date: string): boolean {
  return WINTER_MONTHS.includes(Number(date.slice(5, 7)));
}

export function tripKm(trip: Trip): number {
  return (trip.minutes / 60) * SPEED_KMH[trip.mode];
}

// kg CO2 per km for one person, using the vehicle details from setup for own vehicles.
export function kgPerKm(trip: Trip, setup: SetupAnswers): number {
  if (trip.mode === "two-wheeler" || trip.mode === "car") {
    const own = setup.trip.mode === trip.mode ? setup.trip : undefined;
    const fuel = own?.fuel ?? "petrol";
    const perVehicleKm =
      fuel === "electric"
        ? EV_KWH_PER_KM[trip.mode] * GRID_KG_PER_KWH
        : FUEL_KG_PER_UNIT[fuel] / (own?.mileage || DEFAULT_MILEAGE[trip.mode]);
    return trip.shared ? perVehicleKm / SHARED_PASSENGERS : perVehicleKm;
  }
  const factor = PASSENGER_KG_PER_KM[trip.mode];
  return trip.mode === "cab" && trip.shared ? factor / SHARED_PASSENGERS : factor;
}

export function travelKg(trips: Trip[], setup: SetupAnswers): number {
  return trips.reduce((sum, trip) => sum + tripKm(trip) * kgPerKm(trip, setup), 0);
}

export function foodKg(meals: Meal[]): number {
  return meals.reduce((sum, meal) => sum + MEAL_KG[meal], 0);
}

export function deliveriesKg(d: Deliveries): number {
  return d.food * DELIVERY_KG.food + d.grocery * DELIVERY_KG.grocery + d.parcel * DELIVERY_KG.parcel;
}

export function householdKwh(energy: EnergyLog, setup: SetupAnswers): number {
  const base = (BASE_KWH.fixed + BASE_KWH.perPerson * setup.people) * HOME_TYPE_MULTIPLIER[setup.homeType];
  const ac = setup.acs * AC_KW * (energy.acDayHours + AC_NIGHT_HOURS[energy.acNight]);
  const heater = HEATER_KW * energy.heaterHours;
  const induction = setup.cooking === "induction" ? INDUCTION_KWH_PER_DAY : 0;
  return base + ac + heater + GEYSER_KWH[energy.geyser] + induction;
}

// Whole household, before splitting between the people living there.
export function householdCookingKg(setup: SetupAnswers): number {
  if (setup.cooking === "lpg") return LPG_KG_PER_CYLINDER / LPG_CYCLE_DAYS[setup.cylinderLasts];
  if (setup.cooking === "png") return PNG_KG_PER_DAY;
  return 0; // Induction is counted in electricity
}

// One person's day. Electricity and cooking are shared, so each person carries their share.
export function dailyBreakdown(
  checkin: Pick<Checkin, "meals" | "trips" | "energy" | "deliveries">,
  setup: SetupAnswers,
  calibration = 1,
): Co2Breakdown {
  const people = Math.max(1, setup.people);
  return {
    electricity: (householdKwh(checkin.energy, setup) * calibration * GRID_KG_PER_KWH) / people,
    cooking: householdCookingKg(setup) / people,
    travel: travelKg(checkin.trips, setup),
    food: foodKg(checkin.meals),
    deliveries: deliveriesKg(checkin.deliveries),
    oneOffs: 0,
  };
}

export function totalKg(b: Co2Breakdown): number {
  return b.electricity + b.cooking + b.travel + b.food + b.deliveries + b.oneOffs;
}

export function biggestSource(b: Co2Breakdown): keyof Co2Breakdown {
  const keys = Object.keys(b) as (keyof Co2Breakdown)[];
  return keys.reduce((top, key) => (b[key] > b[top] ? key : top));
}

// Setup's 12-month flight count, spread evenly across the year.
export function setupFlightsKgPerMonth(flights: SetupAnswers["flights"]): number {
  const yearly =
    FLIGHT_BAND_TRIPS.domestic[flights.domestic] * FLIGHT_KG.domestic +
    FLIGHT_BAND_TRIPS.international[flights.international] * FLIGHT_KG.international;
  return yearly / 12;
}

// New ratio after a bill: actual / estimated, clamped, then blended with the previous ratio.
export function nextCalibration(previous: number, actualKwh: number, estimatedKwh: number): number {
  if (estimatedKwh <= 0) return previous;
  const ratio = Math.min(CALIBRATION.max, Math.max(CALIBRATION.min, actualKwh / estimatedKwh));
  return previous + (ratio - previous) * CALIBRATION.smoothing;
}

function billForMonth(bills: Bill[], month: string): Bill | undefined {
  // A billing period rarely matches a calendar month, so go by its midpoint.
  return bills.find((bill) => {
    const middle = (Date.parse(bill.periodStart) + Date.parse(bill.periodEnd)) / 2;
    return new Date(middle).toISOString().slice(0, 7) === month;
  });
}

export interface MonthTotal {
  breakdown: Co2Breakdown;
  electricitySource: "estimated" | "bill";
}

// Month-to-date through `date`. A bill for that month scales its daily estimates to the real units.
export function monthToDate(
  date: string,
  checkins: Checkin[],
  oneOffs: OneOff[],
  bills: Bill[],
  setup: SetupAnswers,
): MonthTotal {
  const month = date.slice(0, 7);
  const inMonth = checkins.filter((c) => c.date.startsWith(month));
  const breakdown: Co2Breakdown = { electricity: 0, cooking: 0, travel: 0, food: 0, deliveries: 0, oneOffs: 0 };

  for (const c of inMonth) {
    if (c.date > date) continue;
    for (const key of Object.keys(breakdown) as (keyof Co2Breakdown)[]) {
      breakdown[key] += c.co2Breakdown[key];
    }
  }
  for (const o of oneOffs) {
    if (o.date.startsWith(month) && o.date <= date) breakdown.oneOffs += o.co2Kg;
  }

  const bill = billForMonth(bills, month);
  const estimatedMonth = inMonth.reduce((sum, c) => sum + c.co2Breakdown.electricity, 0);
  if (!bill || estimatedMonth <= 0) return { breakdown, electricitySource: "estimated" };

  const actualMonth = (bill.units * GRID_KG_PER_KWH) / Math.max(1, setup.people);
  breakdown.electricity *= actualMonth / estimatedMonth;
  return { breakdown, electricitySource: "bill" };
}

// The same day last month, capped to that month's length (31 Mar compares with 28 Feb).
export function sameDateLastMonth(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
  const previous = new Date(Date.UTC(year, month - 2, Math.min(day, lastDay)));
  return previous.toISOString().slice(0, 10);
}
