// Every user-facing name and line of copy, for both modes. Nothing else should hardcode them.

import type { Mode } from "./types";

type Pair = Record<Mode, string>;

function pair(hero: string, plain: string): Pair {
  return { hero, plain };
}

export const LABELS = {
  homeTab: pair("The City", "Home"),
  airTab: pair("Airspace", "Air Today"),
  checkinTab: pair("Canon Event", "Check-in"),
  footprintTab: pair("Collateral", "My Footprint"),
  progressTab: pair("Ranks", "Progress"),
  family: pair("Squad", "Family"),
  assistant: pair("EDITH", "EDITH"),
  aqiCard: pair("Threat", "Air Now"),
  bestWindow: pair("Go Time", "Best Time Out"),
  healthAlert: pair("Alert", "Health Alert"),
  hearts: pair("Lives", "Lung Health"),
  mission: pair("Today's Mission", "Today's Tip"),
  footprintMeter: pair("Collateral Meter", "My Footprint"),
  forecast: pair("Threat Forecast", "Next 24 Hours"),
  exposure: pair("Damage Taken", "What You Breathed Today"),
  protection: pair("Defence", "Stay Safe"),
  pollutants: pair("Villain's Weapons", "What's in the Air"),
  history: pair("Threat History", "Past 7 Days"),
  breakdown: pair("Damage Report", "Breakdown"),
  cuts: pair("Counter-Moves", "Ways to Cut"),
  familyAlerts: pair("Squad Alerts", "Family Alerts"),
  familyFootprint: pair("Squad Collateral", "Family Footprint"),
  weeklyGoal: pair("Squad Goal", "Family Challenge"),
  diwali: pair("Diwali Watch", "Diwali air guide"),
};

export const SIGN_IN = {
  sticker: "Every city needs one.",
  name: "EDITH",
  taglineOne: "Dodge the smog.",
  taglineTwo: "Shrink your share of it.",
  airPrefix: "Delhi right now:",
  google: "Continue with Google",
  guest: "Try without an account",
  guestNote: "Guest mode keeps your data on this phone. Sign in later to save streaks and add your family.",
  googleMissing: "Google sign-in isn't set up yet. Try without an account for now.",
  googleFailed: "Google sign-in didn't work. Please try again, or try without an account.",
};

export const STYLE_PICK = {
  sticker: "Issue #0 · Origin",
  title: "Pick your style",
  intro: "Same app, same features. You can switch any time in Settings.",
  picked: "Picked",
  heroName: "Hero",
  heroLine: "Comic-book city, missions and ranks.",
  plainName: "Plain",
  plainLine: "Clean and calm. Just the facts.",
  button: "Suit up",
  note: "About 15 quick screens · 90 seconds",
};

export const SECTION_NAMES = {
  base: pair("Your Base", "Your Home"),
  patrol: pair("Your Patrol", "Your Routine"),
  power: pair("Your Power", "Energy at Home"),
  fuel: pair("Your Fuel", "Food & Lifestyle"),
};

