import { DETAIL_TEXT, OPTIONS, RECAP_TEXT } from "./labels";
import type { Fuel, Mode, Purifier, SetupAnswers, TimeBlock, TravelMode } from "./types";

export const AREAS = [
  { area: "Dwarka", lat: 28.5921, lng: 77.046 },
  { area: "Rohini", lat: 28.7383, lng: 77.0822 },
  { area: "Saket", lat: 28.5245, lng: 77.2066 },
  { area: "Noida", lat: 28.5355, lng: 77.391 },
  { area: "Gurugram", lat: 28.4595, lng: 77.0266 },
];

export type SectionId = "base" | "patrol" | "power" | "fuel";
export type StepId =
  | "location" | "home" | "care"
  | "trip" | "distance" | "mode" | "fuel" | "outdoors" | "exercise"
  | "acs" | "cooking" | "purifier" | "bill"
  | "diet" | "orders" | "flights";

export const SECTIONS: { id: SectionId; steps: StepId[] }[] = [
  { id: "base", steps: ["location", "home", "care"] },
  { id: "patrol", steps: ["trip", "distance", "mode", "fuel", "outdoors", "exercise"] },
  { id: "power", steps: ["acs", "cooking", "purifier", "bill"] },
  { id: "fuel", steps: ["diet", "orders", "flights"] },
];

// Time left shown on each screen, from the prototype.
const SECONDS_LEFT: Record<StepId, number> = {
  location: 75, home: 70, care: 65,
  trip: 60, distance: 55, mode: 50, fuel: 50, outdoors: 45, exercise: 40,
  acs: 35, cooking: 30, purifier: 25, bill: 20,
  diet: 15, orders: 10, flights: 5,
};

export interface SetupDraft {
  location: SetupAnswers["location"] | null;
  people: number;
  homeType: SetupAnswers["homeType"] | null;
  pets: SetupAnswers["pets"];
  extraCare: SetupAnswers["extraCare"];
  tripKind: SetupAnswers["trip"]["kind"] | null;
  kmOneWay: number;
  address: string;
  daysPerWeek: number;
  mode: TravelMode | null;
  fuel: Fuel | null;
  mileage: string;
  outdoor: (TimeBlock | "indoors")[];
  exercise: SetupAnswers["exercise"] | null;
  acs: number;
  acHoursBand: SetupAnswers["acHoursBand"] | null;
  cooking: SetupAnswers["cooking"] | null;
  cylinderLasts: SetupAnswers["cylinderLasts"] | null;
  purifier: Purifier | null;
  billBand: SetupAnswers["billBand"];
  diet: SetupAnswers["diet"] | null;
  nonVegFrequency: SetupAnswers["nonVegFrequency"] | null;
  ordersPerWeek: SetupAnswers["ordersPerWeek"] | null;
  domestic: SetupAnswers["flights"]["domestic"] | null;
  international: SetupAnswers["flights"]["international"] | null;
}

// Choices start empty so nobody saves sample answers by tapping through.
export const EMPTY_DRAFT: SetupDraft = {
  location: null,
  people: 4,
  homeType: null,
  pets: { dog: 0, cat: 0, bird: 0, other: 0 },
  extraCare: [],
  tripKind: null,
  kmOneWay: 12,
  address: "",
  daysPerWeek: 6,
  mode: null,
  fuel: null,
  mileage: "",
  outdoor: [],
  exercise: null,
  acs: 0,
  acHoursBand: null,
  cooking: null,
  cylinderLasts: null,
  purifier: null,
  billBand: null,
  diet: null,
  nonVegFrequency: null,
  ordersPerWeek: null,
  domestic: null,
  international: null,
};

export function isOwnVehicle(mode: TravelMode | null): boolean {
  return mode === "two-wheeler" || mode === "car";
}

function isVisible(step: StepId, draft: SetupDraft): boolean {
  const wfh = draft.tripKind === "wfh";
  if (step === "distance" || step === "mode") return !wfh;
  if (step === "fuel") return !wfh && isOwnVehicle(draft.mode);
  return true;
}

