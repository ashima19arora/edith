"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MISSIONS, type MissionContext } from "@/config/missions";
import { loadAir, type AirData } from "@/lib/air";
import { headlineAqi, hourlyIndex } from "@/lib/aqi";
import { blockHours } from "@/lib/lives";
import {
  buildCheckin,
  challengeXp,
  checkinSteps,
  currentCalibration,
  prefillCheckin,
  xpForCheckin,
  type CheckinDraft,
} from "@/lib/checkin";
import { SPEED_KMH } from "@/lib/factors";
import { isWinter, totalKg } from "@/lib/footprint";
import { CHECKIN_TEXT as TEXT, OPTIONS } from "@/lib/labels";
import { canFillLate, currentStreak } from "@/lib/progress";
import { getAccount, storeFor, type Account, type MissionEntry } from "@/lib/storage";
import { nowIST } from "@/lib/time";
import { ThemeRoot, useMode } from "@/lib/theme";
import type { AqiCategory, Bill, Checkin, Meal, MissionStatus, SetupAnswers, TimeBlock, TravelMode, Trip } from "@/lib/types";
import { BackIcon, SpiderIcon } from "./art";
import { CheckinHub } from "./checkin-hub";
import { Heart } from "./heart";

const MEALS: Meal[] = ["veg", "veg-dairy", "egg", "chicken", "fish", "mutton", "skipped"];
const MODES = Object.keys(OPTIONS.mode) as TravelMode[];
const BLOCKS: TimeBlock[] = ["early", "morning", "afternoon", "evening", "night"];
const MAX_MEALS = 4;
const MAX_TRIPS = 3;

function blockCategory(block: TimeBlock, air: AirData | null, date: string): AqiCategory | null {
  if (!air) return null;
  const hours = blockHours(block);
  const indexes = air.hours
    .filter((h) => h.time.startsWith(date) && hours.includes(Number(h.time.slice(11, 13))))
    .map((h) => hourlyIndex(h))
    .filter((r) => r !== null);
  if (indexes.length === 0) return null;
  // The worst hour in the block, since that's the one to warn about
  return indexes.reduce((worst, r) => (r.aqi > worst.aqi ? r : worst)).category;
}

function Chips<T extends string>({ options, value, onChange, label, className = "" }: {
  options: [T, string][];
  value: T | undefined;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div className={`ci-chips ${className}`} role="radiogroup" aria-label={label}>
      {options.map(([key, text]) => (
        <button key={key} type="button" role="radio" aria-checked={value === key} className="ci-chip" onClick={() => onChange(key)}>
          {text}
        </button>
      ))}
    </div>
  );
}

