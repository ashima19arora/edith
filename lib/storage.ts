// One storage interface: guests use localStorage, signed-in users use Supabase. UI code doesn't care which.

import { createClient } from "./supabase/client";
import type { Bill, Checkin, Co2Breakdown, Mode, OneOff, SetupAnswers } from "./types";

export interface Profile {
  displayName: string | null;
  mode: Mode;
  onboarded: boolean;
}

export interface MissionEntry {
  date: string;
  missionId: string;
  accepted: boolean;
  savedKg: number;
  savedInr: number;
}

export interface Store {
  getProfile(): Promise<Profile>;
  saveProfile(changes: Partial<Profile>): Promise<void>;
  getSetup(): Promise<SetupAnswers | null>;
  saveSetup(answers: SetupAnswers): Promise<void>;
  getCheckins(): Promise<Checkin[]>;
  getOneOffs(): Promise<OneOff[]>;
  getBills(): Promise<Bill[]>;
  getMission(date: string): Promise<MissionEntry | null>;
  saveMission(entry: MissionEntry): Promise<void>;
  getXp(): Promise<number>;
}

export type Account = { kind: "user"; id: string; email: string | null } | { kind: "guest" };

const GUEST_KEY = "edith.guest";
const PROFILE_KEY = "edith.profile";
const SETUP_KEY = "edith.setup";
const CHECKINS_KEY = "edith.checkins";
const ONE_OFFS_KEY = "edith.oneOffs";
const BILLS_KEY = "edith.bills";
const MISSIONS_KEY = "edith.missions";
const XP_KEY = "edith.xp";
const NEW_PROFILE: Profile = { displayName: null, mode: "hero", onboarded: false };

function readJson<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null; // Corrupt data shouldn't lock anyone out
  }
}

const guestStore: Store = {
  async getProfile() {
    return { ...NEW_PROFILE, ...readJson<Profile>(PROFILE_KEY) };
  },
  async saveProfile(changes) {
    const profile = { ...NEW_PROFILE, ...readJson<Profile>(PROFILE_KEY), ...changes };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  },
  async getSetup() {
    return readJson<SetupAnswers>(SETUP_KEY);
  },
  async saveSetup(answers) {
    localStorage.setItem(SETUP_KEY, JSON.stringify(answers));
  },
  async getCheckins() {
    return readJson<Checkin[]>(CHECKINS_KEY) ?? [];
  },
  async getOneOffs() {
    return readJson<OneOff[]>(ONE_OFFS_KEY) ?? [];
  },
  async getBills() {
    return readJson<Bill[]>(BILLS_KEY) ?? [];
  },
  async getMission(date) {
    return (readJson<MissionEntry[]>(MISSIONS_KEY) ?? []).find((m) => m.date === date && m.accepted) ?? null;
  },
  async saveMission(entry) {
    const others = (readJson<MissionEntry[]>(MISSIONS_KEY) ?? []).filter(
      (m) => !(m.date === entry.date && m.missionId === entry.missionId),
    );
    localStorage.setItem(MISSIONS_KEY, JSON.stringify([...others, entry]));
  },
  async getXp() {
    return (readJson<{ xp: number }[]>(XP_KEY) ?? []).reduce((sum, event) => sum + event.xp, 0);
  },
};