export const STEP_COPY = {
  location: {
    title: pair("Where's your base, hero?", "Where do you live?"),
    why: pair("To show the air on your street, not just your city.", "To show the air on your street, not just your city."),
  },
  home: {
    title: pair("Tell me about your base.", "Tell us about your home"),
    why: pair(
      "To split home energy fairly. Pets feel bad air too, so we'll tell you when it's safe to take them out.",
      "To split home energy fairly. Pets feel bad air too, so we'll tell you when it's safe to take them out.",
    ),
  },
  care: {
    title: pair("Anyone at base who needs extra cover?", "Does anyone at home need extra care on bad air days?"),
    why: pair("So we can warn you before the air turns risky for them.", "So we can warn you before the air turns risky for them."),
  },
  trip: {
    title: pair("Where does your daily patrol take you?", "Where do you go most days?"),
    why: pair("Your daily trip shapes both your footprint and your air.", "Your daily trip shapes both your footprint and your air."),
  },
  distance: {
    title: pair("How far, and how often?", "How far is it, and how often do you go?"),
    why: pair("To work out your savings in ₹ and CO₂.", "To work out your savings in ₹ and CO₂."),
  },
  mode: {
    title: pair("How do you get there?", "How do you usually get there?"),
    why: pair("Pick what covers most of the distance.", "Pick what covers most of the distance."),
  },
  fuel: {
    title: pair("What powers your ride?", "What fuel does your vehicle use?"),
    why: pair("Skip mileage and we'll use a typical value.", "Skip mileage and we'll use a typical value."),
  },
  outdoors: {
    title: pair("When are you out in the city?", "When are you usually outdoors?"),
    why: pair("This is how we predict your Lives and Go Time.", "So we can find your best time to go out."),
  },
  exercise: {
    title: pair("Do you train outdoors?", "Do you exercise outdoors?"),
    why: pair("You breathe in much more air when you exercise.", "You breathe in much more air when you exercise."),
  },
  acs: {
    title: pair("How many ACs at base?", "How many ACs do you have?"),
    why: pair("ACs are usually a home's biggest power user.", "ACs are usually a home's biggest power user."),
  },
  cooking: {
    title: pair("What fires up your kitchen?", "What do you cook with?"),
    why: pair("Cooking gas adds to every home's footprint.", "Cooking gas adds to every home's footprint."),
  },
  purifier: {
    title: pair("Got an air purifier on guard?", "Do you use an air purifier?"),
    why: pair("A purifier cuts what you breathe indoors.", "A purifier cuts what you breathe indoors."),
  },
  bill: {
    title: pair("Show EDITH your electricity bill.", "Add your last electricity bill"),
    why: pair("Your bill shows exactly how much power you used.", "Your bill shows exactly how much power you used."),
  },
  diet: {
    title: pair("What fuels you?", "What do you usually eat?"),
    why: pair("Food counts too. Only you see this.", "Food counts too. Only you see this."),
  },
  orders: {
    title: pair("How many deliveries hit your base each week?", "How many online orders do you get a week?"),
    why: pair("Packaging and delivery trips add up.", "Packaging and delivery trips add up."),
  },
  flights: {
    title: pair("Any flights in the last 12 months?", "How many flights in the last 12 months?"),
    why: pair("One flight can outweigh months of commuting.", "One flight can outweigh months of commuting."),
  },
};

export const SETUP_TEXT = {
  back: "Back",
  later: "Later",
  whyWeAsk: "Why we ask",
  next: pair("Next", "Continue"),
  finish: "Finish",
  issue: "Issue",
  progressHero: (step: number, total: number, seconds: number) =>
    `${step} of ${total} in this issue · about ${seconds} sec left`,
  progressPlain: (step: number, total: number, seconds: number) =>
    `${step} of ${total} · about ${seconds} seconds left`,
  useLocation: pair("Use my location", "Use my location"),
  locationFound: "Using your location",
  locationFailed: "Couldn't get your location. Pick your area instead.",
  pickArea: "Or pick your area",
  otherPlaceholder: "Type your area or city",
  otherSearch: "Search",
  otherNone: "No match found. Check the spelling, or pick a nearby area.",
  otherOffline: "Couldn't search right now, so we'll use Delhi's air for this area.",
  whoLives: "Who lives here, including you",
  people: "people",
  homeType: pair("What kind of home", "Type of home"),
  pets: "Any pets at home?",
  pickAll: pair("Pick all that apply.", "Choose all that apply."),
  kmOneWay: "km one way",
  address: "Or type the address, we'll measure it",
  addressPlaceholder: "Your college or office",
  addressRouted: (km: number) => `${km} km by road. Move the slider if your route is different.`,
  addressFound: (km: number) => `About ${km} km, estimated. Move the slider if that's off.`,
  addressFailed: "Couldn't find that address. Use the slider instead.",
  addressNeedsBase: "Pick an exact location first to measure this, or use the slider.",
  daysWeek: "Days a week",
  fuelLabel: "Fuel",
  mileage: "Mileage in km per litre (optional)",
  acsUnit: "ACs",
  acHours: "Hours a day in summer",
  cylinder: "One cylinder lasts about",
  snap: "Snap your bill",
  snapSoon: "Reading bill photos is coming soon. Pick a rough amount for now.",
  noBill: "No bill handy? Pick a rough monthly amount",
  howOften: "How often?",
  domestic: "Domestic round trips",
  international: "International round trips",
  saveFailed: "Couldn't save your answers. Check your connection and try again.",
};