export function visibleSteps(draft: SetupDraft): StepId[] {
  return SECTIONS.flatMap((s) => s.steps).filter((step) => isVisible(step, draft));
}

export interface StepPosition {
  section: SectionId;
  sectionIndex: number;
  step: number; // 1-based, within the section
  total: number; // Visible steps in the section
  seconds: number;
}

export function stepPosition(step: StepId, draft: SetupDraft): StepPosition {
  const sectionIndex = SECTIONS.findIndex((s) => s.steps.includes(step));
  const visible = SECTIONS[sectionIndex].steps.filter((s) => isVisible(s, draft));
  return {
    section: SECTIONS[sectionIndex].id,
    sectionIndex,
    step: visible.indexOf(step) + 1,
    total: visible.length,
    seconds: SECONDS_LEFT[step],
  };
}

// Share of each of the four progress bars that is filled on this step.
export function progressFill(step: StepId, draft: SetupDraft): number[] {
  const position = stepPosition(step, draft);
  return SECTIONS.map((_, i) => {
    if (i < position.sectionIndex) return 1;
    if (i > position.sectionIndex) return 0;
    return position.step / position.total;
  });
}

export function isStepComplete(step: StepId, d: SetupDraft): boolean {
  switch (step) {
    case "location": return d.location !== null;
    case "home": return d.homeType !== null;
    case "care": return d.extraCare.length > 0;
    case "trip": return d.tripKind !== null;
    case "distance": return true;
    case "mode": return d.mode !== null;
    case "fuel": return d.fuel !== null;
    case "outdoors": return d.outdoor.length > 0;
    case "exercise": return d.exercise !== null;
    case "acs": return d.acs === 0 || d.acHoursBand !== null;
    case "cooking": return d.cooking !== null && (d.cooking !== "lpg" || d.cylinderLasts !== null);
    case "purifier": return d.purifier !== null;
    case "bill": return true; // Optional
    case "diet": return d.diet !== null && (d.diet !== "non-veg" || d.nonVegFrequency !== null);
    case "orders": return d.ordersPerWeek !== null;
    case "flights": return d.domestic !== null && d.international !== null;
  }
}

// Multi-select where one option ("No one", "Mostly indoors") excludes all the others.
export function toggleExclusive<T extends string>(list: T[], value: T, exclusive: T): T[] {
  if (value === exclusive) return list.includes(value) ? [] : [value];
  const others = list.filter((v) => v !== exclusive);
  return others.includes(value) ? others.filter((v) => v !== value) : [...others, value];
}

// Assumes every visible step is complete. Hidden answers get values that add nothing to the footprint.
export function finalizeSetup(d: SetupDraft): SetupAnswers {
  const wfh = d.tripKind === "wfh";
  const mode = wfh ? "walk" : d.mode!;
  const mileage = Number(d.mileage);
  const own = !wfh && isOwnVehicle(mode);
  return {
    location: d.location!,
    people: d.people,
    homeType: d.homeType!,
    pets: d.pets,
    extraCare: d.extraCare,
    trip: {
      kind: d.tripKind!,
      kmOneWay: wfh ? 0 : d.kmOneWay,
      address: d.address.trim() || undefined,
      daysPerWeek: wfh ? 0 : d.daysPerWeek,
      mode,
      fuel: own ? d.fuel! : undefined,
      mileage: own && d.fuel !== "electric" && mileage > 0 ? mileage : undefined,
    },
    outdoorBlocks: d.outdoor.filter((b): b is TimeBlock => b !== "indoors"),
    exercise: d.exercise!,
    acs: d.acs,
    acHoursBand: d.acHoursBand ?? "1-3",
    cooking: d.cooking!,
    cylinderLasts: d.cylinderLasts ?? "2",
    purifier: d.purifier!,
    billBand: d.billBand,
    diet: d.diet!,
    nonVegFrequency: d.nonVegFrequency ?? "rarely",
    ordersPerWeek: d.ordersPerWeek!,
    flights: { domestic: d.domestic!, international: d.international! },
  };
}

