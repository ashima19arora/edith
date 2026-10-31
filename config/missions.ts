// The fixed mission list. Each mission says who it fits and works out savings from that user's real numbers.

import {
  AC_HOURS_BAND,
  AC_KW,
  AUTO_INR_PER_KM,
  BUS_FARE_INR,
  CAB_INR_PER_KM,
  DEFAULT_MILEAGE,
  DELIVERY_KG,
  DELIVERY_ORDER_INR,
  ELECTRICITY_INR_PER_KWH,
  EV_KWH_PER_KM,
  FUEL_PRICE_INR,
  GEYSER_KWH,
  GRID_KG_PER_KWH,
  HEATER_KW,
  LPG_CYCLE_DAYS,
  LPG_INR_PER_CYLINDER,
  LPG_KG_PER_CYLINDER,
  MEAL_KG,
  MEAL_SWAP_INR,
  METRO_FARES,
  PASSENGER_KG_PER_KM,
  PNG_KG_PER_DAY,
  PNG_INR_PER_DAY,
  SHARED_PASSENGERS,
} from "@/lib/factors";
import { kgPerKm } from "@/lib/footprint";
import { OPTIONS } from "@/lib/labels";
import type { Co2Breakdown, EnergyLog, SetupAnswers, TravelMode } from "@/lib/types";

export interface MissionContext {
  setup: SetupAnswers;
  winter: boolean;
  lastEnergy?: EnergyLog; // From the latest check-in, which shows the appliances actually in use
}

export interface Saving {
  kg: number;
  inr: number; // Negative when the greener choice costs more
}

export interface Mission {
  id: string;
  sector: keyof Co2Breakdown;
  text: (c: MissionContext) => string;
  applies: (c: MissionContext) => boolean;
  saves: (c: MissionContext) => Saving;
}

export function metroFare(km: number): number {
  return METRO_FARES.find(([top]) => km <= top)![1];
}

const roundTripKm = (s: SetupAnswers) => s.trip.kmOneWay * 2;
const commutes = (s: SetupAnswers) => s.trip.kind !== "wfh" && s.trip.kmOneWay > 0;
const isOwn = (mode: TravelMode) => mode === "two-wheeler" || mode === "car";
const onOwnVehicle = (s: SetupAnswers) => commutes(s) && isOwn(s.trip.mode);
const motorised = (s: SetupAnswers) => commutes(s) && s.trip.mode !== "walk" && s.trip.mode !== "cycle";
const place = (s: SetupAnswers) => OPTIONS.trip[s.trip.kind].toLowerCase();
const vehicle = (s: SetupAnswers) => OPTIONS.mode[s.trip.mode].toLowerCase();

function tripKg(s: SetupAnswers): number {
  return kgPerKm({ mode: s.trip.mode, minutes: 0 }, s) * roundTripKm(s);
}

function ownVehicleInrPerKm(s: SetupAnswers): number {
  const mode = s.trip.mode as "two-wheeler" | "car";
  const fuel = s.trip.fuel ?? "petrol";
  if (fuel === "electric") return EV_KWH_PER_KM[mode] * ELECTRICITY_INR_PER_KWH;
  return FUEL_PRICE_INR[fuel] / (s.trip.mileage || DEFAULT_MILEAGE[mode]);
}

function tripInr(s: SetupAnswers): number {
  const km = roundTripKm(s);
  switch (s.trip.mode) {
    case "two-wheeler":
    case "car":
      return ownVehicleInrPerKm(s) * km;
    case "metro":
      return metroFare(s.trip.kmOneWay) * 2;
    case "bus":
      return BUS_FARE_INR * 2;
    case "auto":
      return AUTO_INR_PER_KM * km;
    case "cab":
      return CAB_INR_PER_KM * km;
    default:
      return 0;
  }
}

// Replacing the whole round trip with another way of travelling.
function swapTo(s: SetupAnswers, kgPerKmTarget: number, inrTarget: number): Saving {
  return { kg: tripKg(s) - kgPerKmTarget * roundTripKm(s), inr: tripInr(s) - inrTarget };
}

// A share of today's trip, for changes that trim rather than replace it.
function shareOfTrip(s: SetupAnswers, share: number): Saving {
  return { kg: tripKg(s) * share, inr: tripInr(s) * share };
}

function power(kwh: number): Saving {
  return { kg: kwh * GRID_KG_PER_KWH, inr: kwh * ELECTRICITY_INR_PER_KWH };
}

function cookingDay({ cooking, cylinderLasts }: SetupAnswers): Saving {
  if (cooking === "lpg") {
    const days = LPG_CYCLE_DAYS[cylinderLasts];
    return { kg: LPG_KG_PER_CYLINDER / days, inr: LPG_INR_PER_CYLINDER / days };
  }
  return { kg: PNG_KG_PER_DAY, inr: PNG_INR_PER_DAY };
}

