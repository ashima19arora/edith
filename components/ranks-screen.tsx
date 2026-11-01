"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LABELS, RANKS_TEXT as TEXT } from "@/lib/labels";
import { XP, RANK_THRESHOLDS } from "@/lib/factors";
import { currentStreak, longestStreak, rankFor } from "@/lib/progress";
import { badgeStates, heatmap, weeklyChallenge, type BadgeId } from "@/lib/ranks";
import { loadHousehold } from "@/lib/family-store";
import { getAccount, storeFor } from "@/lib/storage";
import { nowIST } from "@/lib/time";
import { useMode } from "@/lib/theme";
import type { Bill, Checkin, OneOff, SetupAnswers } from "@/lib/types";
import { AppShell } from "./app-shell";

const ROOFS = [14, 26, 8, 20, 32, 12, 24, 10, 28, 16, 22, 30];
const ANTENNA_WEEKS = [4, 8];

const BADGE_ICONS: Record<BadgeId, string> = {
  "suit-up": "M5 21v-9l7-8 7 8v9M9 21v-5h6v5",
  "seven-day": "M6 4h12l-7 16M9 12h6",
  "great-responsibility": "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  "rail-rider": "M7 3h10a2 2 0 012 2v10a3 3 0 01-3 3H8a3 3 0 01-3-3V5a2 2 0 012-2zM5 10h14M8 21l2-3M16 21l-2-3",
  "cool-head": "M12 2v20M4 7l16 10M20 7L4 17",
  "fewer-drops": "M12 3s7 7.5 7 12a7 7 0 01-14 0c0-4.5 7-12 7-12z",
  "diyas-only": "M3 13h18c0 4-4 7-9 7s-9-3-9-7zM12 9c-1.5-1.5-1-3.5 0-6 1 2.5 1.5 4.5 0 6z",
  assemble: "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c0-4 3-6 6.5-6s6.5 2 6.5 6M16 4.500a3.5 3.5 0 010 6.500M18 14.500c2 1 3.5 2.8 3.5 5.5",
  "paper-trail": "M6 3h9l4 4v14H6zM9 12h7M9 16h7",
  "clean-escape": "M12 3v3M12 18v3M3 12h3M18 12h3M12 8a4 4 0 100 8 4 4 0 000-8z",
};

function Shield({ number }: { number: number }) {
  return (
    <svg className="rank-shield" viewBox="0 0 78 88" aria-hidden="true">
      <path d="M39 3l34 11v28c0 22-15 36-34 43C20 78 5 64 5 42V14z" fill="#FFE14D" stroke="#0A0A0A" strokeWidth="3" />
      <path d="M39 13l24 8v21c0 16-10 26-24 32-14-6-24-16-24-32V21z" fill="#D81E3C" stroke="#0A0A0A" strokeWidth="2" />
      <text x="39" y="56" textAnchor="middle" className="rank-shield-number">{number}</text>
    </svg>
  );
}

interface RankData {
  setup: SetupAnswers;
  checkins: Checkin[];
  bills: Bill[];
  xp: number;
  oneOffs: OneOff[];
  hasSquad: boolean;
}