export const FINISH = {
  hero: {
    sticker: "Issue #4 · Complete",
    title: "That's a wrap!",
    intro: "EDITH knows your city now. Here's your origin story recap.",
    cardSticker: "Origin story",
    rows: ["Base", "Patrol", "Pets", "Power", "Fuel"],
    readyTitle: "Your city is ready.",
    ready: ["Scanning the air on your street...", "Counting your collateral...", "Picking your first mission..."],
    button: "Enter the city",
    loading: "Suiting up…",
    note: "",
  },
  plain: {
    sticker: "",
    title: "You're all set.",
    intro: "That took about a minute. Here's a quick recap of what EDITH now knows.",
    cardSticker: "",
    rows: ["Home", "Routine", "Pets", "Energy", "Food"],
    readyTitle: "Ready.",
    ready: ["Getting the air for your street", "Working out your footprint", "Choosing today's tip"],
    button: "Go to Home",
    loading: "Getting ready…",
    note: "You can change these any time in Settings › My details.",
  },
};

export const OPTIONS = {
  homeType: { flat: "Flat", house: "House", pg: "PG / hostel" },
  extraCare: {
    children: "Young children",
    elderly: "Elderly (60+)",
    breathing: "Asthma or breathing issues",
    heart: "Heart condition",
    pregnant: "Pregnant",
    none: "No one",
  },
  trip: { college: "College", office: "Office", school: "School", wfh: "Work from home" },
  mode: {
    metro: "Metro",
    bus: "Bus",
    auto: "Auto",
    cab: "Cab",
    "two-wheeler": "Two-wheeler",
    car: "Car",
    walk: "Walk",
    cycle: "Cycle",
  },
  fuel: { petrol: "Petrol", diesel: "Diesel", cng: "CNG", electric: "Electric" },
  outdoor: {
    early: "Early morning · 5–8 AM",
    morning: "Morning commute · 8–11 AM",
    afternoon: "Afternoon · 11 AM–4 PM",
    evening: "Evening commute · 4–8 PM",
    night: "Night · after 8 PM",
    indoors: "Mostly indoors",
  },
  exercise: { no: "No", mornings: "Yes, mornings", evenings: "Yes, evenings", both: "Both" },
  acHours: { "1-3": "1–3", "4-6": "4–6", "7-10": "7–10", "10+": "10+" },
  cooking: { lpg: "LPG cylinder", png: "Piped gas (PNG)", induction: "Induction / electric" },
  cookingShort: { lpg: "LPG", png: "PNG", induction: "Induction" },
  cylinder: { "1": "1 month", "2": "2 months", "3+": "3+ months" },
  purifier: { no: "No", one: "Yes, in one room", most: "Yes, in most rooms" },
  bill: {
    under1000: "Under ₹1,000",
    "1000-2500": "₹1,000–2,500",
    "2500-5000": "₹2,500–5,000",
    over5000: "Over ₹5,000",
  },
  diet: { veg: "Vegetarian", egg: "Eggetarian", "non-veg": "Non-veg" },
  frequency: { daily: "Daily", few: "Few times a week", rarely: "Rarely" },
  orders: { none: "None", "1-3": "1–3", "4-7": "4–7", "8+": "8+" },
  domestic: { "0": "0", "1-2": "1–2", "3-5": "3–5", "6+": "6+" },
  international: { "0": "0", "1": "1", "2-3": "2–3", "4+": "4+" },
  pets: { dog: "Dog", cat: "Cat", bird: "Bird", other: "Other" },
};

