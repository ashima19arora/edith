"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DIWALI, isDiwaliSeason } from "@/config/diwali";
import { loadAir, type AirResult } from "@/lib/air";
import { cigarettesOutAllDay, cigarettesSoFar } from "@/lib/aqi";
import {
  defenceTips,
  forecastBars,
  historyDays,
  outdoorHoursSoFar,
  pollutantRows,
  timelineRows,
  tomorrowCategory,
  weekTrend,
  worstWindow,
} from "@/lib/airspace";
import { livesInfo, nextGoTime } from "@/lib/home";
import { AIR_TEXT as TEXT, LABELS } from "@/lib/labels";
import { exerciseBlocks } from "@/lib/lives";
import { getAccount, storeFor } from "@/lib/storage";
import { nowIST } from "@/lib/time";
import { useMode } from "@/lib/theme";
import type { Checkin, Mode, SetupAnswers } from "@/lib/types";
import { AppShell } from "./app-shell";
import { Heart } from "./heart";

const SCALE: [string, number][] = [["a", 10], ["b", 10], ["c", 20], ["d", 20], ["e", 20], ["f", 20]];
const slug = (category: string) => category.replace(" ", "-").toLowerCase();

function Diya({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M12 2c-2 3-3 5-1 8 2 0 3-1 3-3 0-2-1-3-2-5z" fill="#FFE14D" stroke="#0A0A0A" strokeWidth="1" />
      <path d="M2 12h20c0 5-4 9-10 9S2 17 2 12z" fill="#D81E3C" stroke="#0A0A0A" strokeWidth="1.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={open ? "fold-chevron open" : "fold-chevron"} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function DiwaliSheet({ mode, onClose }: { mode: Mode; onClose: () => void }) {
  const text = TEXT.diwali;
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <section className="diwali-sheet" role="dialog" aria-modal="true" aria-label={LABELS.diwali[mode]} onClick={(e) => e.stopPropagation()}>
        <span className="sheet-handle" aria-hidden="true" />
        <header className="sheet-head">
          <span className="sheet-diya"><Diya size={mode === "hero" ? 30 : 22} /></span>
          <h2>{LABELS.diwali[mode]}</h2>
          <button type="button" className="sheet-close" aria-label={text.close} onClick={onClose}><CloseIcon /></button>
        </header>
        <div className="sheet-body">
          {DIWALI.firecrackers && (
            <div className="rules-card">
              <p className="sheet-label">{text.rulesTitle(DIWALI.year)}</p>
              <p className="rules-row"><span>{text.firecrackers}</span><b>{DIWALI.firecrackers}</b></p>
              {DIWALI.permittedHours && <p className="rules-row"><span>{text.hours}</span><b>{DIWALI.permittedHours}</b></p>}
              {DIWALI.noticeUrl && <a href={DIWALI.noticeUrl} target="_blank" rel="noopener noreferrer" className="rules-link">{text.readNotice} ↗</a>}
            </div>
          )}

          <div className="sheet-section">
            <p className="sheet-tag tag-red">{text.worstTitle}</p>
            <p className="sheet-text">{text.worst}</p>
          </div>

          <div className="sheet-section">
            <p className="sheet-tag tag-yellow">{text.familyTitle}</p>
            <ul className="sheet-list">{text.family.map((t) => <li key={t}>{t}</li>)}</ul>
            <div className="emergency">
              <p>{text.emergency}</p>
              <a href={`tel:${DIWALI.emergency}`}>{text.call(DIWALI.emergency)}</a>
            </div>
          </div>

          <div className="sheet-section">
            <p className="sheet-tag tag-blue">{text.petsTitle}</p>
            <ul className="sheet-list blue">{text.pets.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>

          <div className="sheet-section">
            <p className="sheet-tag tag-white">{text.reportTitle}</p>
            <div className="report-links">
              <a href={DIWALI.noisePortalUrl} target="_blank" rel="noopener noreferrer"><strong>{text.noise}</strong><small>ngms.delhi.gov.in</small></a>
            </div>
            <p className="sheet-note">{text.reportNote}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export function AirScreen() {
  const router = useRouter();
  const mode = useMode();
  const [setup, setSetup] = useState<SetupAnswers | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [result, setResult] = useState<AirResult | null>(null);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [weaponsOpen, setWeaponsOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const account = await getAccount();
      if (!account) return router.replace("/app/sign-in");
      const store = storeFor(account);
      const [saved, foundCheckins] = await Promise.all([store.getSetup(), store.getCheckins().catch(() => [])]);
      if (!saved) return router.replace("/app/style");
      setSetup(saved);
      setCheckins(foundCheckins);
      setResult(await loadAir(saved));
      setCheckedAt(Date.now());
    }
    load();
  }, [router]);

  const refresh = useCallback(async () => {
    if (!setup) return;
    setSpinning(true);
    setResult(await loadAir(setup));
    setCheckedAt(Date.now());
  }, [setup]);

  const today = nowIST();
  const air = result?.air ?? null;
  const nowIndex = air ? air.hours.findIndex((h) => h.time === today.time) : -1;
  const hasNow = !!air && nowIndex >= 0;
  const go = air ? nextGoTime(air.hours, today.date, today.tomorrow, today.time) : null;
  const worst = hasNow ? worstWindow(air.hours, nowIndex) : null;
  const bars = hasNow ? forecastBars(air.hours, nowIndex, go, worst) : [];
  const tomorrow = air ? tomorrowCategory(air.hours, today.tomorrow) : null;
  const tomorrowGo = air ? nextGoTime(air.hours, today.tomorrow, today.tomorrow, `${today.tomorrow}T00:00`) : null;
  const pollutants = hasNow ? pollutantRows(air.hours[nowIndex]) : [];
  const history = hasNow ? historyDays(air.hours, nowIndex, today.date) : [];
  const trend = hasNow ? weekTrend(air.hours, nowIndex, today.date) : null;
  const dayHours = air?.hours.filter((h) => h.time.startsWith(today.date)) ?? [];

  const logged = checkins.find((c) => c.date === today.date);
  const blocks = setup ? logged?.outdoorBlocks ?? [...setup.outdoorBlocks, ...exerciseBlocks(setup.exercise)] : [];
  const lives = air && setup ? livesInfo(dayHours, setup, air.aqi, go) : null;
  const rows = air ? timelineRows(blocks, dayHours, today.time) : [];
  const allDay = air?.pm25Mean != null ? cigarettesOutAllDay(air.pm25Mean) : null;
  const elapsed = dayHours.filter((h) => h.time <= today.time);
  const soFar = setup && air ? cigarettesSoFar(elapsed, outdoorHoursSoFar(blocks, today.time), setup.purifier) : null;
  const tips = air && setup ? defenceTips(mode, air.category, setup, go) : [];
  const area = setup?.location.area.startsWith("Using") ? TEXT.yourLocation : setup?.location.area;
  const main = air ? pollutants[0]?.id ?? "pm25" : "pm25";
  const headlineMain = (air?.mainPollutant ?? main) as keyof typeof TEXT.pollutants;

  return (
    <AppShell active="air">
      <main className="screen air halftone">
        <header className="page-head air-head">
          <h1>{LABELS.airTab[mode]}</h1>
          {isDiwaliSeason(today.date) && (
            <button type="button" className="diwali-btn" onClick={() => setSheet(true)}>
              <Diya size={18} /> {TEXT.diwaliButton}
            </button>
          )}
        </header>
        <div className="air-updated">
          <p>
            {area}
            {checkedAt && ` · ${TEXT.updated(result?.staleAt ?? checkedAt)}`}
          </p>
          <button type="button" className="refresh-btn" aria-label={TEXT.refresh} onClick={refresh}>
            <svg
              className={spinning ? "spin" : ""}
              onAnimationEnd={() => setSpinning(false)}
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 12a8 8 0 11-2.3-5.700M20 3v5h-5" />
            </svg>
          </button>
        </div>

        {!air && <p className="air-empty" role="status">{result ? TEXT.unavailable : TEXT.loading}</p>}

        {air && (
          <>
            <section className="card now-card">
              <p className="ctag">{TEXT.nowTag[mode]}</p>
              <div className="now-row">
                <p className="now-number">{air.aqi}</p>
                <p className={`now-category pill-${slug(air.category)}`}>{air.category}</p>
              </div>
              <div className="now-scale" aria-hidden="true">
                <div className="aqi-scale-track">
                  {SCALE.map(([key, width]) => <i key={key} className={`scale-${key}`} style={{ width: `${width}%` }} />)}
                  <b style={{ left: `${(Math.min(air.aqi, 500) / 500) * 100}%` }} />
                </div>
              </div>
              <p className="now-labels" aria-hidden="true">{[0, 100, 200, 300, 400, 500].map((n) => <span key={n}>{n}</span>)}</p>
              <div className="now-main">
                <p className="now-main-title">{TEXT.mostly(TEXT.pollutants[headlineMain].name)}</p>
                <p>{TEXT.pollutants[headlineMain].plain}</p>
              </div>
            </section>

            <section className="card forecast-card">
              <p className="ctag">{LABELS.forecast[mode]}{mode === "hero" ? TEXT.next24 : ""}</p>
              <div className="fc-stats">
                <p><small>{LABELS.bestWindow[mode]}</small><strong className="fc-go">{go?.label ?? "–"}</strong></p>
                <p><small>{TEXT.worstLabel}</small><strong className="fc-worst">{worst?.label ?? "–"}</strong></p>
              </div>
              {go?.tomorrow && <p className="fc-note">{TEXT.goIsTomorrow}</p>}
              <div className="fc-bars" aria-hidden="true">
                {bars.map((bar) => (
                  <span key={bar.time} className={bar.go ? "fc-bar go" : bar.worst ? "fc-bar worst" : "fc-bar"}>
                    {bar.worst && <em />}
                    <i className={`cat-bar-${slug(bar.category)}`} style={{ height: `${Math.min(bar.aqi / 400, 1) * 78}px` }} />
                  </span>
                ))}
              </div>
              <p className="fc-labels" aria-hidden="true">
                {bars.map((bar, i) => <span key={bar.time}>{i % 3 === 0 ? TEXT.hourShort(bar.hour) : ""}</span>)}
              </p>
              {tomorrow && (
                <p className="fc-tomorrow">
                  <b>{TEXT.tomorrow}</b>
                  <span>{TEXT.tomorrowLine(tomorrow, tomorrowGo?.label ?? null)}</span>
                </p>
              )}
            </section>

            {lives && (
              <section className="card damage-card">
                <div className="damage-head">
                  <p className="ctag">{LABELS.exposure[mode]}{mode === "hero" ? TEXT.today : ""}</p>
                  <span className="damage-count">{TEXT.livesCount[mode](lives.safe)}</span>
                </div>
                <div className="hearts" role="img" aria-label={TEXT.livesCount.plain(lives.safe)}>
                  {Array.from({ length: 5 }, (_, i) => <Heart key={i} mode={mode} safe={i < lives.safe} />)}
                </div>
                {rows.length > 0 ? (
                  <ul className="damage-rows">
                    {rows.map((row) => (
                      <li key={row.block}>
                        <span>
                          <strong>{TEXT.blockName(row.block)}</strong>
                          <small>{TEXT.blockTime(row.block)}{row.planned ? TEXT.planned : ""}</small>
                        </span>
                        <b>{TEXT.cost[mode](row.cost)}</b>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="damage-note">{TEXT.indoorsAllDay}</p>
                )}
                {soFar !== null && allDay !== null && (
                  <>
                    <div className="ciggy-tiles">
                      <p className="tile-today"><small>{TEXT.soFar}</small><strong>≈ {Math.round(soFar)}</strong><em>{TEXT.cigarettesWord(Math.round(soFar))}</em></p>
                      <p className="tile-allday"><small>{TEXT.allDay}</small><strong>≈ {Math.round(allDay)}</strong><em>{TEXT.cigarettesWord(Math.round(allDay))}</em></p>
                    </div>
                    <p className="damage-note">
                      {allDay - soFar >= 1 && TEXT.saved(Math.round(allDay - soFar))}
                      {lives.keepMore > 0 && go && !go.tomorrow && (
                        <b> {TEXT.wouldSave[mode](go.label, lives.keepMore, lives.hasWalk)}</b>
                      )}
                    </p>
                  </>
                )}
              </section>
            )}

            <section className="card defence-card">
              <p className="ctag">{LABELS.protection[mode]}{TEXT.forAir[mode](air.category)}</p>
              <ul className="defence-rows">
                {tips.map((tip) => (
                  <li key={tip.text}>
                    <span className="defence-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d={mode === "hero" ? "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" : "M5 13l4.5 4.500L19 7"} />
                      </svg>
                    </span>
                    <span>
                      {tip.text}
                      {tip.tag && <em className="defence-tag">{TEXT.tipTag[tip.tag]}</em>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card weapons-card">
              <button type="button" className="fold-head" aria-expanded={weaponsOpen} onClick={() => setWeaponsOpen(!weaponsOpen)}>
                <span>
                  <span className="ctag">{LABELS.pollutants[mode]}</span>
                  <small>{TEXT.pollutantCount[mode](pollutants.length, TEXT.pollutants[main].name)}</small>
                </span>
                <Chevron open={weaponsOpen} />
              </button>
              {weaponsOpen && (
                <ul className="weapon-rows">
                  {pollutants.map((p) => (
                    <li key={p.id}>
                      <p className="weapon-top">
                        <strong>{TEXT.pollutants[p.id].name}</strong>
                        <span>{TEXT.concentration(p.value, p.id)}</span>
                        <b className={`level-${slug(p.category)}`}>{p.category}</b>
                      </p>
                      <div className="weapon-bar" aria-hidden="true">
                        <i className={`cat-bar-${slug(p.category)}`} style={{ width: `${(p.index / 500) * 100}%` }} />
                      </div>
                      <p className="weapon-why">{TEXT.pollutants[p.id].plain}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {history.length > 0 && (
              <section className="card history-card">
                <p className="ctag">{LABELS.history[mode]}</p>
                <div className="history-days">
                  {history.map((day) => (
                    <p key={day.date}>
                      <b className={`square-${slug(day.category)}`}>{day.aqi}</b>
                      <small>{TEXT.dayName(day.date)}</small>
                    </p>
                  ))}
                </div>
                {trend && <p className="history-note">{TEXT.trend[trend]}</p>}
              </section>
            )}
          </>
        )}

        <section className="why-section">
          <button type="button" className="xp-toggle" aria-expanded={whyOpen} onClick={() => setWhyOpen(!whyOpen)}>
            {TEXT.whyTitle}
            <Chevron open={whyOpen} />
          </button>
          {whyOpen && <p className="why-answer">{TEXT.whyAnswer}</p>}
        </section>

        {sheet && <DiwaliSheet mode={mode} onClose={() => setSheet(false)} />}
      </main>
    </AppShell>
  );
}