function cookingShare(s: SetupAnswers, share: number): Saving {
  const day = cookingDay(s);
  return { kg: day.kg * share, inr: day.inr * share };
}

const hasAc = ({ setup, winter }: MissionContext) => setup.acs > 0 && !winter;
const gasCooking = ({ setup }: MissionContext) => setup.cooking !== "induction";
const eatsMeat = ({ setup }: MissionContext) => setup.diet === "non-veg";
const orders = ({ setup }: MissionContext) => setup.ordersPerWeek !== "none";
const ordersOften = ({ setup }: MissionContext) => setup.ordersPerWeek === "4-7" || setup.ordersPerWeek === "8+";

const acHours = (s: SetupAnswers) => AC_HOURS_BAND[s.acHoursBand];

export const MISSIONS: Mission[] = [
  // Travel
  {
    id: "metro-instead",
    sector: "travel",
    text: ({ setup: s }) => `Take the Metro to ${place(s)} instead of your ${vehicle(s)}.`,
    applies: ({ setup: s }) => motorised(s) && ["two-wheeler", "car", "cab", "auto"].includes(s.trip.mode) && s.trip.kmOneWay >= 3,
    saves: ({ setup: s }) => swapTo(s, PASSENGER_KG_PER_KM.metro, metroFare(s.trip.kmOneWay) * 2),
  },
  {
    id: "bus-instead",
    sector: "travel",
    text: ({ setup: s }) => `Take the bus to ${place(s)} instead of your ${vehicle(s)}.`,
    applies: ({ setup: s }) => motorised(s) && ["two-wheeler", "car", "cab", "auto"].includes(s.trip.mode),
    saves: ({ setup: s }) => swapTo(s, PASSENGER_KG_PER_KM.bus, BUS_FARE_INR * 2),
  },
  {
    id: "carpool",
    sector: "travel",
    text: ({ setup: s }) => `Give someone a lift to ${place(s)} today, or carpool.`,
    applies: ({ setup: s }) => commutes(s) && s.trip.mode === "car",
    saves: ({ setup: s }) => shareOfTrip(s, 1 - 1 / SHARED_PASSENGERS),
  },
  {
    id: "share-cab",
    sector: "travel",
    text: ({ setup: s }) => `Book a shared cab to ${place(s)} today.`,
    applies: ({ setup: s }) => commutes(s) && s.trip.mode === "cab",
    saves: ({ setup: s }) => shareOfTrip(s, 1 - 1 / SHARED_PASSENGERS),
  },
  {
    id: "cycle-short",
    sector: "travel",
    text: ({ setup: s }) => `Cycle to ${place(s)} today. It's only ${s.trip.kmOneWay} km.`,
    applies: ({ setup: s }) => motorised(s) && s.trip.kmOneWay <= 5,
    saves: ({ setup: s }) => swapTo(s, PASSENGER_KG_PER_KM.cycle, 0),
  },
  {
    id: "walk-short",
    sector: "travel",
    text: ({ setup: s }) => `Walk to ${place(s)} today. It's only ${s.trip.kmOneWay} km.`,
    applies: ({ setup: s }) => motorised(s) && s.trip.kmOneWay <= 2,
    saves: ({ setup: s }) => swapTo(s, PASSENGER_KG_PER_KM.walk, 0),
  },
  {
    id: "wfh-day",
    sector: "travel",
    text: () => "Work from home today, if your office allows it.",
    applies: ({ setup: s }) => motorised(s) && s.trip.kind === "office",
    saves: ({ setup: s }) => shareOfTrip(s, 1),
  },
  {
    id: "smooth-ride",
    sector: "travel",
    text: ({ setup: s }) => `Ride smooth on your ${vehicle(s)} today: no hard braking, engine off at long signals.`,
    applies: ({ setup: s }) => onOwnVehicle(s) && s.trip.fuel !== "electric",
    saves: ({ setup: s }) => shareOfTrip(s, 0.1),
  },
  {
    id: "tyre-check",
    sector: "travel",
    text: ({ setup: s }) => `Check the tyre pressure on your ${vehicle(s)} when you next fill up.`,
    applies: ({ setup: s }) => onOwnVehicle(s) && s.trip.fuel !== "electric",
    saves: ({ setup: s }) => shareOfTrip(s, 0.03),
  },
  // Electricity
  {
    id: "ac-26",
    sector: "electricity",
    text: () => "Set the AC to 26°C tonight instead of going colder.",
    applies: hasAc,
    saves: ({ setup: s }) => power(s.acs * AC_KW * acHours(s) * 0.15),
  },
  {
    id: "ac-hour-less",
    sector: "electricity",
    text: () => "Run the AC for one hour less today.",
    applies: hasAc,
    saves: () => power(AC_KW),
  },
  {
    id: "ac-timer",
    sector: "electricity",
    text: () => "Set a sleep timer so the AC switches off after 3 hours tonight.",
    applies: hasAc,
    saves: () => power(AC_KW * 2),
  },
  {
    id: "fan-first",
    sector: "electricity",
    text: () => "Use a fan instead of the AC for the first two hours this evening.",
    applies: hasAc,
    saves: () => power(AC_KW * 2),
  },
  {
    id: "heater-less",
    sector: "electricity",
    text: () => "Run the room heater for one hour less today.",
    applies: ({ winter, lastEnergy }) => winter && (lastEnergy?.heaterHours ?? 0) > 0,
    saves: () => power(HEATER_KW),
  },
  {
    id: "geyser-short",
    sector: "electricity",
    text: () => "Keep your hot shower short today.",
    applies: ({ winter, lastEnergy }) => winter && lastEnergy?.geyser === "long",
    saves: () => power(GEYSER_KWH.long - GEYSER_KWH.short),
  },
  {
    id: "standby-off",
    sector: "electricity",
    text: () => "Switch off the TV, set-top box and chargers at the wall tonight.",
    applies: () => true,
    saves: () => power(0.3),
  },
  {
    id: "lights-off",
    sector: "electricity",
    text: () => "Turn off lights and fans in empty rooms all day.",
    applies: () => true,
    saves: () => power(0.3),
  },
  {
    id: "full-load",
    sector: "electricity",
    text: () => "Run the washing machine only with a full load, on a cold wash.",
    applies: () => true,
    saves: () => power(0.5),
  },
  // Cooking
  {
    id: "lid-on",
    sector: "cooking",
    text: () => "Keep lids on your pots while cooking today.",
    applies: gasCooking,
    saves: ({ setup: s }) => cookingShare(s, 0.1),
  },
  {
    id: "pressure-cooker",
    sector: "cooking",
    text: () => "Use the pressure cooker for dal and rice today.",
    applies: gasCooking,
    saves: ({ setup: s }) => cookingShare(s, 0.2),
  },
  {
    id: "batch-cook",
    sector: "cooking",
    text: () => "Cook once for lunch and dinner today.",
    applies: gasCooking,
    saves: ({ setup: s }) => cookingShare(s, 0.25),
  },
  // Food
  {
    id: "veg-dinner",
    sector: "food",
    text: () => "Swap tonight's chicken for dal or paneer.",
    applies: eatsMeat,
    saves: () => ({ kg: MEAL_KG.chicken - MEAL_KG["veg-dairy"], inr: MEAL_SWAP_INR.chicken }),
  },
  {
    id: "no-mutton",
    sector: "food",
    text: () => "Pick chicken or fish instead of mutton this week.",
    applies: eatsMeat,
    saves: () => ({ kg: MEAL_KG.mutton - MEAL_KG.chicken, inr: MEAL_SWAP_INR.mutton }),
  },
  {
    id: "veg-day",
    sector: "food",
    text: () => "Make today fully vegetarian.",
    applies: ({ setup: s }) => s.diet === "non-veg" && s.nonVegFrequency === "daily",
    saves: () => ({ kg: MEAL_KG.chicken - MEAL_KG.veg, inr: MEAL_SWAP_INR.chicken }),
  },
  {
    id: "dal-for-egg",
    sector: "food",
    text: () => "Have dal or sprouts instead of eggs at one meal today.",
    applies: ({ setup: s }) => s.diet === "egg",
    saves: () => ({ kg: MEAL_KG.egg - MEAL_KG.veg, inr: 0 }),
  },
  {
    id: "less-dairy",
    sector: "food",
    text: () => "Pick a lighter meal without paneer or cheese today.",
    applies: () => true,
    saves: () => ({ kg: MEAL_KG["veg-dairy"] - MEAL_KG.veg, inr: 0 }),
  },
  {
    id: "no-waste",
    sector: "food",
    text: () => "Finish yesterday's leftovers before cooking anything new.",
    applies: () => true,
    saves: () => ({ kg: MEAL_KG.veg, inr: 30 }),
  },
  // Deliveries
  {
    id: "club-orders",
    sector: "deliveries",
    text: () => "Club this week's online orders into one delivery.",
    applies: orders,
    saves: () => ({ kg: DELIVERY_KG.parcel, inr: 0 }),
  },
  {
    id: "cook-not-order",
    sector: "deliveries",
    text: () => "Cook at home instead of ordering in today.",
    applies: ordersOften,
    saves: () => ({ kg: DELIVERY_KG.food, inr: DELIVERY_ORDER_INR }),
  },
  {
    id: "pick-up",
    sector: "deliveries",
    text: () => "Pick up groceries on your way home instead of ordering them.",
    applies: orders,
    saves: () => ({ kg: DELIVERY_KG.grocery, inr: 0 }),
  },
];
