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
  saveEdit: "Save",
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
      body: "Supabase stores accounts and signed-in data. Vercel hosts the app. Google provides sign-in. Open-Meteo receives place names you search for, and coordinates, to return air quality and locations. If road distance is turned on, Google Maps receives your base location and the address you type. If AI suggestions are turned on, Google Gemini receives your biggest footprint source and a list of possible daily tips, with no name or contact details, to choose today's tip. If you use location access, your browser asks your permission first.",
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
      body: "As features are added we'll update this page and the date above. Features that use new data, such as reading bill photos or the EDITH assistant, will be described here before they go live.",
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

export const NAV = {
  home: { hero: "City", plain: "Home", href: "/app" },
  air: { hero: "Airspace", plain: "Air Today", href: "/app/air" },
  checkin: { hero: "Canon Event", plain: "Check-in", href: "/app/checkin" },
  footprint: { hero: "Collateral", plain: "Footprint", href: "/app/footprint" },
  progress: { hero: "Ranks", plain: "Progress", href: "/app/progress" },
};

export const COMING_SOON = {
  air: { title: LABELS.airTab, nav: "air" },
  checkin: { title: LABELS.checkinTab, nav: "checkin" },
  footprint: { title: LABELS.footprintTab, nav: "footprint" },
  family: { title: LABELS.family, nav: null },
  assistant: { title: LABELS.assistant, nav: null },
} as const;

