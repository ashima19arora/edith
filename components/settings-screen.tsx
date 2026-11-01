"use client";

/* eslint-disable @next/next/no-location-assign-relative-destination --
   Editing a section uses full page loads so the form and Settings always start from the saved answers. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CHECK_SECTIONS, SECTION_NAMES, SETTINGS_TEXT as TEXT, RANKS_TEXT } from "@/lib/labels";
import type { Household } from "@/lib/family";
import { loadHousehold } from "@/lib/family-store";
import { rankFor } from "@/lib/progress";
import { detailLines } from "@/lib/setup";
import { getAccount, signOut, storeFor, type Account, type Profile } from "@/lib/storage";
import { nowIST } from "@/lib/time";
import { setMode, ThemeRoot, useMode } from "@/lib/theme";
import type { Mode, SetupAnswers } from "@/lib/types";
import { BackIcon } from "./art";

function maskEmail(email: string | null): string {
  if (!email) return "";
  const [name, domain] = email.split("@");
  return `${name.slice(0, 5)}•••@${domain}`;
}

function Chevron() {
  return (
    <svg className="row-chevron" viewBox="0 0 9 15" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1.5 1.500L7.5 7.500L1.5 13.5" />
    </svg>
  );
}

type Access = "granted" | "denied" | "prompt" | "unknown";

export function SettingsScreen() {
  const router = useRouter();
  const mode = useMode();
  const [account, setAccount] = useState<Account | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [setup, setSetup] = useState<SetupAnswers | null>(null);
  const [xp, setXp] = useState(0);
  const [house, setHouse] = useState<Household | null>(null);
  const [access, setAccess] = useState<Access>("unknown");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const found = await getAccount();
      if (!found) return router.replace("/app/sign-in");
      setAccount(found);
      const store = storeFor(found);
      const [foundProfile, foundSetup, foundXp] = await Promise.all([store.getProfile(), store.getSetup(), store.getXp()]);
      setProfile(foundProfile);
      setSetup(foundSetup);
      setXp(foundXp);
      if (found.kind === "user") setHouse(await loadHousehold(found.id, nowIST().date).catch(() => null));
    }
    load().catch(() => setError(TEXT.loadFailed));

    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((status) => setAccess(status.state))
      .catch(() => setAccess("unknown"));
  }, [router]);

  async function changeLook(next: Mode) {
    setMode(next);
    if (account) await storeFor(account).saveProfile({ mode: next }).catch(() => setError(TEXT.lookFailed));
  }

  async function leave() {
    await signOut();
    window.location.assign("/app/sign-in");
  }

  const guest = account?.kind === "guest";
  const email = account?.kind === "user" ? account.email : null;
  const name = profile?.displayName?.trim() || TEXT.fallbackName;
  const rank = rankFor(xp);
  const rankLine = `${mode === "hero" ? RANKS_TEXT.rankNames[rank.rank] : RANKS_TEXT.level(rank.rank + 1)} · ${xp} XP`;
  const lines = setup ? detailLines(setup, mode) : [];
  const area = setup?.location.area.startsWith("Using") ? TEXT.yourLocation : setup?.location.area;

  return (
    <ThemeRoot>
      <main className="screen settings halftone">
        <header className="settings-head">
          <Link href="/app" className="back-btn" aria-label={TEXT.back}>
            <BackIcon />
            <span className="back-word">{TEXT.back}</span>
          </Link>
          <h1>{TEXT.title}</h1>
        </header>
        {error && <p className="form-error settings-error" role="alert">{error}</p>}

        {guest ? (
          <section className="card guest-card">
            <h2>{TEXT.guestTitle[mode]}</h2>
            <p>{TEXT.guestText[mode]}</p>
            <Link href="/app/sign-in" className="guest-signin">
              {mode === "hero" && <span className="google-g" aria-hidden="true">G</span>}
              {TEXT.signInSave}
            </Link>
          </section>
        ) : (
          account && (
            <section className="card profile-card">
              <span className="profile-avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
              <div>
                <p className="profile-name">{name}</p>
                <p className="profile-email">{maskEmail(email)}</p>
                <p className="profile-rank">{rankLine}</p>
              </div>
            </section>
          )
        )}

        <section className="group details-group">
          <p className="group-label">{TEXT.myDetails}</p>
          <div className="group-rows">
            {CHECK_SECTIONS.map((section, i) => (
              // A full page load, so the setup screen always opens with fresh saved answers.
              <a key={section} href={`/app/setup?section=${section}`} className="row detail-row">
                <span className="row-text">
                  <strong>{SECTION_NAMES[section][mode]}</strong>
                  <small>{lines[i]}</small>
                </span>
                <Chevron />
              </a>
            ))}
          </div>
        </section>

        <section className="group look-group">
          <p className="group-label">{TEXT.look}</p>
          <div className="look-switch" role="radiogroup" aria-label={TEXT.look}>
            {(["hero", "plain"] as Mode[]).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={mode === option}
                className={`look-option look-${option}`}
                onClick={() => changeLook(option)}
              >
                {TEXT.lookNames[option]}
              </button>
            ))}
          </div>
          <p className="look-note">{TEXT.lookNote}</p>
        </section>

        <section className="group">
          <p className="group-label">{TEXT.location}</p>
          <div className="group-rows">
            <div className="row">
              <span>{TEXT.locationAccess}</span>
              <span className={`access access-${access}`}>{TEXT.access[access]}</span>
            </div>
            <a href="/app/setup?section=base" className="row">
              <span>{TEXT.changeCity[mode]}</span>
              <span className="row-end">
                <span className="row-value">{area}</span>
                <Chevron />
              </span>
            </a>
          </div>
        </section>

        <section className="group squad-group">
          <p className="group-label">{TEXT.squad[mode]}</p>
          <Link href={guest ? "/app/sign-in" : "/app/family"} className="row squad-row">
            <span>
              {guest
                ? TEXT.squadGuest[mode]
                : house
                  ? TEXT.squadSummary(house.name, house.members.length + house.profiles.length)
                  : TEXT.squadSetup[mode]}
            </span>
            <Chevron />
          </Link>
        </section>

        <section className="group">
          <p className="group-label">{TEXT.account}</p>
          <div className="group-rows">
            <div className="row">
              <span>{guest ? TEXT.guestWord : TEXT.signedIn[mode]}</span>
              <span className="row-value">{guest ? TEXT.onThisPhone : maskEmail(email)}</span>
            </div>
            {guest ? (
              <Link href="/app/sign-in" className="row row-signin">{TEXT.signInSave}</Link>
            ) : (
              <button type="button" className="row row-signout" onClick={leave}>{TEXT.signOut}</button>
            )}
          </div>
        </section>

        <section className="group about-group">
          <p className="group-label">{TEXT.about}</p>
          <div className="group-rows">
            <div className="row">
              <span>{TEXT.version}</span>
              <span className="row-value">{TEXT.versionValue[mode]}</span>
            </div>
            <a href={TEXT.githubUrl} target="_blank" rel="noopener noreferrer" className="row">
              <span>{TEXT.github}</span>
              <span className="row-mark" aria-hidden="true">↗</span>
            </a>
            <Link href="/app/calculate" className="row">
              <span>{TEXT.howWeCalculate}</span>
              <span className="row-mark" aria-hidden="true">›</span>
            </Link>
          </div>
        </section>
      </main>
    </ThemeRoot>
  );
}
