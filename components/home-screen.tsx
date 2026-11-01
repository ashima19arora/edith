"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MISSIONS, type MissionContext } from "@/config/missions";
import { loadAir, type AirResult } from "@/lib/air";
import { cigarettesOutAllDay } from "@/lib/aqi";
import { isWinter } from "@/lib/footprint";
import {
  applicableMissions,
  careAlert,
  chartBars,
  footprintInfo,
  headline,
  livesInfo,
  nextGoTime,
  missionKey,
  pickMission,
  type FootprintInfo,
} from "@/lib/home";
import type { FamilyProfile } from "@/lib/family";
import { loadHousehold } from "@/lib/family-store";
import { HOME_TEXT as TEXT, LABELS } from "@/lib/labels";
import { currentStreak } from "@/lib/progress";
import type { Account, MissionEntry, Profile } from "@/lib/storage";
import { storeFor } from "@/lib/storage";
import { nowIST } from "@/lib/time";
import { useMode } from "@/lib/theme";
import type { Checkin, Mode, SetupAnswers } from "@/lib/types";
import { AppShell } from "./app-shell";
import { FlameIcon, Skyline, SpiderIcon } from "./art";
import { BillCapture } from "./bill-capture";
import { Heart } from "./heart";

const BILL_KEY = "edith.billCardSeen";

// One mission a day: asks Gemini once, and keeps the rule-based pick if that isn't available.
async function loadMissionId(context: MissionContext, date: string): Promise<string | null> {
  const saved = localStorage.getItem(missionKey(date));
  if (saved && MISSIONS.some((m) => m.id === saved && m.applies(context))) return saved;

  const pick = pickMission(context, date);
  if (!pick) return null;
  let id = pick.id;
  try {
    const candidates = applicableMissions(context).map((m) => ({ id: m.id, text: m.text(context), kg: m.saving.kg }));
    const response = await fetch("/api/mission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidates, biggest: pick.sector }),
    });
    if (response.ok) id = ((await response.json()) as { id: string }).id;
  } catch {
    // The rule-based pick stands
  }
  localStorage.setItem(missionKey(date), id);
  return id;
}

const SCALE: [string, number][] = [
  ["a", 10],
  ["b", 10],
  ["c", 20],
  ["d", 20],
  ["e", 20],
  ["f", 20],
];

function AqiScale({ aqi }: { aqi: number }) {
  return (
    <div className="aqi-scale" aria-hidden="true">
      <div className="aqi-scale-track">
        {SCALE.map(([key, width]) => (
          <i key={key} className={`scale-${key}`} style={{ width: `${width}%` }} />
        ))}
        <b style={{ left: `${(Math.min(aqi, 500) / 500) * 100}%` }} />
      </div>
    </div>
  );
}

function Footprint({ info, mode }: { info: FootprintInfo | null; mode: Mode }) {
  const text = TEXT.footprint;
  if (!info) return <p className="fp-note">{text.loading}</p>;
  if (info.previousKg === null) return <p className="fp-note">{text.firstMonth}</p>;

  const diff = Math.round(info.kg - info.previousKg);
  const less = diff <= 0;
  const amount = text.diff(Math.abs(diff), less);
  if (mode === "plain") {
    return (
      <>
        <p className={less ? "fp-change less" : "fp-change more"}>{text.change(Math.abs(diff), less)}</p>
        <p className="fp-sub">{text.byDate(Math.round(info.previousKg))}</p>
      </>
    );
  }
  return (
    <p className="fp-note">
      <mark>{amount}</mark> {text.thanLastMonth}
    </p>
  );
}

interface HomeScreenProps {
  account: Account;
  profile: Profile;
  setup: SetupAnswers;
}