export const HOME_TEXT = {
  comingSoon: "This part of EDITH is coming soon.",
  meanwhile: (area: string) => `Meanwhile, in ${area}…`,
  meanwhileNoArea: "Meanwhile, in your city…",
  yourLocation: "Your location",
  date: (date: string) =>
    new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }),
  headFamily: pair("Squad", "Family"),
  headAssistant: pair("EDITH", "Assistant"),
  headProfile: pair("You", "Profile"),
  youInitial: "Y",
  says: "EDITH says",
  alertTag: pair("Squad Alert", "Health alert"),
  threatTag: pair("Threat level · AQI", "Air quality"),
  footprintTag: pair("My footprint", "My footprint"),
  footprintUnit: pair("kg CO₂ this month", "kg CO₂ this month"),
  headline: {
    hero: {
      unknown: "Can't reach the air data right now. Try again in a bit.",
      clean: "Clean skies! Perfect day for a walk.",
      okay: (when: string) => `Not bad out there. Best time to head out is ${when}.`,
      okayTomorrow: (when: string) => `Not bad out there. Tomorrow's best time is ${when}.`,
      okayNoWindow: "Not bad out there today.",
      heavyUntil: (hour: string) => `Heavy air today! Stay in till ${hour}, then you're good to go.`,
      heavyAllDay: (when: string) => `Heavy air all day! If you must head out, ${when} is the least bad.`,
      heavyTomorrow: (when: string) => `Heavy air tonight! Stay in. Tomorrow's best time is ${when}.`,
      heavyNoWindow: "Heavy air today! Stay in if you can.",
      windowOpen: (until: string) => `Heavy air today, but your window's open! Head out till ${until}.`,
    },
    plain: {
      unknown: "We can't get the air data right now. Please try again soon.",
      clean: "The air is clean today. It's a good day for a walk.",
      okay: (when: string) => `The air is okay today. The best time to go out is ${when}.`,
      okayTomorrow: (when: string) => `The air is okay now. Tomorrow's best time is ${when}.`,
      okayNoWindow: "The air is okay today.",
      heavyUntil: (hour: string) => `The air is heavy today. Stay in till ${hour}, then it's fine to go out.`,
      heavyAllDay: (when: string) => `The air is heavy all day. If you have to go out, ${when} is the least bad.`,
      heavyTomorrow: (when: string) => `The air is heavy tonight. Stay in if you can. Tomorrow's best time is ${when}.`,
      heavyNoWindow: "The air is heavy today. Stay in if you can.",
      windowOpen: (until: string) => `The air is heavy today, but this is your best time. Go out before ${until}.`,
    },
  },
  alert: {
    hero: {
      children: "the little ones",
      elderly: "elders",
      breathing: "anyone with breathing or heart trouble",
      insideTill: (who: string, hour: string) => `Keep ${who} inside till ${hour}.`,
      insideToday: (who: string) => `Keep ${who} inside today.`,
      dog: (n: number) => `Walk the ${n === 1 ? "dog" : "dogs"} during Go Time, and keep it short.`,
      bird: "Keep birds away from open windows and smoke.",
      otherPets: "Keep other pets indoors.",
    },
    plain: {
      children: "the children",
      elderly: "older family members",
      breathing: "anyone with breathing or heart problems",
      insideTill: (who: string, hour: string) => `Keep ${who} inside till ${hour}.`,
      insideToday: (who: string) => `Keep ${who} inside today.`,
      dog: (n: number) => `Walk the ${n === 1 ? "dog" : "dogs"} at the best time, and keep it short.`,
      bird: "Keep birds away from open windows and smoke.",
      otherPets: "Keep other pets indoors.",
    },
  },
  cigarettes: {
    hero: (n: number) => `≈ ${n} ${n === 1 ? "cigarette" : "cigarettes"} if you're out all day`,
    plain: (n: number) => `≈ ${n} ${n === 1 ? "cigarette" : "cigarettes"} if out all day`,
  },
  staleAir: (at: number) =>
    `Last updated ${new Date(at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}`,
  airUnavailable: "Air data is unavailable right now.",
  airLoading: "Getting the air…",
  footprint: {
    loading: "Adding it up…",
    firstMonth: "Your first month: we're learning your routine.",
    diff: (kg: number, less: boolean) => `${kg} kg ${less ? "less" : "more"}`,
    thanLastMonth: "than this date last month.",
    change: (kg: number, less: boolean) => `${less ? "↓" : "↑"} ${kg} kg vs last month`,
    byDate: (kg: number) => `${kg} kg by this date`,
  },
  goToday: {
    hero: (aqi: number) => `Cleanest window · AQI ${aqi}`,
    plain: (aqi: number) => `Cleanest today · AQI ${aqi}`,
  },
  goTomorrow: (aqi: number) => `Tomorrow's cleanest · AQI ${aqi}`,
  chartStart: pair("6a", "6 AM"),
  chartEnd: pair("10p", "10 PM"),
  youSave: "You save",
  kgUnit: pair("kg + CO₂", "kg CO₂"),
  inrUnit: pair("+ today", "today"),
  costsMore: (inr: number) => `Costs about ₹${inr} more today`,
  missionAccept: pair("Accept", "I'll do this"),
  missionDone: pair("Done!", "Done ✓"),
  missionLoading: "Picking today's mission…",
  livesCount: {
    hero: (safe: number) => `${safe} / 5 safe`,
    plain: (safe: number) => `${safe} of 5 safe`,
  },
  hearts: (n: number) => (n === 1 ? "1 heart" : `${n} hearts`),
  livesCost: ["Your usual routine will cost", "today."],
  livesKeep: (n: number, walk: boolean, when: string, mode: Mode) =>
    `${mode === "hero" ? "Shift" : "Move"} your ${walk ? "walk" : "time outside"} to ${when} and keep ${n} more.`,
  livesSafe: "Your usual routine is safe today. Enjoy it.",
  billTitle: pair("New month!", "New month."),
  billText: pair("Snap your electricity bill. EDITH reads it.", "Add your electricity bill."),
  billButton: pair("Snap", "Add"),
  billSoon: "Reading bill photos is coming soon, so this one wasn't saved. We'll ask again next month.",
  streak: {
    hero: (n: number) => `${n}-day streak`,
    plain: (n: number) => `${n}-day streak`,
  },
  streakSub: pair("4 taps · 30 sec", "4 questions · 30 sec"),
  checkinButton: pair("Log today's Canon Event", "Do today's check-in"),
};

export const CHECK_SECTIONS = ["base", "patrol", "power", "fuel"] as const;

