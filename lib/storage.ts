// One storage interface: guests use localStorage, signed-in users use Supabase. UI code doesn't care which.

import { createClient } from "./supabase/client";
import type { Mode, SetupAnswers } from "./types";

export interface Profile {
  displayName: string | null;
  mode: Mode;
  onboarded: boolean;
}

export interface Store {
  getProfile(): Promise<Profile>;
  saveProfile(changes: Partial<Profile>): Promise<void>;
  getSetup(): Promise<SetupAnswers | null>;
  saveSetup(answers: SetupAnswers): Promise<void>;
}

export type Account = { kind: "user"; id: string; email: string | null } | { kind: "guest" };

const GUEST_KEY = "edith.guest";
const PROFILE_KEY = "edith.profile";
const SETUP_KEY = "edith.setup";
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

export function startGuest() {
  localStorage.setItem(GUEST_KEY, "1");
}

export function storeFor(account: Account): Store {
  return account.kind === "user" ? userStore(account.id) : guestStore;
}