export function HomeScreen({ account, profile, setup }: HomeScreenProps) {
  const mode = useMode();
  const today = useMemo(() => nowIST(), []);
  const store = useMemo(() => storeFor(account), [account]);

  const [air, setAir] = useState<AirResult | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [footprint, setFootprint] = useState<FootprintInfo | null>(null);
  const [missionId, setMissionId] = useState<string | null>(null);
  const [entry, setEntry] = useState<MissionEntry | null>(null);
  const [billDue, setBillDue] = useState(false);
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);

  const context = useMemo<MissionContext>(() => {
    const latest = [...checkins].sort((a, b) => b.date.localeCompare(a.date))[0];
    return { setup, winter: isWinter(today.date), lastEnergy: latest?.energy };
  }, [setup, today.date, checkins]);

  useEffect(() => {
    loadAir(setup).then(setAir);
  }, [setup]);

  useEffect(() => {
    if (account.kind !== "user") return;
    loadHousehold(account.id, today.date)
      .then((house) => setProfiles(house?.profiles ?? []))
      .catch(() => setProfiles([]));
  }, [account, today.date]);

  useEffect(() => {
    async function load() {
      const [foundCheckins, oneOffs, bills, mission] = await Promise.all([
        store.getCheckins(),
        store.getOneOffs(),
        store.getBills(),
        store.getMission(today.date),
      ]);
      setCheckins(foundCheckins);
      setFootprint(footprintInfo(today.date, foundCheckins, oneOffs, bills, setup));
      setEntry(mission);

      const month = today.date.slice(0, 7);
      const hasBill = bills.some((b) => b.periodEnd.slice(0, 7) >= month || b.periodEnd.slice(0, 7) === lastMonth(month));
      setBillDue(!hasBill && localStorage.getItem(BILL_KEY) !== month);
    }
    load().catch(() => setFootprint({ kg: 0, previousKg: null }));
  }, [store, today.date, setup]);

  useEffect(() => {
    loadMissionId(context, today.date).then(setMissionId);
  }, [context, today.date]);

  const data = air?.air ?? null;
  const go = data ? nextGoTime(data.hours, today.date, today.tomorrow, today.time) : null;
  const category = data?.category ?? null;
  const alert = careAlert(mode, setup, category, go, profiles);
  const bars = data ? chartBars(data.hours, today.date, go) : [];
  const todayHours = data?.hours.filter((h) => h.time.startsWith(today.date)) ?? [];
  const lives = data ? livesInfo(todayHours, setup, data.aqi, go) : null;
  const streak = currentStreak(checkins.map((c) => c.date), today.date);

  const mission = MISSIONS.find((m) => m.id === missionId);
  const saving = mission?.saves(context);
  const accepted = entry?.missionId === missionId && entry?.accepted;

  async function toggleMission() {
    if (!mission || !saving) return;
    const next: MissionEntry = {
      date: today.date,
      missionId: mission.id,
      accepted: !accepted,
      savedKg: saving.kg,
      savedInr: saving.inr,
    };
    setEntry(next);
    await store.saveMission(next).catch(() => setEntry(entry));
  }

  const area = setup.location.lat !== null && setup.location.area.startsWith("Using") ? null : setup.location.area;
  const initial = (profile.displayName ?? "").trim().charAt(0).toUpperCase() || TEXT.youInitial;
  const stale = air?.staleAt ?? null;
  const cigarettes = data?.pm25Mean != null ? Math.round(cigarettesOutAllDay(data.pm25Mean)) : null;

  return (
    <AppShell active="home">
      <main className="screen home halftone">
        <div className="home-sky" aria-hidden="true">
          <Skyline still />
        </div>

        <header className="home-head">
          <div className="home-title">
            {mode === "hero" ? (
              <p className="sticker">{area ? TEXT.meanwhile(area) : TEXT.meanwhileNoArea}</p>
            ) : (
              <p className="home-date">{TEXT.date(today.date)}</p>
            )}
            <h1>{LABELS.homeTab[mode]}</h1>
            {mode === "plain" && <p className="home-place">➤ {area ?? TEXT.yourLocation}</p>}
          </div>
          <div className="home-actions">
            <Link href="/app/family" className="head-btn head-family">
              <span className="head-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="9" cy="8" r="3.5" />
                  <path d="M2.500 20c0-4 3-6 6.500-6s6.500 2 6.500 6M16 4.800a3.500 3.500 0 010 6.500M18 14.500c2 .8 3.500 2.700 3.500 5.500" />
                </svg>
              </span>
              <span>{TEXT.headFamily[mode]}</span>
            </Link>
            <Link href="/app/assistant" className="head-btn head-assistant">
              <span className="head-icon"><SpiderIcon /></span>
              <span>{TEXT.headAssistant[mode]}</span>
            </Link>
            <Link href="/app/settings" className="head-btn head-profile">
              <span className="head-icon">{initial}</span>
              <span>{TEXT.headProfile[mode]}</span>
            </Link>
          </div>
        </header>

        <section className="home-headline">
          <p className="says-label">{TEXT.says}</p>
          <p className="says-text">{headline(mode, category, go, today.time)}</p>
        </section>

        {alert && (
          <section className="home-alert" role="status">
            <span className="alert-icon" aria-hidden="true">!</span>
            <p className="alert-tag">{TEXT.alertTag[mode]}</p>
            <div className="alert-body">
              {alert.people && <p>{alert.people}</p>}
              {alert.pets && <p>{alert.pets}</p>}
            </div>
          </section>
        )}

        <div className="home-grid">
          <section className="panel panel-threat">
            <p className="panel-tag">{TEXT.threatTag[mode]}</p>
            <p className="big-number">{data ? data.aqi : "–"}</p>
            {data ? (
              <>
                <p className={`number-label cat-word cat-${data.category.replace(" ", "-").toLowerCase()}`}>{data.category}</p>
                <AqiScale aqi={data.aqi} />
                {cigarettes !== null && (
                  <p className="panel-foot">
                    <span className="ciggy" aria-hidden="true" />
                    <span>{TEXT.cigarettes[mode](cigarettes)}</span>
                  </p>
                )}
                {stale && <p className="panel-stale">{TEXT.staleAir(stale)}</p>}
              </>
            ) : (
              <p className="panel-foot">{air ? TEXT.airUnavailable : TEXT.airLoading}</p>
            )}
          </section>

          <Link href="/app/footprint" className="panel panel-footprint">
            <p className="panel-tag">
              {TEXT.footprintTag[mode]} <span className="chevron" aria-hidden="true">›</span>
            </p>
            <p className="big-number">{footprint ? Math.round(footprint.kg) : "–"}</p>
            <p className="number-label">{TEXT.footprintUnit[mode]}</p>
            <div className="panel-foot fp-foot">
              <Footprint info={footprint} mode={mode} />
            </div>
          </Link>

          <section className="panel panel-go">
            <p className="panel-tag">{LABELS.bestWindow[mode]}</p>
            <p className="go-time">{go ? go.label : "–"}</p>
            {go && (
              <p className="go-sub">
                {go.tomorrow ? TEXT.goTomorrow(go.index) : TEXT.goToday[mode](go.index)}
              </p>
            )}
            {bars.length > 0 && (
              <>
                <div className="go-chart" aria-hidden="true">
                  {bars.map((bar) => (
                    <i
                      key={bar.label}
                      className={`cat-bar-${bar.category.replace(" ", "-").toLowerCase()} ${bar.inWindow ? "in-window" : ""}`}
                      style={{ height: `${Math.min(bar.aqi / 400, 1) * 100}%` }}
                    />
                  ))}
                </div>
                <p className="go-labels" aria-hidden="true">
                  <span>{TEXT.chartStart[mode]}</span>
                  {go && !go.tomorrow && <b>{go.label.replace(/ [AP]M$/, "")}</b>}
                  <span>{TEXT.chartEnd[mode]}</span>
                </p>
              </>
            )}
          </section>

          <section className="panel panel-mission">
            <p className="panel-tag">{LABELS.mission[mode]}</p>
            {mission && saving ? (
              <>
                <p className="mission-text">{mission.text(context)}</p>
                <div className="mission-save">
                  <p className="save-label">{TEXT.youSave}</p>
                  <p className="save-kg">
                    {saving.kg.toFixed(1)} <small>{TEXT.kgUnit[mode]}</small>
                  </p>
                  {saving.inr >= 1 && (
                    <p className="save-inr">
                      ₹{Math.round(saving.inr)} <small>{TEXT.inrUnit[mode]}</small>
                    </p>
                  )}
                  {saving.inr <= -1 && <p className="save-cost">{TEXT.costsMore(Math.round(-saving.inr))}</p>}
                </div>
                <button type="button" className={accepted ? "mission-btn done" : "mission-btn"} onClick={toggleMission}>
                  {accepted ? TEXT.missionDone[mode] : TEXT.missionAccept[mode]}
                </button>
              </>
            ) : (
              <p className="mission-text">{TEXT.missionLoading}</p>
            )}
          </section>
        </div>

        {lives && (
          <section className="home-lives">
            <p className="lives-head">
              <span className="panel-tag">{LABELS.hearts[mode]}</span>
              <span className="lives-count">{TEXT.livesCount[mode](lives.safe)}</span>
            </p>
            <div className="hearts" role="img" aria-label={TEXT.livesCount.plain(lives.safe)}>
              {Array.from({ length: 5 }, (_, i) => (
                <Heart key={i} mode={mode} safe={i < lives.safe} />
              ))}
            </div>
            <p className="lives-text">
              {lives.atRisk === 0 ? (
                TEXT.livesSafe
              ) : (
                <>
                  {TEXT.livesCost[0]} <strong>{TEXT.hearts(lives.atRisk)}</strong> {TEXT.livesCost[1]}
                  {lives.keepMore > 0 && go && ` ${TEXT.livesKeep(lives.keepMore, lives.hasWalk, go.label, mode)}`}
                </>
              )}
            </p>
          </section>
        )}

        {billDue && (
          <BillCapture
            account={account}
            month={lastMonth(today.date.slice(0, 7))}
            className="home-bill"
            onDone={() => localStorage.setItem(BILL_KEY, today.date.slice(0, 7))}
          />
        )}

        <section className="home-streak">
          <div className="streak-row">
            {mode === "hero" && <FlameIcon />}
            <div>
              <p className="streak-count">{TEXT.streak[mode](streak)}</p>
              <p className="streak-sub">{TEXT.streakSub[mode]}</p>
            </div>
          </div>
          <Link href="/app/checkin?start=1" className="cta home-cta">
            {TEXT.checkinButton[mode]}
          </Link>
        </section>
      </main>
    </AppShell>
  );
}

function lastMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 2, 1)).toISOString().slice(0, 7);
}