export function RanksScreen() {
  const router = useRouter();
  const mode = useMode();
  const [data, setData] = useState<RankData | null>(null);
  const [failed, setFailed] = useState(false);
  const [xpOpen, setXpOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const account = await getAccount();
      if (!account) return router.replace("/app/sign-in");
      const store = storeFor(account);
      const [setup, checkins, bills, xp, oneOffs] = await Promise.all([
        store.getSetup(),
        store.getCheckins(),
        store.getBills(),
        store.getXp(),
        store.getOneOffs(),
      ]);
      const house = account.kind === "user" ? await loadHousehold(account.id, nowIST().date).catch(() => null) : null;
      const hasSquad = !!house && house.members.length + house.profiles.length >= 2;
      if (!setup) return router.replace("/app/style");
      setData({ setup, checkins, bills, xp, oneOffs, hasSquad });
    }
    load().catch(() => setFailed(true));
  }, [router]);

  const today = nowIST().date;
  const rank = rankFor(data?.xp ?? 0);
  const name = (index: number) => (mode === "hero" ? TEXT.rankNames[index] : TEXT.level(index + 1));
  const dates = data?.checkins.map((c) => c.date) ?? [];
  const streak = currentStreak(dates, today);
  const longest = longestStreak(dates);
  const weeks = heatmap(data?.checkins ?? [], today);
  const challenge = data && weeklyChallenge(data.setup, data.checkins, today);
  const badges = data ? badgeStates(data.setup, data.checkins, data.bills, data.hasSquad, data.oneOffs, today) : [];
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <AppShell active="progress">
      <main className="screen ranks halftone">
        <header className="page-head">
          <h1>{LABELS.progressTab[mode]}</h1>
          <p>{TEXT.subtitle[mode]}</p>
        </header>
        {failed && <p className="form-error ranks-error" role="alert">{TEXT.loadFailed}</p>}

        <section className="card rank-card">
          <div className="rank-top">
            {mode === "hero" ? (
              <Shield number={rank.rank + 1} />
            ) : (
              <span className="level-circle">
                <small>{TEXT.levelWord}</small>
                {rank.rank + 1}
              </span>
            )}
            <div className="rank-names">
              {mode === "hero" && <p className="rank-label">{TEXT.currentRank}</p>}
              <p className="rank-name">{name(rank.rank)}</p>
              <p className="rank-xp">{data?.xp ?? 0} XP</p>
            </div>
          </div>
          <div className="xp-bar" aria-hidden="true">
            <i style={{ width: `${rank.progress * 100}%` }} />
          </div>
          <p className="rank-next">
            {rank.xpToNext === null ? TEXT.topRank : TEXT.toNext(rank.xpToNext, name(rank.rank + 1))}
          </p>
          {mode === "hero" && (
            <div className="rank-pips" aria-hidden="true">
              {RANK_THRESHOLDS.map((_, i) => (
                <span key={i} className={i < rank.rank ? "pip done" : i === rank.rank ? "pip current" : "pip"}>
                  {i + 1}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="card heat-card">
          {mode === "hero" ? (
            <div className="heat-head">
              <p className="sticker">{TEXT.cityLights}</p>
              <div className="heat-streak">
                <p>{TEXT.streak(streak)}</p>
                <small>{TEXT.longest(longest)}</small>
              </div>
            </div>
          ) : (
            <div className="heat-stats">
              <p><small>{TEXT.currentStreak}</small>{TEXT.days(streak)}</p>
              <p><small>{TEXT.longestLabel}</small>{TEXT.days(longest)}</p>
            </div>
          )}
          <div className="heat-grid" role="img" aria-label={TEXT.heatmapAlt(dates.length)}>
            {weeks.map((week, w) => (
              <div
                key={w}
                className={ANTENNA_WEEKS.includes(w) ? "heat-week antenna" : "heat-week"}
                style={{ "--roof": `${ROOFS[w]}px` } as React.CSSProperties}
              >
                {week.map((state, d) => (
                  <i key={d} className={`cell ${state}`} />
                ))}
              </div>
            ))}
          </div>
          {mode === "hero" ? (
            <p className="heat-axis"><span>{TEXT.axisStart}</span><span>{TEXT.axisEnd}</span></p>
          ) : null}
          <div className="heat-legend">
            {mode === "plain" && <span className="legend-range">{TEXT.axisRange}</span>}
            <span><i className="cell missed" />{TEXT.missed}</span>
            <span><i className="cell in" />{TEXT.checkedIn}</span>
            <span><i className="cell mission" />{TEXT.missionDone[mode]}</span>
          </div>
        </section>

        {challenge && (
          <section className="card challenge-card">
            <div className="challenge-head">
              <p className="sticker">{TEXT.challengeTag}</p>
              <span className="xp-tag">+{XP.weeklyChallenge} XP</span>
            </div>
            <p className="challenge-text">{TEXT.challenge[challenge.kind](challenge.target)}</p>
            <div className="challenge-blocks" aria-hidden="true">
              {Array.from({ length: challenge.target }, (_, i) => (
                <i key={i} className={i < challenge.done ? "done" : ""} />
              ))}
            </div>
            <p className="challenge-note">{TEXT.challengeNote[mode](challenge.done, challenge.target, challenge.kind)}</p>
          </section>
        )}

        <section className="card badges-card">
          <div className="badges-head">
            <p className="sticker">{TEXT.badgesTag}</p>
            <span className="badges-count">{TEXT.badgeCount[mode](earnedCount, badges.length)}</span>
          </div>
          <ul className="badges">
            {badges.map((badge, i) => (
              <li key={badge.id} className={badge.earned ? `badge earned tint-${i % 5}` : "badge"}>
                <span className="badge-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={BADGE_ICONS[badge.id]} />
                  </svg>
                </span>
                <span className="badge-text">
                  <strong>{TEXT.badges[badge.id].name}</strong>
                  <small>{TEXT.badges[badge.id].how}</small>
                  {!badge.earned && badge.count && (
                    <em>{TEXT.badges[badge.id].progress?.(badge.count[0], badge.count[1])}</em>
                  )}
                  {!badge.earned && badge.id === "diyas-only" && <em>{TEXT.diyasLocked}</em>}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="xp-section">
          <button type="button" className="xp-toggle" aria-expanded={xpOpen} onClick={() => setXpOpen(!xpOpen)}>
            {TEXT.xpToggle}
            <svg className={xpOpen ? "open" : ""} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {xpOpen && (
            <ul className="xp-rows">
              {TEXT.xpRows.map(([label, key]) => (
                <li key={key}>
                  <span>{label}</span>
                  <b>+{XP[key]}</b>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </AppShell>
  );
}