export const RANKS_TEXT = {
  subtitle: pair("Your hero journey. Only you against your own start.", "Measured against your own start, never other people."),
  loadFailed: "Couldn't load your progress. Check your connection and try again.",
  rankNames: ["Origin Story", "Friendly Neighbour", "Rooftop Runner", "Masked Vigilante", "City Guardian", "Multiverse Legend"],
  level: (n: number) => `Level ${n}`,
  levelWord: "Level",
  currentRank: "Current rank",
  topRank: "You've reached the top rank.",
  toNext: (xp: number, name: string) => `${xp} XP to ${name}`,
  cityLights: "Your city lights up",
  streak: (n: number) => `${n}-day streak`,
  longest: (n: number) => `Longest: ${n} ${n === 1 ? "day" : "days"}`,
  currentStreak: "Current streak",
  longestLabel: "Longest",
  days: (n: number) => `${n} ${n === 1 ? "day" : "days"}`,
  heatmapAlt: (n: number) => `Check-in history for the last 12 weeks. ${n} check-ins in total.`,
  axisStart: "12 weeks ago",
  axisEnd: "Today",
  axisRange: "Last 12 weeks",
  missed: "Missed",
  checkedIn: "Checked in",
  missionDone: pair("+ mission done", "+ tip done"),
  challengeTag: "This week's challenge",
  challenge: {
    metro: (n: number) => `Take the Metro ${n} days this week.`,
    "no-delivery": (n: number) => `Go ${n} days without a delivery this week.`,
    "check-in": (n: number) => `Check in ${n} days this week.`,
  },
  challengeNote: {
    hero: (done: number, target: number, kind: "metro" | "no-delivery" | "check-in") => {
      const left = target - done;
      if (left === 0) return `${done} of ${target} done. Challenge complete!`;
      const unit = { metro: "Metro day", "no-delivery": "delivery-free day", "check-in": "check-in" }[kind];
      return `${done} of ${target} done. ${left} more ${unit}${left === 1 ? "" : "s"} to go.`;
    },
    plain: (done: number, target: number) => `${done} of ${target} done`,
  },
  badgesTag: "Badges",
  badgeCount: {
    hero: (earned: number, total: number) => `${earned} / ${total}`,
    plain: (earned: number, total: number) => `${earned} of ${total}`,
  },
  diyasLocked: "Unlocks in Diwali week",
  badges: {
    "suit-up": { name: "Suit Up", how: "First check-in", progress: undefined },
    "seven-day": { name: "Seven-Day Saga", how: "7-day streak", progress: undefined },
    "great-responsibility": { name: "Great Responsibility", how: "30-day streak", progress: (n: number, of: number) => `${n} / ${of} days` },
    "rail-rider": { name: "Rail Rider", how: "3+ Metro days in a week", progress: undefined },
    "cool-head": { name: "Cool Head", how: "AC under your average for a week", progress: undefined },
    "fewer-drops": { name: "Fewer Drops", how: "Half your usual deliveries for a week", progress: (n: number, of: number) => `${n} / ${of} week` },
    "diyas-only": { name: "Diyas Only", how: "No crackers logged in Diwali week", progress: undefined },
    assemble: { name: "Assemble!", how: "Create a Squad with 2+ members", progress: undefined },
    "paper-trail": { name: "Paper Trail", how: "Upload 3 electricity bills", progress: (n: number, of: number) => `${n} / ${of} bills` },
    "clean-escape": { name: "Clean Escape", how: "Go out during Go Time 5 times", progress: (n: number, of: number) => `${n} / ${of} times` },
  },
  xpToggle: "How you earn XP",
  xpRows: [
    ["Daily check-in", "checkin"],
    ["Mission done", "mission"],
    ["Weekly challenge", "weeklyChallenge"],
    ["Bill uploaded", "bill"],
    ["7-day streak", "streak7"],
    ["30-day streak", "streak30"],
    ["Squad Goal completed (each member)", "squadGoal"],
  ] as const,
};

export const DETAIL_TEXT = {
  purifier: { no: "no purifier", one: "purifier in one room", most: "purifiers in most rooms" },
  orders: pair("deliveries", "orders"),
  noOrders: pair("no deliveries", "no orders"),
  flights: (domestic: string, international: string) => {
    const parts: string[] = [];
    if (domestic !== "0") parts.push(`${domestic} flights`);
    if (international !== "0") parts.push(`${international} international`);
    return parts.length ? parts.join(", ") : "no flights";
  },
};

