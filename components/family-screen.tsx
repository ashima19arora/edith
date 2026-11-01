"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadAir, type AirResult } from "@/lib/air";
import { timelineRows } from "@/lib/airspace";
import { exerciseBlocks } from "@/lib/lives";
import {
  familyFootprint,
  familyStreak,
  profileAlert,
  profileLives,
  squadGoal,
  whatsappLink,
  type FamilyProfile,
  type Household,
  type PetType,
  type ProfileKind,
} from "@/lib/family";
import {
  addProfile,
  createHousehold,
  deleteProfile,
  joinHousehold,
  leaveHousehold,
  loadHousehold,
  PENDING_JOIN_KEY,
  renameHousehold,
  setGoalJoin,
  updateProfile,
  type NewProfile,
} from "@/lib/family-store";
import { XP } from "@/lib/factors";
import { nextGoTime, livesInfo } from "@/lib/home";
import { AIR_TEXT, FAMILY_TEXT as TEXT, LABELS } from "@/lib/labels";
import { weekStart } from "@/lib/ranks";
import { getAccount, signInWithGoogle, storeFor, type Account } from "@/lib/storage";
import { nowIST } from "@/lib/time";
import { ThemeRoot, useMode } from "@/lib/theme";
import type { Checkin, Mode, SetupAnswers, TimeBlock } from "@/lib/types";
import { BackIcon } from "./art";
import { Heart } from "./heart";

type View = "loading" | "guest" | "create" | "join" | "created" | "main" | "profile";

const nameOf = (m: { displayName: string | null }) => (m.displayName ?? TEXT.member).split(" ")[0];

function Avatar({ name, index, pet, size }: { name: string; index: number; pet?: boolean; size: "s" | "m" | "l" }) {
  return (
    <span className={`avatar avatar-${size} tint-a${index % 5}`} aria-hidden="true">
      {pet ? "🐾" : name.charAt(0).toUpperCase()}
    </span>
  );
}

function Hearts({ safe, mode }: { safe: number; mode: Mode }) {
  return (
    <span className="mini-hearts" role="img" aria-label={TEXT.heartsAlt(safe)}>
      {Array.from({ length: 5 }, (_, i) => <Heart key={i} mode={mode} safe={i < safe} />)}
    </span>
  );
}

function Toggle<T extends string>({ label, options, value, onToggle, role = "checkbox" }: {
  label: string;
  options: [T, string][];
  value: T[];
  onToggle: (v: T) => void;
  role?: "checkbox" | "radio";
}) {
  return (
    <div className="ci-chips fam-chips" role={role === "radio" ? "radiogroup" : "group"} aria-label={label}>
      {options.map(([key, text]) => (
        <button key={key} type="button" role={role} aria-checked={value.includes(key)} className="ci-chip" onClick={() => onToggle(key)}>
          {text}
        </button>
      ))}
    </div>
  );
}

interface Sheet {
  name: string;
  index: number;
  pet?: boolean;
  tag?: string;
  safe: number | null;
  rows: { block: TimeBlock; planned: boolean; cost: number }[];
  note: string;
}