// Saved answers back into the form, for editing from Settings.
export function draftFromAnswers(a: SetupAnswers): SetupDraft {
  const wfh = a.trip.kind === "wfh";
  return {
    ...EMPTY_DRAFT,
    location: a.location,
    people: a.people,
    homeType: a.homeType,
    pets: a.pets,
    extraCare: a.extraCare,
    tripKind: a.trip.kind,
    kmOneWay: wfh ? EMPTY_DRAFT.kmOneWay : a.trip.kmOneWay,
    address: a.trip.address ?? "",
    daysPerWeek: wfh ? EMPTY_DRAFT.daysPerWeek : a.trip.daysPerWeek,
    mode: wfh ? null : a.trip.mode,
    fuel: a.trip.fuel ?? null,
    mileage: a.trip.mileage ? String(a.trip.mileage) : "",
    outdoor: a.outdoorBlocks.length ? a.outdoorBlocks : ["indoors"],
    exercise: a.exercise,
    acs: a.acs,
    acHoursBand: a.acHoursBand,
    cooking: a.cooking,
    cylinderLasts: a.cylinderLasts,
    purifier: a.purifier,
    billBand: a.billBand,
    diet: a.diet,
    nonVegFrequency: a.nonVegFrequency,
    ordersPerWeek: a.ordersPerWeek,
    domestic: a.flights.domestic,
    international: a.flights.international,
  };
}

function petsLine(pets: SetupAnswers["pets"]): string {
  const parts = (Object.keys(pets) as (keyof SetupAnswers["pets"])[])
    .filter((pet) => pets[pet] > 0)
    .map((pet) => `${pets[pet]} ${RECAP_TEXT.petNames[pet][pets[pet] === 1 ? 0 : 1]}`);
  return parts.length ? parts.join(", ") : RECAP_TEXT.noPets;
}

// The five recap rows on the finish screen, in the order of FINISH rows.
export function recapLines(a: SetupAnswers, mode: Mode): string[] {
  const place = OPTIONS.trip[a.trip.kind].toLowerCase();
  const orders = a.ordersPerWeek === "none"
    ? RECAP_TEXT.noDeliveries[mode]
    : `${OPTIONS.orders[a.ordersPerWeek]} ${RECAP_TEXT.deliveries[mode]}`;
  return [
    `${a.location.area} · ${RECAP_TEXT.person(a.people)}`,
    a.trip.kind === "wfh" ? RECAP_TEXT.wfh : `${OPTIONS.mode[a.trip.mode]} to ${place} · ${a.trip.kmOneWay} km`,
    petsLine(a.pets),
    `${a.acs === 0 ? RECAP_TEXT.noAc : RECAP_TEXT.ac(a.acs)} · ${OPTIONS.cookingShort[a.cooking]}`,
    `${OPTIONS.diet[a.diet]} · ${orders}`,
  ];
}

// One line per setup section, for Settings > My details.
export function detailLines(a: SetupAnswers, mode: Mode): string[] {
  const place = OPTIONS.trip[a.trip.kind].toLowerCase();
  const orders = a.ordersPerWeek === "none"
    ? DETAIL_TEXT.noOrders[mode]
    : `${OPTIONS.orders[a.ordersPerWeek]} ${DETAIL_TEXT.orders[mode]}`;
  const diet = OPTIONS.diet[a.diet];
  return [
    [a.location.area, RECAP_TEXT.person(a.people), OPTIONS.homeType[a.homeType], petsLine(a.pets)].join(" · "),
    a.trip.kind === "wfh"
      ? RECAP_TEXT.wfh
      : `${OPTIONS.mode[a.trip.mode]} to ${place} · ${a.trip.kmOneWay} km · ${a.trip.daysPerWeek} days`,
    [a.acs === 0 ? RECAP_TEXT.noAc : RECAP_TEXT.ac(a.acs), OPTIONS.cookingShort[a.cooking], DETAIL_TEXT.purifier[a.purifier]].join(" · "),
    [diet, orders, DETAIL_TEXT.flights(OPTIONS.domestic[a.flights.domestic], OPTIONS.international[a.flights.international])].join(" · "),
  ];
}