export const SETTINGS_TEXT = {
  title: "Settings",
  back: "Back",
  fallbackName: "You",
  yourLocation: "Your location",
  loadFailed: "Couldn't load your settings. Check your connection and try again.",
  lookFailed: "Your look changed on this device, but couldn't be saved to your account.",
  guestTitle: pair("You're in guest mode", "You're using EDITH as a guest"),
  guestText: pair(
    "Your data lives on this phone only. Sign in to save your data, keep your streak and set up your Squad.",
    "Your data is saved on this phone only. Sign in to keep your streak and set up your family.",
  ),
  signInSave: "Sign in to save your data",
  myDetails: "My details",
  look: "Look",
  lookNames: pair("Hero", "Plain"),
  lookNote: "Same app, same features. Only the style and tab names change.",
  location: "Location",
  locationAccess: "Location access",
  access: { granted: "Allowed", denied: "Not allowed", prompt: "Not asked yet", unknown: "Unknown" },
  changeCity: pair("Change city or area", "City or area"),
  squad: pair("Squad", "Family"),
  squadGuest: pair("Sign in to create your Squad", "Sign in to set up your family"),
  squadSetup: pair("Set up your Squad", "Set up your family"),
  account: "Account",
  signedIn: pair("Signed in with Google", "Google"),
  guestWord: "Guest",
  onThisPhone: "On this phone",
  signOut: "Sign out",
  about: "About",
  version: "Version",
  versionValue: pair("1.1 · Hack the Circle build", "1.1"),
  github: "Source code on GitHub",
  githubUrl: "https://github.com/ashima19arora/edith",
  howWeCalculate: "How we calculate",
};

export const CALCULATE = {
  title: "How we calculate",
  back: "Settings",
  intro: "Where every number in EDITH comes from. Tap a section to open it.",
  sections: [
    {
      title: "Your carbon footprint",
      points: [
        "Every activity is multiplied by an emission factor.",
        "Electricity: 0.727 kg CO₂ per unit, from India's Central Electricity Authority. Home electricity and cooking gas are split between the people living there.",
        "Own vehicle: distance ÷ mileage × fuel factor. Petrol is about 2.3 kg CO₂ per litre. If you skip mileage we assume 45 km/l for a two-wheeler and 15 km/l for a car.",
        "Metro, bus, auto and cab use a typical figure per passenger-km. These are EDITH's estimates.",
        "Food: about 0.6 kg a day on a vegetarian Indian diet and 1 kg on a non-vegetarian one, from published studies. Per-meal values are built from these.",
        "Deliveries and flights are EDITH's estimates for now.",
      ],
    },
    {
      title: "How your monthly number stays accurate",
      points: [
        "During the month, electricity is an estimate from your household and appliances. It starts at about 180 units a month for 4 people, near a typical Delhi home.",
        "Your bill arrives after the month ends, so it can correct that month's estimate and improve later ones.",
        "Reading bill photos is coming soon.",
      ],
    },
    {
      title: "Air quality (AQI)",
      points: [
        "We use India's CPCB National AQI scale, on 24-hour averages (8-hour for ozone and carbon monoxide).",
        "Pollutant data comes from Open-Meteo. It's modelled, so it can differ from a monitoring station near you.",
        "Hourly charts use the same scale on each hour's reading, so they can differ from the headline number.",
      ],
    },
    {
      title: "Cigarettes and Lives",
      points: [
        "Cigarettes: 24-hour average PM2.5 ÷ 22. Berkeley Earth found 22 µg/m³ for a day is about one cigarette.",
        "Lives: you start with 5 a day. Each usual outdoor hour costs 0 in Good or Satisfactory air, 0.25 in Moderate, 0.5 in Poor, 1 in Very Poor and 1.5 in Severe.",
        "On Very Poor or Severe days, indoors without a purifier costs 0.5 more.",
      ],
    },
    {
      title: "What these numbers are and aren't",
      points: [
        "They're estimates to help you plan, not measurements.",
        "Cigarettes and Lives are guides to exposure, not medical advice. For breathing trouble or chest pain, get medical help.",
        "Your progress is only ever compared with your own start.",
      ],
    },
  ],
  sourcesTitle: "Sources",
  sources: [
    ["CEA (Central Electricity Authority)", "CO₂ Baseline Database v20.0, India's grid factor"],
    ["CPCB", "National Air Quality Index, the AQI scale"],
    ["Open-Meteo", "Air quality data and place search"],
    ["Berkeley Earth", "The cigarette equivalent"],
    ["AQLI 2025, University of Chicago", "Life expectancy figures"],
    ["CSE", "Typical Delhi household electricity use"],
    ["DMRC", "Delhi Metro fares"],
  ] as const,
};

