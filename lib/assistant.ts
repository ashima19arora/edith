// Rule-based answers for EDITH's suggested questions, always worked out from the user's live numbers.

import type { Mission, MissionContext, Saving } from "@/config/missions";
import { isDiwaliSeason } from "@/config/diwali";
import type { AirData } from "./air";
import { worstWindow } from "./airspace";
import { categoryFor, hourlyIndex } from "./aqi";
import { biggestSource } from "./footprint";
import type { FamilyProfile } from "./family";
import { isBad, nextGoTime, pickMission, type GoTimeInfo } from "./home";
import { ASSISTANT_TEXT as TEXT } from "./labels";
import type { AqiCategory, Co2Breakdown, Mode, SetupAnswers } from "./types";

export type QuestionId = "walk" | "elder" | "pet" | "footprint" | "change" | "windows" | "tonight";
export type CardKind = "forecast" | "person" | "footprint" | "tip";

export interface Question {
  id: QuestionId;
  text: string;
  diwali?: boolean;
}

export interface Answer {
  reply: string;
  card?: CardKind;
  health?: boolean;
}

export interface AssistantData {
  mode: Mode;
  setup: SetupAnswers;
  air: AirData | null;
  breakdown: Co2Breakdown;
  missionContext: MissionContext;
  profiles: FamilyProfile[];
  date: string;
  tomorrow: string;
  now: string;
}

// The start of a window label: "2–4 PM" gives "2 PM", "11 AM–1 PM" gives "11 AM".
const clockOf = (label: string) => {
  const start = label.split("–")[0];
  return start.includes("M") ? start : `${start} ${label.slice(-2)}`;
};

function elderName(d: AssistantData): string | null {
  const elder = d.profiles.find((p) => p.kind === "elder");
  if (elder) return elder.name;
  return d.setup.extraCare.includes("elderly") ? TEXT.elders : null;
}

function petInfo(d: AssistantData): { name: string; own: boolean } | null {
  const pet = d.profiles.find((p) => p.kind === "pet");
  if (pet) return { name: pet.name, own: true };
  if (d.setup.pets.dog > 0) return { name: TEXT.myDog, own: false };
  return null;
}

// Only offers questions this user's home can actually ask.
export function suggestedQuestions(d: AssistantData): Question[] {
  const elder = elderName(d);
  const pet = petInfo(d);
  const questions: Question[] = [{ id: "walk", text: TEXT.chips.walk }];
  if (elder) questions.push({ id: "elder", text: TEXT.chips.elder(elder) });
  if (pet) questions.push({ id: "pet", text: TEXT.chips.pet(pet.name) });
  questions.push(
    { id: "footprint", text: TEXT.chips.footprint },
    { id: "change", text: TEXT.chips.change },
    { id: "windows", text: TEXT.chips.windows },
  );
  if (isDiwaliSeason(d.date)) questions.push({ id: "tonight", text: TEXT.chips.tonight, diwali: true });
  return questions;
}

function goInfo(d: AssistantData): GoTimeInfo | null {
  return d.air ? nextGoTime(d.air.hours, d.date, d.tomorrow, d.now) : null;
}

function nowCategory(d: AssistantData): AqiCategory | null {
  const hour = d.air?.hours.find((h) => h.time === d.now);
  return (hour && hourlyIndex(hour)?.category) ?? d.air?.category ?? null;
}

export function assistantMission(d: AssistantData): (Mission & { saving: Saving }) | null {
  return pickMission(d.missionContext, d.date);
}