function userStore(id: string): Store {
  const supabase = createClient()!;
  return {
    async getProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, mode, onboarded")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return NEW_PROFILE;
      return { displayName: data.display_name, mode: data.mode, onboarded: data.onboarded };
    },
    async saveProfile(changes) {
      const row: Record<string, unknown> = { id };
      if (changes.displayName !== undefined) row.display_name = changes.displayName;
      if (changes.mode !== undefined) row.mode = changes.mode;
      if (changes.onboarded !== undefined) row.onboarded = changes.onboarded;
      const { error } = await supabase.from("profiles").upsert(row);
      if (error) throw error;
    },
    async getSetup() {
      const { data, error } = await supabase
        .from("user_setup")
        .select("answers")
        .eq("user_id", id)
        .maybeSingle();
      if (error) throw error;
      return (data?.answers as SetupAnswers | undefined) ?? null;
    },
    async saveSetup(answers) {
      const { error } = await supabase.from("user_setup").upsert({
        user_id: id,
        answers,
        lat: answers.location.lat,
        lng: answers.location.lng,
        area: answers.location.area,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    async getCheckins() {
      const { data, error } = await supabase.from("checkins").select("*").eq("user_id", id).order("date");
      if (error) throw error;
      return (data ?? []).map(
        (row): Checkin => ({
          date: row.date,
          meals: row.meals,
          trips: row.trips,
          energy: row.energy,
          deliveries: row.deliveries,
          outdoorBlocks: row.outdoor_blocks,
          missionStatus: row.mission_status,
          co2Breakdown: row.co2_breakdown as Co2Breakdown,
          livesKept: Number(row.lives_kept),
        }),
      );
    },
    async getOneOffs() {
      const { data, error } = await supabase.from("one_offs").select("date, kind, details, co2_kg").eq("user_id", id);
      if (error) throw error;
      return (data ?? []).map((row): OneOff => ({ date: row.date, kind: row.kind, details: row.details, co2Kg: Number(row.co2_kg) }));
    },
    async getBills() {
      const { data, error } = await supabase.from("bills").select("period_start, period_end, units, source").eq("user_id", id);
      if (error) throw error;
      return (data ?? []).map(
        (row): Bill => ({ periodStart: row.period_start, periodEnd: row.period_end, units: Number(row.units), source: row.source }),
      );
    },
    async getMission(date) {
      const { data, error } = await supabase
        .from("missions_log")
        .select("mission_id, accepted, saved_kg, saved_inr")
        .eq("user_id", id)
        .eq("date", date)
        .eq("accepted", true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { date, missionId: data.mission_id, accepted: data.accepted, savedKg: Number(data.saved_kg), savedInr: Number(data.saved_inr) };
    },
    async saveMission(entry) {
      const { error } = await supabase.from("missions_log").upsert(
        {
          user_id: id,
          date: entry.date,
          mission_id: entry.missionId,
          accepted: entry.accepted,
          saved_kg: entry.savedKg,
          saved_inr: entry.savedInr,
        },
        { onConflict: "user_id,date,mission_id" },
      );
      if (error) throw error;
    },
    async getXp() {
      const { data, error } = await supabase.from("xp_events").select("xp").eq("user_id", id);
      if (error) throw error;
      return (data ?? []).reduce((sum, event) => sum + event.xp, 0);
    },
  };
}

export async function getAccount(): Promise<Account | null> {
  const supabase = createClient();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) return { kind: "user", id: data.user.id, email: data.user.email ?? null };
  }
  return localStorage.getItem(GUEST_KEY) ? { kind: "guest" } : null;
}

// When a guest signs in for the first time, their answers move to the new account.
export async function adoptGuestData(account: Account): Promise<void> {
  if (account.kind !== "user" || !localStorage.getItem(GUEST_KEY)) return;
  const store = userStore(account.id);
  const profile = await store.getProfile();
  if (!profile.onboarded) {
    const setup = readJson<SetupAnswers>(SETUP_KEY);
    const guest = readJson<Profile>(PROFILE_KEY);
    if (setup && guest?.onboarded) {
      await store.saveSetup(setup);
      await store.saveProfile({ mode: guest.mode, onboarded: true });
      for (const mission of readJson<MissionEntry[]>(MISSIONS_KEY) ?? []) await store.saveMission(mission);
    }
  }
  localStorage.removeItem(GUEST_KEY);
}

export async function signOut(): Promise<void> {
  await createClient()?.auth.signOut();
  localStorage.removeItem(GUEST_KEY);
}

export function startGuest() {
  localStorage.setItem(GUEST_KEY, "1");
}

export function storeFor(account: Account): Store {
  return account.kind === "user" ? userStore(account.id) : guestStore;
}