function RangeRow({ label, value, max, step = 1, unit, onChange }: {
  label: string;
  value: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="ci-range">
      <p className="ci-section-label">{label}</p>
      <p className="ci-big"><strong>{value}</strong> <span>{unit}</span></p>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        style={{ "--fill": `${(value / max) * 100}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function Counter({ title, sub, value, onChange }: { title: string; sub: string; value: number; onChange: (value: number) => void }) {
  return (
    <li className="ci-counter">
      <span><strong>{title}</strong><small>{sub}</small></span>
      <div className="ci-counter-controls">
        <button type="button" aria-label={`Fewer: ${title}`} disabled={value <= 0} onClick={() => onChange(value - 1)}>−</button>
        <b aria-live="polite">{value}</b>
        <button type="button" className="plus" aria-label={`More: ${title}`} disabled={value >= 9} onClick={() => onChange(value + 1)}>+</button>
      </div>
    </li>
  );
}

interface Loaded {
  account: Account;
  setup: SetupAnswers;
  checkins: Checkin[];
  bills: Bill[];
  mission: MissionEntry | null;
  air: AirData | null;
}

export function CheckinScreen() {
  const params = useSearchParams();
  const requested = params.get("date");
  if (requested) return <FlowLoader key={requested} requested={requested} />;
  return params.has("start") ? <FlowLoader key="today" /> : <CheckinHub />;
}

function FlowLoader({ requested }: { requested?: string }) {
  const router = useRouter();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const today = useMemo(() => {
    const now = nowIST();
    return { ...now, date: requested && canFillLate(requested, now.date) ? requested : now.date };
  }, [requested]);

  useEffect(() => {
    async function load() {
      const account = await getAccount();
      if (!account) return router.replace("/app/sign-in");
      const store = storeFor(account);
      const [setup, checkins, bills, mission] = await Promise.all([
        store.getSetup(),
        store.getCheckins(),
        store.getBills(),
        store.getMission(today.date),
      ]);
      if (!setup) return router.replace("/app/style");
      const { air } = await loadAir(setup);
      setLoaded({ account, setup, checkins, bills, mission, air });
    }
    load().catch(() => router.replace("/app"));
  }, [router, today.date]);

  if (!loaded) return null;
  return <ThemeRoot><CheckinFlow {...loaded} date={today.date} /></ThemeRoot>;
}

function CheckinFlow({ account, setup, checkins, bills, mission, air, date }: Loaded & { date: string }) {
  const router = useRouter();
  const mode = useMode();
  const steps = useMemo(() => checkinSteps(setup, date, !!mission), [setup, date, mission]);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<CheckinDraft>(() => prefillCheckin(setup, checkins, date));
  const [openMeal, setOpenMeal] = useState<number | null>(null);
  const [openTrip, setOpenTrip] = useState<number | null>(null);
  const [picked, setPicked] = useState<MissionStatus>(null);
  const [done, setDone] = useState<{ checkin: Checkin; streak: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const step = steps[index];
  const winter = isWinter(date);
  const copyKey = step === "energy" && winter ? "energyWinter" : step;
  const copy = TEXT.steps[copyKey];
  const missionData = MISSIONS.find((m) => m.id === mission?.missionId);
  const context: MissionContext = { setup, winter };

  function update(changes: Partial<CheckinDraft>) {
    setDraft((current) => ({ ...current, ...changes }));
  }

  function setTrip(i: number, changes: Partial<Trip>) {
    update({ trips: draft.trips.map((t, n) => (n === i ? { ...t, ...changes } : t)) });
  }

  async function finish(status: MissionStatus) {
    setSaving(true);
    setError("");
    try {
      const store = storeFor(account);
      const dayHours = air?.hours.filter((h) => h.time.startsWith(date)) ?? [];
      const now = nowIST().date;
      // A late fill is judged on that day's air, not today's.
      const dayEnd = air ? air.hours.findIndex((h) => h.time === `${date}T23:00`) : -1;
      const aqi = date === now ? air?.aqi ?? null : air && dayEnd >= 0 ? headlineAqi(air.hours, dayEnd)?.aqi ?? null : null;
      const built = buildCheckin(draft, setup, date, dayHours, aqi, status, currentCalibration(bills, checkins, setup));
      await store.saveCheckin(built);
      const all = [...checkins.filter((c) => c.date !== date), built];
      const earned = await store.getXpKinds();
      await store.addXp([...xpForCheckin(built, checkins), ...challengeXp(setup, all, now, earned)]);
      if (mission && status) await store.saveMission({ ...mission, status });
      const dates = [...checkins.filter((c) => c.date !== date).map((c) => c.date), date];
      setDone({ checkin: built, streak: currentStreak(dates, now) });
      window.scrollTo(0, 0);
    } catch {
      setError(TEXT.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  function next() {
    if (index === steps.length - 1) finish(null);
    else {
      setIndex(index + 1);
      setOpenMeal(null);
      setOpenTrip(null);
      window.scrollTo(0, 0);
    }
  }

  function answerMission(status: MissionStatus) {
    setPicked(status);
    setTimeout(() => finish(status), 380);
  }

  if (done) {
    const copyDone = TEXT.done[mode];
    const safe = Math.floor(done.checkin.livesKept);
    return (
      <main className="screen ci-done halftone">
        {mode === "hero" && (
          <div className="ci-spider done" aria-hidden="true"><div className="ci-spider-bob"><span /><SpiderIcon /></div></div>
        )}
        <div className="screen-body">
          {copyDone.sticker && <p className="sticker">{copyDone.sticker}</p>}
          <h1 className="comic-title">{copyDone.title}</h1>
          {copyDone.intro && <p className="page-intro">{copyDone.intro}</p>}
          <div className="ci-streak">
            {mode === "plain" && <span className="ci-streak-tile" aria-hidden="true">🔥</span>}
            <div>
              <p className="ci-streak-count">{TEXT.streak(done.streak)}</p>
              <p className="ci-streak-sub">{copyDone.streakSub}</p>
            </div>
          </div>
          <div className="ci-recap">
            {copyDone.recapTag && <p className="recap-sticker">{copyDone.recapTag}</p>}
            <p className="recap-row"><span>{copyDone.footprint}</span><strong>≈ {totalKg(done.checkin.co2Breakdown).toFixed(1)} {TEXT.kgUnit}</strong></p>
            {mission && <p className="recap-row"><span>{copyDone.mission}</span><strong>{TEXT.missionAnswers[done.checkin.missionStatus ?? "no"]}</strong></p>}
          </div>
          <div className="ci-lives">
            <p className="ci-lives-head">
              <span className="ctag">{copyDone.livesTag}</span>
              <span className="ci-lives-count">{copyDone.kept(safe)}</span>
            </p>
            <div className="hearts">{Array.from({ length: 5 }, (_, i) => <Heart key={i} mode={mode} safe={i < safe} />)}</div>
            <p className="ci-lives-note">{copyDone.livesNote}</p>
          </div>
        </div>
        <footer className="screen-foot">
          <button type="button" className="cta" onClick={() => router.push("/app")}>{copyDone.button}</button>
        </footer>
      </main>
    );
  }

  const noTrips = step === "travel" && draft.trips.length === 0;
  return (
    <main className="screen ci halftone">
      {mode === "hero" && (
        <div key={step} className="ci-spider" aria-hidden="true"><div className="ci-spider-bob"><span /><SpiderIcon /></div></div>
      )}
      <header className="ci-head">
        <button
          type="button"
          className="back-btn"
          aria-label={index === 0 ? TEXT.close : TEXT.back}
          onClick={() => (index === 0 ? router.push("/app/checkin") : setIndex(index - 1))}
        >
          {mode === "hero" ? (
            index === 0 ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            ) : (
              <BackIcon />
            )
          ) : (
            <span className="ci-back-word">{index === 0 ? TEXT.close : `‹ ${TEXT.back}`}</span>
          )}
        </button>
        <p className="ci-title">{TEXT.title[mode]}</p>
        <p className="ci-count">{TEXT.count[mode](index + 1, steps.length, TEXT.stepNames[step])}</p>
      </header>
      <div className="ci-progress" aria-hidden="true">
        {steps.map((s, i) => <i key={s} className={i < index ? "done" : i === index ? "current" : ""} />)}
      </div>

      <div key={step} className="screen-body ci-body">
        {index === 0 && mode === "hero" && <p className="ci-intro">{TEXT.intro}</p>}
        <div className="ci-question">
          <span className="question-avatar" aria-hidden="true"><SpiderIcon /></span>
          <h1>{copy.question[mode]}</h1>
        </div>
        <p className="ci-hint">{noTrips ? copy.hintEmpty?.[mode] ?? copy.hint[mode] : copy.hint[mode]}</p>

        {step === "meals" && (
          <div className="ci-list">
            {draft.meals.map((meal, i) => (
              <div key={i} className="ci-row">
                <button type="button" className="ci-row-head" aria-expanded={openMeal === i} onClick={() => setOpenMeal(openMeal === i ? null : i)}>
                  <strong>{TEXT.mealNames[i] ?? TEXT.extraMeal}</strong>
                  <span className="ci-value">{TEXT.meals[meal]}</span>
                </button>
                {openMeal === i && (
                  <div className="ci-row-open">
                    <Chips
                      label={TEXT.mealNames[i] ?? TEXT.extraMeal}
                      options={MEALS.map((m): [Meal, string] => [m, TEXT.meals[m]])}
                      value={meal}
                      onChange={(value) => {
                        update({ meals: draft.meals.map((m, n) => (n === i ? value : m)) });
                        setOpenMeal(null);
                      }}
                    />
                    <p className="ci-note">{TEXT.dairyNote}</p>
                  </div>
                )}
              </div>
            ))}
            {draft.meals.length < MAX_MEALS && (
              <button type="button" className="ci-add" onClick={() => { update({ meals: [...draft.meals, "veg"] }); setOpenMeal(draft.meals.length); }}>
                {TEXT.addMeal[mode]}
              </button>
            )}
          </div>
        )}

        {step === "travel" && (
          <div className="ci-list">
            {draft.trips.length === 0 && <p className="ci-empty">{TEXT.noTrips[mode]}</p>}
            {draft.trips.map((trip, i) => {
              const km = Math.round((trip.minutes / 60) * SPEED_KMH[trip.mode]);
              return (
                <div key={i} className="ci-trip">
                  <div className="ci-trip-head">
                    <button type="button" className="ci-trip-main" aria-expanded={openTrip === i} onClick={() => setOpenTrip(openTrip === i ? null : i)}>
                      <small>{TEXT.tripWhen[i] ?? TEXT.tripExtra}</small>
                      <strong>{TEXT.tripTitle(trip.mode, i, setup)}</strong>
                      <span>{TEXT.tripMeta(Math.round(trip.minutes), km)}</span>
                    </button>
                    <button type="button" className="ci-remove" aria-label={TEXT.removeTrip} onClick={() => { update({ trips: draft.trips.filter((_, n) => n !== i) }); setOpenTrip(null); }}>✕</button>
                  </div>
                  {openTrip === i && (
                    <div className="ci-row-open">
                      <Chips
                        label={TEXT.tripMode}
                        options={MODES.map((m): [TravelMode, string] => [m, OPTIONS.mode[m]])}
                        value={trip.mode}
                        onChange={(value) => setTrip(i, { mode: value })}
                      />
                      {(trip.mode === "cab" || trip.mode === "car") && (
                        <Chips
                          className="ci-shared"
                          label={TEXT.shared}
                          options={[["alone", TEXT.alone], ["shared", TEXT.shared]]}
                          value={trip.shared ? "shared" : "alone"}
                          onChange={(value) => setTrip(i, { shared: value === "shared" })}
                        />
                      )}
                      <p className="ci-section-label">{TEXT.howLong(Math.round(trip.minutes))}</p>
                      <input
                        type="range"
                        min={5}
                        max={120}
                        step={5}
                        value={Math.round(trip.minutes / 5) * 5}
                        aria-label={TEXT.howLong(Math.round(trip.minutes))}
                        style={{ "--fill": `${((trip.minutes - 5) / 115) * 100}%` } as React.CSSProperties}
                        onChange={(e) => setTrip(i, { minutes: Number(e.target.value) })}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {draft.trips.length < MAX_TRIPS && (
              <button type="button" className="ci-add" onClick={() => {
                const usual = setup.trip.kind === "wfh" ? "metro" : setup.trip.mode;
                update({ trips: [...draft.trips, { mode: usual, minutes: 30 }] });
                setOpenTrip(draft.trips.length);
              }}>
                {TEXT.addTrip[mode]}
              </button>
            )}
          </div>
        )}

        {step === "energy" && (
          <div className="ci-list">
            <div className="ci-card">
              {winter ? (
                <>
                  <RangeRow label={TEXT.heater} value={draft.energy.heaterHours} max={12} unit={TEXT.hoursUnit} onChange={(heaterHours) => update({ energy: { ...draft.energy, heaterHours } })} />
                  <p className="ci-section-label">{TEXT.geyser}</p>
                  <Chips
                    className="ci-three"
                    label={TEXT.geyser}
                    options={[["no", TEXT.geyserOptions.no], ["short", TEXT.geyserOptions.short], ["long", TEXT.geyserOptions.long]]}
                    value={draft.energy.geyser}
                    onChange={(geyser) => update({ energy: { ...draft.energy, geyser } })}
                  />
                </>
              ) : (
                <>
                  <RangeRow label={TEXT.acDay} value={draft.energy.acDayHours} max={12} unit={TEXT.hoursUnit} onChange={(acDayHours) => update({ energy: { ...draft.energy, acDayHours } })} />
                  <p className="ci-section-label">{TEXT.acNight}</p>
                  <Chips
                    className="ci-three"
                    label={TEXT.acNight}
                    options={[["off", TEXT.acNightOptions.off], ["part", TEXT.acNightOptions.part], ["whole", TEXT.acNightOptions.whole]]}
                    value={draft.energy.acNight}
                    onChange={(acNight) => update({ energy: { ...draft.energy, acNight } })}
                  />
                </>
              )}
            </div>
            <p className="ci-note">{winter ? TEXT.winterFoot : TEXT.summerFoot[mode]}</p>
          </div>
        )}

        {step === "deliveries" && (
          <ul className="ci-list ci-counters">
            <Counter title={TEXT.foodOrders} sub={TEXT.foodSub} value={draft.deliveries.food} onChange={(food) => update({ deliveries: { ...draft.deliveries, food } })} />
            <Counter title={TEXT.groceries} sub={TEXT.groceriesSub} value={draft.deliveries.grocery} onChange={(grocery) => update({ deliveries: { ...draft.deliveries, grocery } })} />
            <Counter title={TEXT.parcels} sub={TEXT.parcelsSub} value={draft.deliveries.parcel} onChange={(parcel) => update({ deliveries: { ...draft.deliveries, parcel } })} />
          </ul>
        )}

        {step === "outdoors" && (
          <div className="ci-list ci-blocks" role="group" aria-label={copy.question[mode]}>
            {BLOCKS.map((block) => {
              const on = draft.outdoorBlocks.includes(block);
              const category = blockCategory(block, air, date);
              return (
                <button
                  key={block}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  className="ci-block"
                  onClick={() => update({ outdoorBlocks: on ? draft.outdoorBlocks.filter((b) => b !== block) : [...draft.outdoorBlocks, block] })}
                >
                  <span className="choice-radio">{on && "✓"}</span>
                  <span className="ci-block-name">{OPTIONS.outdoor[block]}</span>
                  {category && <em className={`ci-aqi level-${category.replace(" ", "-").toLowerCase()}`}>{category}</em>}
                </button>
              );
            })}
          </div>
        )}

        {step === "mission" && missionData && (
          <div className="ci-list">
            <div className="ci-mission-card">
              {mode === "plain" && <p className="ci-section-label">{TEXT.tipLabel}</p>}
              <p className="ci-mission-text">{missionData.text(context)}</p>
              <p className="ci-mission-worth">{TEXT.worth[mode](mission!.savedKg, mission!.savedInr)}</p>
            </div>
            <div className="ci-answers">
              {(["yes", "partly", "no"] as const).map((answer) => (
                <button
                  key={answer}
                  type="button"
                  disabled={saving || picked !== null}
                  className={`ci-answer ans-${answer} ${picked === answer ? "picked" : ""}`}
                  onClick={() => answerMission(answer)}
                >
                  {TEXT.missionAnswers[answer]}
                </button>
              ))}
            </div>
          </div>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>

      {step !== "mission" && (
        <footer className="screen-foot">
          <button type="button" className="cta" disabled={saving} onClick={next}>
            {noTrips ? TEXT.noTripsButton[mode] : TEXT.looksRight[mode]}
          </button>
        </footer>
      )}
    </main>
  );
}
