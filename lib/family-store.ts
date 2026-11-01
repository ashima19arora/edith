// Household data for signed-in users. Guests have no household, because their data stays on one device.

import { addDays, type FamilyProfile, type Household, type Member, type MemberDay } from "./family";
import { weekStart } from "./ranks";
import { createClient } from "./supabase/client";

export const PENDING_JOIN_KEY = "edith.pendingJoin";

function client() {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

export type NewProfile = Omit<FamilyProfile, "id">;

function profileRow(p: NewProfile) {
  return {
    kind: p.kind,
    name: p.name,
    care_needs: p.careNeeds,
    pet_type: p.petType,
    outdoor_blocks: p.outdoorBlocks,
  };
}

export async function loadHousehold(userId: string, today: string): Promise<Household | null> {
  const supabase = client();
  const { data: membership, error: membershipError } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership) return null;
  const id = membership.household_id as string;

  // Back to the start of last month, for the same-date comparison.
  const since = `${addDays(`${today.slice(0, 7)}-01`, -1).slice(0, 7)}-01`;
  const [household, summary, profiles, joins] = await Promise.all([
    supabase.from("households").select("name, invite_code").eq("id", id).maybeSingle(),
    supabase.rpc("household_summary", { target: id, since }),
    supabase.from("household_profiles").select("*").eq("household_id", id),
    supabase.from("household_goal_joins").select("user_id").eq("household_id", id).eq("week_start", weekStart(today)),
  ]);
  for (const result of [household, summary, profiles, joins]) if (result.error) throw result.error;

  const members = new Map<string, Member>();
  const days: MemberDay[] = [];
  for (const row of (summary.data ?? []) as Record<string, never>[]) {
    members.set(row.user_id, { userId: row.user_id, displayName: row.display_name, role: row.role });
    if (row.date) {
      days.push({
        userId: row.user_id,
        date: row.date,
        livesKept: Number(row.lives_kept),
        sharedKg: Number(row.shared_kg),
        electricityKg: Number(row.electricity_kg ?? row.shared_kg),
        personalKg: Number(row.personal_kg),
      });
    }
  }

  return {
    id,
    name: household.data?.name ?? "",
    inviteCode: household.data?.invite_code ?? "",
    members: [...members.values()],
    days,
    profiles: (profiles.data ?? []).map((p) => ({
      id: p.id,
      kind: p.kind,
      name: p.name,
      careNeeds: p.care_needs,
      petType: p.pet_type,
      outdoorBlocks: p.outdoor_blocks,
    })),
    goalJoins: (joins.data ?? []).map((j) => j.user_id),
  };
}

export async function createHousehold(name: string): Promise<void> {
  const { error } = await client().rpc("create_household", { household_name: name });
  if (error) throw error;
}

export async function joinHousehold(code: string): Promise<void> {
  const { error } = await client().rpc("join_household", { code });
  if (error) throw error;
}

export async function renameHousehold(id: string, name: string): Promise<void> {
  const { error } = await client().from("households").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function leaveHousehold(id: string, userId: string): Promise<void> {
  const { error } = await client().from("household_members").delete().eq("household_id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function addProfile(householdId: string, profile: NewProfile): Promise<void> {
  const { error } = await client().from("household_profiles").insert({ household_id: householdId, ...profileRow(profile) });
  if (error) throw error;
}

export async function updateProfile(id: string, profile: NewProfile): Promise<void> {
  const { error } = await client().from("household_profiles").update(profileRow(profile)).eq("id", id);
  if (error) throw error;
}

export async function deleteProfile(id: string): Promise<void> {
  const { error } = await client().from("household_profiles").delete().eq("id", id);
  if (error) throw error;
}

export async function setGoalJoin(householdId: string, userId: string, today: string, joined: boolean): Promise<void> {
  const week = weekStart(today);
  const supabase = client();
  const { error } = joined
    ? await supabase.from("household_goal_joins").insert({ household_id: householdId, user_id: userId, week_start: week })
    : await supabase.from("household_goal_joins").delete().eq("household_id", householdId).eq("user_id", userId).eq("week_start", week);
  if (error) throw error;
}