export function answerQuestion(id: QuestionId, d: AssistantData): Answer {
  const text = TEXT.answers;
  if (id === "footprint") {
    const total = Object.values(d.breakdown).reduce((sum, v) => sum + v, 0);
    if (total <= 0) return { reply: text.noFootprint };
    const sorted = (Object.keys(d.breakdown) as (keyof Co2Breakdown)[]).sort((a, b) => d.breakdown[b] - d.breakdown[a]);
    return { reply: text.footprint(TEXT.sources[biggestSource(d.breakdown)], TEXT.sources[sorted[1]].toLowerCase()), card: "footprint" };
  }
  if (id === "change") {
    const mission = assistantMission(d);
    if (!mission) return { reply: text.noChange };
    return { reply: text.change(mission.text(d.missionContext)), card: "tip" };
  }
  if (!d.air) return { reply: text.noAir };

  const go = goInfo(d);
  const category = d.air.category;
  const goCategory = go ? categoryFor(go.index) : null;
  const nowIsGo = !!go && !go.tomorrow && !isBad(goCategory!) && d.now >= go.window.start && d.now <= go.window.end;
  const when = go?.tomorrow ? TEXT.tomorrowWord : TEXT.todayWord;

  switch (id) {
    case "walk":
      if (!go) return { reply: text.noWindow };
      return { reply: text.walk(go.label, when, goCategory!, isBad(goCategory!)), card: "forecast" };
    case "elder": {
      const who = elderName(d) ?? TEXT.elders;
      if (!isBad(category)) return { reply: text.elderOk(who, category), card: "person", health: true };
      if (go && !go.tomorrow && !isBad(goCategory!)) {
        return { reply: text.elderAfter(who, clockOf(go.label), category), card: "person", health: true };
      }
      return { reply: text.elderStay(who, category), card: "person", health: true };
    }
    case "pet": {
      const pet = petInfo(d)?.name ?? TEXT.myDog;
      const current = nowCategory(d);
      if (nowIsGo || (current && !isBad(current) && current !== "Moderate")) return { reply: text.petNow(pet), card: "forecast" };
      if (go) return { reply: text.petLater(pet, go.label, when), card: "forecast" };
      return { reply: text.petShort(pet), card: "forecast" };
    }
    case "windows":
      if (nowIsGo) return { reply: text.windowsNow(go!.label), card: "forecast" };
      if (go && !isBad(goCategory!)) return { reply: text.windowsLater(go.label, when), card: "forecast" };
      return { reply: text.windowsShut, card: "forecast" };
    case "tonight": {
      const nowIndex = d.air.hours.findIndex((h) => h.time === d.now);
      const worst = nowIndex >= 0 ? worstWindow(d.air.hours, nowIndex) : null;
      return { reply: text.tonight(worst?.label ?? null), card: "forecast" };
    }
  }
}

export interface ForecastCardBar {
  hour: number;
  aqi: number;
  category: AqiCategory;
  go: boolean;
}

// Twelve hourly bars, 9 AM to 8 PM, on the day Go Time falls.
export function forecastCard(d: AssistantData): { bars: ForecastCardBar[]; go: GoTimeInfo | null; tomorrow: boolean } {
  const go = goInfo(d);
  const tomorrow = !!go?.tomorrow;
  const date = tomorrow ? d.tomorrow : d.date;
  const bars = (d.air?.hours ?? []).flatMap((slot) => {
    const hour = Number(slot.time.slice(11, 13));
    if (!slot.time.startsWith(date) || hour < 9 || hour > 20) return [];
    const result = hourlyIndex(slot);
    if (!result) return [];
    return [{
      hour,
      aqi: result.aqi,
      category: result.category,
      go: !!go && slot.time >= go.window.start && slot.time <= go.window.end,
    }];
  });
  return { bars, go, tomorrow };
}

// What the AI sees: numbers only, with no name, email or exact location.
export function chatContext(d: AssistantData): string {
  const go = goInfo(d);
  const nowIndex = d.air ? d.air.hours.findIndex((h) => h.time === d.now) : -1;
  const worst = d.air && nowIndex >= 0 ? worstWindow(d.air.hours, nowIndex) : null;
  const round = (b: Co2Breakdown) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Math.round(v * 10) / 10]));
  return JSON.stringify({
    time: d.now,
    aqi: d.air ? { value: d.air.aqi, category: d.air.category, scale: "India CPCB", main: d.air.mainPollutant } : null,
    bestWindow: go ? { label: go.label, day: go.tomorrow ? "tomorrow" : "today", hourlyIndex: go.index } : null,
    worstWindowNext24h: worst?.label ?? null,
    routine: {
      travel: d.setup.trip.kind === "wfh" ? "works from home" : d.setup.trip.mode,
      kmOneWay: d.setup.trip.kmOneWay,
      outdoorBlocks: d.setup.outdoorBlocks,
      exercise: d.setup.exercise,
    },
    home: {
      people: d.setup.people,
      needsExtraCare: d.setup.extraCare,
      pets: d.setup.pets,
      purifier: d.setup.purifier,
      profiles: d.profiles.map((p) => ({ kind: p.kind, petType: p.petType, name: p.name })),
    },
    footprintThisMonthKg: round(d.breakdown),
  });
}