function MemberSheet({ sheet, mode, onClose }: { sheet: Sheet; mode: Mode; onClose: () => void }) {
  return (
    <div className="sheet-overlay fam-overlay" onClick={onClose}>
      <section className="diwali-sheet member-sheet" role="dialog" aria-modal="true" aria-label={TEXT.sheetTitle[mode](sheet.name)} onClick={(e) => e.stopPropagation()}>
        <span className="sheet-handle" aria-hidden="true" />
        <header className="sheet-head">
          <Avatar name={sheet.name} index={sheet.index} pet={sheet.pet} size="l" />
          <h2>{TEXT.sheetTitle[mode](sheet.name)}</h2>
          <button type="button" className="sheet-close" aria-label={TEXT.close} onClick={onClose}>✕</button>
        </header>
        <div className="sheet-body">
          {sheet.safe !== null && (
            <div className="sheet-hearts">
              <Hearts safe={sheet.safe} mode={mode} />
              <b>{TEXT.sheetCount[mode](sheet.safe)}</b>
            </div>
          )}
          {sheet.rows.length > 0 && (
            <>
              {mode === "hero" && <p className="sheet-label trail-label">{TEXT.trail}</p>}
              <ul className="trail">
                {sheet.rows.map((row) => (
                  <li key={row.block}>
                    <span>
                      <strong>{AIR_TEXT.blockName(row.block)}</strong>
                      <small>{AIR_TEXT.blockTime(row.block)}{row.planned ? AIR_TEXT.planned : ""}</small>
                    </span>
                    <b>{AIR_TEXT.cost[mode](row.cost)}</b>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="sheet-note">{sheet.note}</p>
        </div>
      </section>
    </div>
  );
}

function ProfileForm({ profile, mode, onSave, onDelete, onBack }: {
  profile: FamilyProfile | null;
  mode: Mode;
  onSave: (p: NewProfile) => Promise<void>;
  onDelete?: () => Promise<void>;
  onBack: () => void;
}) {
  const [kind, setKind] = useState<ProfileKind>(profile?.kind ?? "elder");
  const [name, setName] = useState(profile?.name ?? "");
  const [care, setCare] = useState<string[]>(profile?.careNeeds ?? ["elderly"]);
  const [pet, setPet] = useState<PetType>(profile?.petType ?? "dog");
  const [outside, setOutside] = useState<string[]>(
    profile ? (profile.outdoorBlocks.length ? profile.outdoorBlocks : ["indoors"]) : ["early"],
  );
  const [error, setError] = useState("");

  function toggle(list: string[], value: string, exclusive: string): string[] {
    if (value === exclusive) return [value];
    const rest = list.filter((v) => v !== exclusive);
    return rest.includes(value) ? rest.filter((v) => v !== value) : [...rest, value];
  }

  async function submit() {
    if (!name.trim()) return setError(TEXT.nameNeeded);
    try {
      await onSave({
        kind,
        name: name.trim().slice(0, 40),
        careNeeds: kind === "pet" ? [] : care.filter((c) => c !== "none"),
        petType: kind === "pet" ? pet : null,
        outdoorBlocks: outside.filter((b): b is TimeBlock => b !== "indoors"),
      });
    } catch {
      setError(TEXT.saveFailed);
    }
  }

  return (
    <div className="fam-form">
      <h2 className="fam-title">{profile ? TEXT.editProfileTitle : TEXT.addTitle[mode]}</h2>
      <p className="fam-body">{TEXT.addSub[mode]}</p>
      <div className="fam-types">
        <Toggle role="radio" label={TEXT.typeLabel} options={Object.entries(TEXT.kinds) as [ProfileKind, string][]} value={[kind]} onToggle={setKind} />
      </div>
      <p className="ci-section-label">{TEXT.nameLabel}</p>
      <input className="text-input" value={name} aria-label={TEXT.nameLabel} placeholder={TEXT.namePlaceholder} onChange={(e) => setName(e.target.value)} />
      {kind === "pet" ? (
        <>
          <p className="ci-section-label">{TEXT.whichPet}</p>
          <Toggle role="radio" label={TEXT.whichPet} options={Object.entries(TEXT.pets) as [PetType, string][]} value={[pet]} onToggle={setPet} />
        </>
      ) : (
        <>
          <p className="ci-section-label">{TEXT.careLabel}</p>
          <Toggle label={TEXT.careLabel} options={Object.entries(TEXT.care) as [string, string][]} value={care} onToggle={(v) => setCare(toggle(care, v, "none"))} />
        </>
      )}
      <p className="ci-section-label">{TEXT.outsideLabel}</p>
      <Toggle label={TEXT.outsideLabel} options={Object.entries(TEXT.outside) as [string, string][]} value={outside} onToggle={(v) => setOutside(toggle(outside, v, "indoors"))} />
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="button" className="cta fam-submit" onClick={submit}>{profile ? TEXT.saveProfile : TEXT.addSubmit[mode]}</button>
      {onDelete && <button type="button" className="fam-danger" onClick={() => onDelete().catch(() => setError(TEXT.saveFailed))}>{TEXT.removeProfile}</button>}
      <button type="button" className="fam-link" onClick={onBack}>{TEXT.cancel}</button>
    </div>
  );
}

export function FamilyScreen() {
  return (
    <ThemeRoot>
      <FamilyInner />
    </ThemeRoot>
  );
}

function FamilyInner() {
  const router = useRouter();
  const mode = useMode();
  const today = useMemo(() => nowIST(), []);
  const [view, setView] = useState<View>("loading");
  const [account, setAccount] = useState<Account | null>(null);
  const [setup, setSetup] = useState<SetupAnswers | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [house, setHouse] = useState<Household | null>(null);
  const [air, setAir] = useState<AirResult | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [editing, setEditing] = useState<FamilyProfile | null>(null);
  const [profileReturn, setProfileReturn] = useState<View>("main");
  const [nameDraft, setNameDraft] = useState("");
  const [codeDraft, setCodeDraft] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [manageProfiles, setManageProfiles] = useState(false);
  const [error, setError] = useState("");

  const userId = account?.kind === "user" ? account.id : "";

  const reload = useCallback(async (id: string) => {
    const found = await loadHousehold(id, today.date);
    setHouse(found);
    return found;
  }, [today.date]);

  useEffect(() => {
    async function load() {
      const found = await getAccount();
      setAccount(found);
      if (found?.kind !== "user") return setView("guest");
      const store = storeFor(found);
      const [saved, foundCheckins] = await Promise.all([store.getSetup(), store.getCheckins()]);
      if (!saved) return router.replace("/app/style");
      setSetup(saved);
      setCheckins(foundCheckins);

      const pending = localStorage.getItem(PENDING_JOIN_KEY);
      if (pending) {
        localStorage.removeItem(PENDING_JOIN_KEY);
        await joinHousehold(pending).catch(() => setError(TEXT.joinFailed));
      }
      const household = await reload(found.id);
      setNameDraft(household?.name ?? "");
      setView(household ? "main" : "create");
      setAir(await loadAir(saved));

      // Everyone who joined earns the reward once when the week's goal is met.
      if (household?.goalJoins.includes(found.id)) {
        const goal = squadGoal(saved, foundCheckins, today.date);
        const kind = `squad-goal-${weekStart(today.date)}`;
        if (goal.done >= goal.target && !(await store.getXpKinds()).includes(kind)) {
          await store.addXp([{ date: today.date, kind, xp: XP.squadGoal }]);
        }
      }
    }
    load().catch(() => {
      setError(TEXT.loadFailed);
      setView("create");
    });
  }, [router, reload, today.date]);

  const data = air?.air ?? null;
  const go = data ? nextGoTime(data.hours, today.date, today.tomorrow, today.time) : null;
  const dayHours = data?.hours.filter((h) => h.time.startsWith(today.date)) ?? [];
  const inviteLink = house && typeof window !== "undefined" ? `${window.location.origin}/join/${house.inviteCode}` : "";
  const inviteUrl = whatsappLink(TEXT.invite(inviteLink));

  async function run(action: () => Promise<unknown>, next?: View) {
    setError("");
    try {
      await action();
      const found = await reload(userId);
      if (next === "created") setNameDraft(found?.name ?? "");
      if (next) setView(next);
    } catch {
      setError(TEXT.saveFailed);
    }
  }

  const header = (
    <header className="settings-head">
      {mode === "hero" ? (
        <Link href="/app" className="back-btn" aria-label={TEXT.back}><BackIcon /></Link>
      ) : (
        <Link href="/app" className="back-btn"><BackIcon /><span className="back-word">{TEXT.backHome}</span></Link>
      )}
      <h1>{LABELS.family[mode]}</h1>
    </header>
  );

  if (view === "loading") return <main className="screen family halftone">{header}</main>;

  if (view === "guest") {
    return (
      <main className="screen family halftone">
        {header}
        <section className="card fam-guest">
          <h2 className="fam-title">{TEXT.guestTitle[mode]}</h2>
          <p className="fam-body">{TEXT.guestBody[mode]}</p>
          <button type="button" className="google-btn" onClick={() => signInWithGoogle().catch(() => setError(TEXT.signInFailed))}>
            <span className="google-g" aria-hidden="true">G</span>
            {TEXT.google}
          </button>
          {error && <p className="form-error" role="alert">{error}</p>}
          <p className="fam-note">{TEXT.guestNote}</p>
        </section>
      </main>
    );
  }

  if (view === "create" || view === "join") {
    return (
      <main className="screen family halftone">
        {header}
        <section className="fam-create">
          <div className="fam-art" aria-hidden="true">
            <span className="avatar tint-a0">A</span>
            <span className="avatar tint-a1">M</span>
            <span className="avatar tint-a4">🐾</span>
          </div>
          <h2 className="fam-title big">{TEXT.createTitle[mode]}</h2>
          <p className="fam-body">{TEXT.createBody[mode]}</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          {view === "create" ? (
            <>
              <button
                type="button"
                className="fam-big-btn primary"
                onClick={() => run(() => createHousehold(TEXT.defaultName), "created")}
              >
                {TEXT.createButton[mode]}
                {mode === "hero" && <small>{TEXT.createSub}</small>}
              </button>
              <button type="button" className="fam-big-btn" onClick={() => setView("join")}>
                {TEXT.joinButton[mode]}
                {mode === "hero" && <small>{TEXT.joinSub}</small>}
              </button>
            </>
          ) : (
            <form
              className="fam-join"
              onSubmit={(e) => {
                e.preventDefault();
                const code = codeDraft.trim().split("/").pop() ?? "";
                if (!code) return setError(TEXT.joinNeeded);
                run(() => joinHousehold(code), "main").then(() => setError((current) => (current ? TEXT.joinFailed : current)));
              }}
            >
              <input className="text-input" value={codeDraft} aria-label={TEXT.joinLabel} placeholder={TEXT.joinLabel} onChange={(e) => setCodeDraft(e.target.value)} />
              <button type="submit" className="cta">{TEXT.joinSubmit}</button>
              <button type="button" className="fam-link" onClick={() => setView("create")}>{TEXT.cancel}</button>
            </form>
          )}
        </section>
      </main>
    );
  }

  if (view === "profile" && house) {
    return (
      <main className="screen family halftone">
        {header}
        <ProfileForm
          key={editing?.id ?? "new"}
          profile={editing}
          mode={mode}
          onBack={() => setView(profileReturn)}
          onSave={async (p) => {
            await (editing ? updateProfile(editing.id, p) : addProfile(house.id, p));
            await reload(userId);
            setView(profileReturn);
          }}
          onDelete={editing ? async () => {
            await deleteProfile(editing.id);
            await reload(userId);
            setView("main");
          } : undefined}
        />
      </main>
    );
  }

  if (view === "created" && house) {
    return (
      <main className="screen family halftone">
        {header}
        <section className="fam-created">
          {mode === "hero" && <p className="ctag">{TEXT.createdTag}</p>}
          <h2 className="fam-title big">{TEXT.createdTitle[mode]}</h2>
          {mode === "plain" && <p className="fam-body">{TEXT.createdSub}</p>}
          <p className="ci-section-label">{TEXT.householdName}</p>
          <input className="text-input fam-name-input" value={nameDraft} aria-label={TEXT.householdName} onChange={(e) => setNameDraft(e.target.value)} />
          <div className="card fam-invite">
            <p className="fam-card-title">{TEXT.appUsers[mode]}</p>
            <p className="fam-body small">{TEXT.appUsersLine}</p>
            <p className="invite-link">{inviteLink}</p>
            <a className="whatsapp" href={inviteUrl} target="_blank" rel="noopener noreferrer">{TEXT.inviteButton[mode]}</a>
          </div>
          <div className="card fam-nonusers">
            <p className="fam-card-title">{TEXT.nonUsers[mode]}</p>
            <p className="fam-body small">{TEXT.nonUsersLine[mode]}</p>
            {house.profiles.map((p) => <p key={p.id} className="fam-added">✓ {p.name}</p>)}
            <button type="button" className="ci-add" onClick={() => { setEditing(null); setProfileReturn("created"); setView("profile"); }}>{TEXT.addProfile}</button>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="button" className="cta fam-submit" onClick={() => run(() => renameHousehold(house.id, nameDraft.trim() || TEXT.defaultName), "main")}>
            {TEXT.finish[mode]}
          </button>
        </section>
      </main>
    );
  }

  if (!house || !setup) {
    return (
      <main className="screen family halftone">
        {header}
        <p className="form-error ranks-error" role="alert">{error || TEXT.loadFailed}</p>
      </main>
    );
  }

  const me = house.members.find((m) => m.userId === userId);
  const memberIndex = (id: string) => Math.max(0, house.members.findIndex((m) => m.userId === id));
  const profileIndex = (i: number) => house.members.length + i;
  const memberLabel = (m: { userId: string; displayName: string | null }) => (m.userId === userId ? TEXT.you : nameOf(m));

  const alerts = house.profiles.flatMap((p, i) => {
    const text = profileAlert(p, mode, data?.category ?? null, go);
    return text ? [{ profile: p, index: profileIndex(i), text }] : [];
  });
  const myLives = data ? livesInfo(dayHours, setup, data.aqi, go) : null;
  const myCheckin = checkins.find((c) => c.date === today.date);
  const footprint = familyFootprint(house.members, house.days, setup.people, today.date);
  const personalTotal = footprint.personal.reduce((sum, p) => sum + p.kg, 0);
  const sharePct = footprint.totalKg > 0 ? (footprint.sharedKg / footprint.totalKg) * 100 : 50;
  const barMax = Math.max(1, ...footprint.personal.map((p) => p.kg));
  const change = footprint.previousKg === null ? null : footprint.totalKg - footprint.previousKg;
  const goal = squadGoal(setup, checkins, today.date);
  const joined = house.goalJoins.includes(userId);
  const streak = familyStreak(house.members, house.days, today.date);
  const waitingFor = house.members.filter((m) => m.userId !== userId && !streak.doneToday.includes(m.userId));

  function openMember(id: string) {
    const member = house!.members.find((m) => m.userId === id)!;
    const index = memberIndex(id);
    const dayRow = house!.days.find((d) => d.userId === id && d.date === today.date);
    if (id === userId) {
      const blocks = myCheckin?.outdoorBlocks ?? [...setup!.outdoorBlocks, ...exerciseBlocks(setup!.exercise)];
      setSheet({
        name: TEXT.you,
        index,
        safe: myCheckin ? Math.floor(myCheckin.livesKept) : myLives?.safe ?? null,
        rows: data ? timelineRows(blocks, dayHours, today.time) : [],
        note: myCheckin ? TEXT.fromYourCheckin : TEXT.predicted,
      });
      return;
    }
    // Details stay private: other members' sheets show totals only.
    setSheet({
      name: nameOf(member),
      index,
      safe: dayRow ? Math.floor(dayRow.livesKept) : null,
      rows: [],
      note: dayRow ? TEXT.fromTheirCheckin(nameOf(member)) : TEXT.notCheckedIn(nameOf(member)),
    });
  }

  function openProfile(p: FamilyProfile, i: number) {
    const lives = data ? profileLives(p, dayHours, setup!.purifier, data.aqi, today.time) : null;
    setSheet({
      name: p.name,
      index: profileIndex(i),
      pet: p.kind === "pet",
      tag: p.kind,
      safe: lives?.safe ?? null,
      rows: lives?.rows ?? [],
      note: TEXT.estimated(p.name, p.kind === "pet"),
    });
  }

  async function toggleGoal() {
    await run(() => setGoalJoin(house!.id, userId, today.date, !joined));
  }

  return (
    <main className="screen family halftone">
      {header}
      {error && <p className="form-error ranks-error" role="alert">{error}</p>}

      <section className="card fam-house">
        {editingName ? (
          <form
            className="fam-rename"
            onSubmit={(e) => {
              e.preventDefault();
              const name = nameDraft.trim() || house.name;
              setNameDraft(name);
              run(() => renameHousehold(house.id, name));
              setEditingName(false);
            }}
          >
            <input className="text-input" value={nameDraft} aria-label={TEXT.householdName} onChange={(e) => setNameDraft(e.target.value)} />
            <button type="submit" className="small-btn">{TEXT.saveName}</button>
          </form>
        ) : (
          <p className="fam-house-name">
            <strong>{house.name}</strong>
            <button type="button" className="fam-edit" onClick={() => { setNameDraft(house.name); setEditingName(true); }}>{TEXT.editName}</button>
          </p>
        )}
        <div className="fam-avatars">
          {house.members.map((m) => (
            <span key={m.userId} className="fam-person">
              <Avatar name={memberLabel(m)} index={memberIndex(m.userId)} size="m" />
              <small>{memberLabel(m)}</small>
            </span>
          ))}
          {house.profiles.map((p, i) => (
            <span key={p.id} className="fam-person">
              <Avatar name={p.name} index={profileIndex(i)} pet={p.kind === "pet"} size="m" />
              <small>{p.name}</small>
            </span>
          ))}
          <button type="button" className="fam-add" aria-label={TEXT.addProfile} onClick={() => { setEditing(null); setProfileReturn("main"); setView("profile"); }}>+</button>
        </div>
        <a className="fam-invite-link" href={inviteUrl} target="_blank" rel="noopener noreferrer">{TEXT.inviteButton[mode]}</a>
      </section>

      {alerts.length > 0 && (
        <section className="card fam-alerts">
          <p className="fam-alert-head">
            <span className="ctag">{LABELS.familyAlerts[mode]}{mode === "hero" && data ? TEXT.aqiToday(data.aqi) : ""}</span>
            {mode === "plain" && data && <small>{TEXT.aqiTodayPlain(data.aqi)}</small>}
          </p>
          {alerts.map(({ profile, index, text }) => (
            <div key={profile.id} className="fam-alert">
              <Avatar name={profile.name} index={index} pet={profile.kind === "pet"} size="s" />
              <p>
                <small>{profile.kind === "pet" && profile.petType ? `${profile.name} · ${TEXT.pets[profile.petType]}` : profile.name}</small>
                {text}
              </p>
            </div>
          ))}
        </section>
      )}

      <section className="card fam-lives">
        <p className="ctag">{TEXT.livesTitle[mode]}</p>
        <ul>
          {house.members.map((m) => {
            const row = house.days.find((d) => d.userId === m.userId && d.date === today.date);
            const safe = m.userId === userId
              ? (myCheckin ? Math.floor(myCheckin.livesKept) : myLives?.safe ?? null)
              : row ? Math.floor(row.livesKept) : null;
            return (
              <li key={m.userId}>
                <button type="button" onClick={() => openMember(m.userId)}>
                  <Avatar name={memberLabel(m)} index={memberIndex(m.userId)} size="s" />
                  <span className="fam-life-name">{memberLabel(m)}</span>
                  {safe === null ? <small className="fam-none">{TEXT.noCheckin}</small> : <Hearts safe={safe} mode={mode} />}
                  <span className="fam-chevron" aria-hidden="true">›</span>
                </button>
              </li>
            );
          })}
          {house.profiles.map((p, i) => {
            const lives = data ? profileLives(p, dayHours, setup.purifier, data.aqi, today.time) : null;
            return (
              <li key={p.id}>
                <button type="button" onClick={() => openProfile(p, i)}>
                  <Avatar name={p.name} index={profileIndex(i)} pet={p.kind === "pet"} size="s" />
                  <span className="fam-life-name">{p.name} <em>{p.kind === "pet" && p.petType ? TEXT.pets[p.petType] : TEXT.kinds[p.kind]}</em></span>
                  {lives ? <Hearts safe={lives.safe} mode={mode} /> : <small className="fam-none">–</small>}
                  <span className="fam-chevron" aria-hidden="true">›</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card fam-footprint">
        <p className="ctag">{LABELS.familyFootprint[mode]}{mode === "hero" ? TEXT.co2Tag : ""}</p>
        <div className="fp-number">
          <strong>{Math.round(footprint.totalKg)}</strong>
          <span>{TEXT.thisMonth}</span>
        </div>
        {change !== null && (
          mode === "hero" ? (
            <p className="fp-note"><mark>{TEXT.diff(Math.abs(Math.round(change)), change <= 0)}</mark> {TEXT.thanLastMonth(Math.round(footprint.previousKg!))}</p>
          ) : (
            <p className={change <= 0 ? "fp-change less" : "fp-change more"}>{TEXT.changePlain(Math.abs(Math.round(change)), change <= 0)}</p>
          )
        )}
        {footprint.totalKg > 0 ? (
          <>
            <div className="fam-split" aria-hidden="true">
              <i className="shared" style={{ width: `${sharePct}%` }}>{mode === "hero" && sharePct > 30 ? `${TEXT.shared} ${Math.round(footprint.sharedKg)}` : ""}</i>
              <i className="personal" style={{ width: `${100 - sharePct}%` }}>{mode === "hero" && sharePct < 70 ? `${TEXT.personal} ${Math.round(personalTotal)}` : ""}</i>
            </div>
            {mode === "plain" && <p className="fam-split-labels"><span>{TEXT.sharedPlain(Math.round(footprint.sharedKg))}</span><span>{TEXT.personalPlain(Math.round(personalTotal))}</span></p>}
            {mode === "hero" && <p className="fam-small">{TEXT.sharedNote}</p>}
            <p className="fam-bars-label">{TEXT.personalBars[mode]}</p>
            <ul className="fam-bars">
              {footprint.personal.map((p) => {
                const member = house.members.find((m) => m.userId === p.userId)!;
                return (
                  <li key={p.userId}>
                    <span>{memberLabel(member)}</span>
                    <div aria-hidden="true"><i style={{ width: `${(p.kg / barMax) * 100}%` }} /></div>
                    <b>{Math.round(p.kg)} kg</b>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="fam-small">{TEXT.noFootprint}</p>
        )}
        <p className="fam-small">{TEXT.privacy}</p>
      </section>

      <section className="card fam-goal">
        <p className="fam-goal-head">
          <span className="ctag">{LABELS.weeklyGoal[mode]}{mode === "hero" ? TEXT.thisWeekTag : ""}</span>
          {mode === "plain" && <small>{TEXT.thisWeek}</small>}
        </p>
        <p className="fam-goal-text">{TEXT.goals[goal.kind].title(goal.target)}</p>
        <p className="fam-goal-why">{TEXT.goals[goal.kind].why[mode]}</p>
        <div className="fam-goal-bar" aria-hidden="true"><i style={{ width: `${(goal.done / goal.target) * 100}%` }} /></div>
        <p className="fam-goal-under">
          <span>{TEXT.goals[goal.kind].progress(goal.done, goal.target)}</span>
          <span>{TEXT.joinedCount(house.goalJoins.length, house.members.length)}</span>
        </p>
        {goal.kg > 0 && (
          <div className="fam-saves">
            <p>{TEXT.saves(goal.kg.toFixed(1))}</p>
            {goal.inr >= 1 && <p>{TEXT.savesInr(Math.round(goal.inr))}</p>}
          </div>
        )}
        <button type="button" className={joined ? "fam-goal-btn on" : "fam-goal-btn"} onClick={toggleGoal}>
          {joined ? TEXT.goalOn[mode] : TEXT.goalOff[mode]}
        </button>
      </section>

      <section className="card fam-streak">
        <p className="fam-streak-title">
          <span className="fam-flame" aria-hidden="true">🔥</span>
          {TEXT.streak[mode](streak.streak)}
        </p>
        <p className="fam-small">{TEXT.streakSub[mode]}</p>
        <div className="fam-week">
          {streak.week.map((d) => (
            <span key={d.date}>
              <i className={d.state}>{d.state === "done" ? "✓" : d.state === "missed" && mode === "hero" ? "✕" : ""}</i>
              <small>{new Date(`${d.date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" })}</small>
            </span>
          ))}
        </div>
        <p className="fam-small">{TEXT.streakFoot}</p>
        {waitingFor.length > 0 && (
          <a className="fam-invite-link" href={whatsappLink(TEXT.nudge)} target="_blank" rel="noopener noreferrer">
            {TEXT.nudgeButton(waitingFor.map(memberLabel).join(", "))}
          </a>
        )}
      </section>

      <section className="group about-group fam-manage">
        <p className="group-label">{TEXT.manage}</p>
        <div className="group-rows">
          <button type="button" className="row" onClick={() => { setNameDraft(house.name); setEditingName(true); window.scrollTo(0, 0); }}>{TEXT.editHousehold}</button>
          <button type="button" className="row" onClick={() => setManageProfiles(!manageProfiles)} aria-expanded={manageProfiles}>
            <span>{TEXT.editProfiles}</span>
            <span className="row-value">{house.profiles.map((p) => p.name).join(", ")}</span>
          </button>
          {manageProfiles && house.profiles.map((p) => (
            <button key={p.id} type="button" className="row" onClick={() => { setEditing(p); setProfileReturn("main"); setView("profile"); }}>
              <span>{p.name}</span>
              <span className="row-mark" aria-hidden="true">›</span>
            </button>
          ))}
          <button
            type="button"
            className="row row-signout"
            onClick={() => { if (me && window.confirm(TEXT.leaveConfirm)) run(() => leaveHousehold(house.id, userId), "create"); }}
          >
            {TEXT.leave}
          </button>
        </div>
      </section>

      {sheet && <MemberSheet sheet={sheet} mode={mode} onClose={() => setSheet(null)} />}
    </main>
  );
}