export const RECAP_TEXT = {
  person: (n: number) => (n === 1 ? "1 person" : `${n} people`),
  wfh: "Works from home",
  noPets: "No pets",
  petNames: { dog: ["dog", "dogs"], cat: ["cat", "cats"], bird: ["bird", "birds"], other: ["other pet", "other pets"] },
  noAc: "No AC",
  ac: (n: number) => (n === 1 ? "1 AC" : `${n} ACs`),
  deliveries: pair("deliveries a week", "orders a week"),
  noDeliveries: pair("No deliveries", "No orders"),
};

export const HOME_SOON = {
  title: "Coming next",
  line: "Your setup is saved. The home screen is the next thing being built.",
};

export const LEGAL = {
  home: "← EDITH home",
  updated: "Last updated: 1 November 2026",
  contactPrefix: "Questions or requests:",
  email: "arora.19ashima@gmail.com",
  about:
    "EDITH is an India-first air quality and carbon footprint companion. It shows live air quality, the best time to go out, and your own footprint with ways to cut it.",
  privacyTitle: "Privacy Policy",
  termsTitle: "Terms of Use",
  privacy: [
    {
      heading: "Who we are",
      body: "EDITH is a student project built by Team Felix Felicis (Rahul, Diwakar, Kriti and Ashima) for the Hack the Circle hackathon. This policy explains what the app collects and why.",
    },
    {
      heading: "Using EDITH as a guest",
      body: "If you choose \"Try without an account\", your answers stay in your browser on this device. We don't receive them, and clearing your browser data removes them.",
    },
    {
      heading: "Signing in with Google",
      body: "If you sign in with Google, we receive your name and email address, and a unique account ID. We use these only to sign you in and keep your data under your account. We don't ask for access to your Gmail, contacts or files.",
    },
    {
      heading: "What you tell us",
      body: "When signed in, we store your setup answers: your area or location, household size, home type, pets, routine, travel, energy use, food and deliveries. This includes whether someone at home is a child, elderly, pregnant, or has a breathing or heart condition, which is used only to show air quality warnings.",
    },
    {
      heading: "How we use it",
      body: "Only to run EDITH for you: showing the air where you are, estimating your footprint, and giving advice that fits your life. We don't sell your data or use it for advertising.",
    },
    {
      heading: "Services that handle data for us",
      body: "Supabase stores accounts and signed-in data. Vercel hosts the app. Google provides sign-in. Open-Meteo receives place names you search for, and coordinates, to return air quality and locations. If road distance is turned on, Google Maps receives your base location and the address you type. If you use location access, your browser asks your permission first.",
    },
    {
      heading: "Keeping and deleting your data",
      body: "We keep signed-in data until you ask us to delete it. Email us from your account's address and we'll delete your account and data.",
    },
    {
      heading: "Google user data",
      body: "EDITH's use of information received from Google is limited to the sign-in purposes above. We don't transfer it to others except the services named here, and we don't use it for advertising.",
    },
    {
      heading: "Changes",
      body: "As features are added we'll update this page and the date above. Features that use new data, such as reading bill photos, will be described here before they go live.",
    },
  ],
  terms: [
    {
      heading: "Using EDITH",
      body: "EDITH is a free student project, offered as it is. Features may change or stop working while it's being built.",
    },
    {
      heading: "Not medical advice",
      body: "Air quality, cigarette equivalents and Lives are planning guides, not medical advice. For breathing trouble or chest pain, get medical help. In an emergency in India, call 112.",
    },
    {
      heading: "Estimates",
      body: "Air quality comes from modelled data and can differ from nearby monitoring stations. Footprint numbers are estimates and shouldn't be relied on for legal, financial or compliance purposes.",
    },
    {
      heading: "Your account",
      body: "Please use your own Google account and don't misuse the app or try to access other people's data.",
    },
    {
      heading: "Open source",
      body: "EDITH's code is available under the MIT License. Data sources are credited in the app's documentation.",
    },
  ],
};
