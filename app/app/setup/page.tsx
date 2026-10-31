"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackIcon, CameraIcon, CheckIcon, CornerWeb, PinIcon, SpiderIcon } from "@/components/art";
import { Choice, FieldLabel, MultiChoice, optionsOf, PetRow, Stepper } from "@/components/setup-controls";
import { ROAD_DISTANCE_FACTOR } from "@/lib/factors";
import { FINISH, OPTIONS, SECTION_NAMES, SETUP_TEXT as TEXT, STEP_COPY } from "@/lib/labels";
import {
  AREAS,
  EMPTY_DRAFT,
  finalizeSetup,
  isStepComplete,
  progressFill,
  recapLines,
  stepPosition,
  toggleExclusive,
  visibleSteps,
  type SetupDraft,
  type StepId,
} from "@/lib/setup";
import { getAccount, storeFor, type Account } from "@/lib/storage";
import { ThemeRoot, useMode } from "@/lib/theme";
import type { SetupAnswers } from "@/lib/types";

const DRAFT_KEY = "edith.setupDraft";

interface SavedDraft {
  draft: SetupDraft;
  step: StepId;
}

function loadDraft(): SavedDraft {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null") as SavedDraft | null;
    if (saved) return { draft: { ...EMPTY_DRAFT, ...saved.draft }, step: saved.step };
  } catch {
    // Start again if the saved draft can't be read
  }
  return { draft: EMPTY_DRAFT, step: "location" };
}

async function geocode(name: string) {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&countryCode=IN`,
  );
  if (!response.ok) throw new Error("Geocoding failed");
  const data = (await response.json()) as {
    results?: { name: string; admin1?: string; latitude: number; longitude: number }[];
  };
  return data.results ?? [];
}

function straightLineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

interface StepProps {
  draft: SetupDraft;
  update: (changes: Partial<SetupDraft>) => void;
}

function LocationStep({ draft, update }: StepProps) {
  const [other, setOther] = useState(
    Boolean(draft.location && !AREAS.some((a) => a.area === draft.location!.area)),
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof geocode>>>([]);
  const [message, setMessage] = useState("");
  const usingDevice = draft.location?.area === TEXT.locationFound;

  function useDevice() {
    setMessage("");
    if (!navigator.geolocation) return setMessage(TEXT.locationFailed);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setOther(false);
        update({ location: { area: TEXT.locationFound, lat: coords.latitude, lng: coords.longitude } });
      },
      () => setMessage(TEXT.locationFailed),
    );
  }

  async function search(event: React.FormEvent) {
    event.preventDefault();
    const name = query.trim();
    if (!name) return;
    setMessage("");
    try {
      const found = await geocode(name);
      setResults(found);
      if (found.length === 0) setMessage(TEXT.otherNone);
    } catch {
      // Keep the flow moving: lat and lng stay empty, which means Delhi's air later on.
      setMessage(TEXT.otherOffline);
      update({ location: { area: name, lat: null, lng: null } });
    }
  }

  const selected = other ? "other" : (draft.location?.area ?? null);
  return (
    <>
      <button type="button" className="wide-btn" aria-pressed={usingDevice} onClick={useDevice}>
        {usingDevice ? <CheckIcon /> : <PinIcon />}
        {usingDevice ? TEXT.locationFound : TEXT.useLocation.hero}
      </button>
      <FieldLabel>{TEXT.pickArea}</FieldLabel>
      <Choice
        label={TEXT.pickArea}
        value={selected}
        options={[...AREAS.map((a): [string, string] => [a.area, a.area]), ["other", "Other"]]}
        onChange={(key) => {
          setMessage("");
          const area = AREAS.find((a) => a.area === key);
          setOther(!area);
          update({ location: area ?? null });
        }}
      />
      {other && (
        <form className="other-search" onSubmit={search}>
          <input
            className="text-input"
            value={query}
            placeholder={TEXT.otherPlaceholder}
            aria-label={TEXT.otherPlaceholder}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="small-btn">{TEXT.otherSearch}</button>
        </form>
      )}
      {other && results.length > 0 && (
        <Choice
          label={TEXT.otherPlaceholder}
          value={draft.location?.area ?? null}
          options={results.map((r): [string, string] => [r.name, r.admin1 ? `${r.name}, ${r.admin1}` : r.name])}
          onChange={(name) => {
            const r = results.find((x) => x.name === name)!;
            update({ location: { area: r.name, lat: r.latitude, lng: r.longitude } });
          }}
        />
      )}
      {message && <p className="form-error" role="alert">{message}</p>}
    </>
  );
}

function DistanceStep({ draft, update }: StepProps) {
  const [message, setMessage] = useState("");

  async function measure() {
    const address = draft.address.trim();
    setMessage("");
    if (!address) return;
    const base = draft.location;
    if (base?.lat == null || base.lng == null) return setMessage(TEXT.addressNeedsBase);
    try {
      const [place] = await geocode(address);
      if (!place) return setMessage(TEXT.addressFailed);
      const km = straightLineKm(base.lat, base.lng, place.latitude, place.longitude) * ROAD_DISTANCE_FACTOR;
      const rounded = Math.min(40, Math.max(1, Math.round(km)));
      update({ kmOneWay: rounded });
      setMessage(TEXT.addressFound(rounded));
    } catch {
      setMessage(TEXT.addressFailed);
    }
  }

  return (
    <>
      <div className="distance-card">
        <p className="distance-value">
          <strong>{draft.kmOneWay}</strong> <span>{TEXT.kmOneWay}</span>
        </p>
        <input
          type="range"
          min={1}
          max={40}
          value={draft.kmOneWay}
          aria-label={TEXT.kmOneWay}
          style={{ "--fill": `${((draft.kmOneWay - 1) / 39) * 100}%` } as React.CSSProperties}
          onChange={(e) => update({ kmOneWay: Number(e.target.value) })}
        />
        <p className="range-ends"><span>1 km</span><span>40 km</span></p>
      </div>
      <FieldLabel>{TEXT.address}</FieldLabel>
      <input
        className="text-input"
        value={draft.address}
        placeholder={TEXT.addressPlaceholder}
        aria-label={TEXT.address}
        onChange={(e) => update({ address: e.target.value })}
        onBlur={measure}
      />
      {message && <p className="form-note" role="status">{message}</p>}
      <FieldLabel>{TEXT.daysWeek}</FieldLabel>
      <Choice
        layout="segments"
        label={TEXT.daysWeek}
        value={String(draft.daysPerWeek)}
        options={[1, 2, 3, 4, 5, 6, 7].map((n): [string, string] => [String(n), String(n)])}
        onChange={(day) => update({ daysPerWeek: Number(day) })}
      />
    </>
  );
}

function BillStep({ draft, update }: StepProps) {
  const [picked, setPicked] = useState(false);
  return (
    <>
      <label className="wide-btn">
        <CameraIcon />
        {TEXT.snap}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => setPicked(Boolean(e.target.files?.length))}
        />
      </label>
      {picked && <p className="form-note" role="status">{TEXT.snapSoon}</p>}
      <FieldLabel>{TEXT.noBill}</FieldLabel>
      <Choice
        label={TEXT.noBill}
        value={draft.billBand}
        options={optionsOf(OPTIONS.bill)}
        onChange={(billBand) => update({ billBand })}
      />
    </>
  );
}

function StepBody({ step, draft, update }: StepProps & { step: StepId }) {
  const mode = useMode();
  switch (step) {
    case "location":
      return <LocationStep draft={draft} update={update} />;
    case "home":
      return (
        <>
          <FieldLabel>{TEXT.whoLives}</FieldLabel>
          <Stepper value={draft.people} min={1} max={10} unit={TEXT.people} onChange={(people) => update({ people })} />
          <FieldLabel>{TEXT.homeType[mode]}</FieldLabel>
          <Choice
            layout="segments"
            label={TEXT.homeType[mode]}
            value={draft.homeType}
            options={optionsOf(OPTIONS.homeType)}
            onChange={(homeType) => update({ homeType })}
          />
          <FieldLabel>{TEXT.pets}</FieldLabel>
          <div className="pets">
            {optionsOf(OPTIONS.pets).map(([pet, label]) => (
              <PetRow
                key={pet}
                label={label}
                value={draft.pets[pet]}
                onChange={(count) => update({ pets: { ...draft.pets, [pet]: count } })}
              />
            ))}
          </div>
        </>
      );
    case "care":
      return (
        <>
          <MultiChoice
            label={STEP_COPY.care.title[mode]}
            options={optionsOf(OPTIONS.extraCare)}
            value={draft.extraCare}
            onToggle={(v) => update({ extraCare: toggleExclusive(draft.extraCare, v, "none") })}
          />
          <p className="hint">{TEXT.pickAll[mode]}</p>
        </>
      );
    case "trip":
      return (
        <Choice
          label={STEP_COPY.trip.title[mode]}
          value={draft.tripKind}
          options={optionsOf(OPTIONS.trip)}
          onChange={(tripKind) => update({ tripKind })}
        />
      );
    case "distance":
      return <DistanceStep draft={draft} update={update} />;
    case "mode":
      return (
        <Choice
          label={STEP_COPY.mode.title[mode]}
          value={draft.mode}
          options={optionsOf(OPTIONS.mode)}
          onChange={(value) => update({ mode: value })}
        />
      );
    case "fuel":
      return (
        <>
          <FieldLabel>{TEXT.fuelLabel}</FieldLabel>
          <Choice
            label={TEXT.fuelLabel}
            value={draft.fuel}
            options={optionsOf(OPTIONS.fuel)}
            onChange={(fuel) => update({ fuel })}
          />
          {draft.fuel !== "electric" && (
            <>
              <FieldLabel>{TEXT.mileage}</FieldLabel>
              <input
                className="text-input"
                inputMode="decimal"
                value={draft.mileage}
                placeholder={draft.mode === "car" ? "e.g. 15" : "e.g. 45"}
                aria-label={TEXT.mileage}
                onChange={(e) => update({ mileage: e.target.value })}
              />
            </>
          )}
        </>
      );
    case "outdoors":
      return (
        <>
          <MultiChoice
            label={STEP_COPY.outdoors.title[mode]}
            options={optionsOf(OPTIONS.outdoor)}
            value={draft.outdoor}
            onToggle={(v) => update({ outdoor: toggleExclusive(draft.outdoor, v, "indoors") })}
          />
          <p className="hint">{TEXT.pickAll[mode]}</p>
        </>
      );
    case "exercise":
      return (
        <Choice
          label={STEP_COPY.exercise.title[mode]}
          value={draft.exercise}
          options={optionsOf(OPTIONS.exercise)}
          onChange={(exercise) => update({ exercise })}
        />
      );
    case "acs":
      return (
        <>
          <Stepper value={draft.acs} min={0} max={10} unit={TEXT.acsUnit} onChange={(acs) => update({ acs })} />
          {draft.acs > 0 && (
            <>
              <FieldLabel>{TEXT.acHours}</FieldLabel>
              <Choice
                layout="segments"
                label={TEXT.acHours}
                value={draft.acHoursBand}
                options={optionsOf(OPTIONS.acHours)}
                onChange={(acHoursBand) => update({ acHoursBand })}
              />
            </>
          )}
        </>
      );
    case "cooking":
      return (
        <>
          <Choice
            label={STEP_COPY.cooking.title[mode]}
            value={draft.cooking}
            options={optionsOf(OPTIONS.cooking)}
            onChange={(cooking) => update({ cooking })}
          />
          {draft.cooking === "lpg" && (
            <>
              <FieldLabel>{TEXT.cylinder}</FieldLabel>
              <Choice
                layout="segments"
                label={TEXT.cylinder}
                value={draft.cylinderLasts}
                options={optionsOf(OPTIONS.cylinder)}
                onChange={(cylinderLasts) => update({ cylinderLasts })}
              />
            </>
          )}
        </>
      );
    case "purifier":
      return (
        <Choice
          label={STEP_COPY.purifier.title[mode]}
          value={draft.purifier}
          options={optionsOf(OPTIONS.purifier)}
          onChange={(purifier) => update({ purifier })}
        />
      );
    case "bill":
      return <BillStep draft={draft} update={update} />;
    case "diet":
      return (
        <>
          <Choice
            label={STEP_COPY.diet.title[mode]}
            value={draft.diet}
            options={optionsOf(OPTIONS.diet)}
            onChange={(diet) => update({ diet })}
          />
          {draft.diet === "non-veg" && (
            <>
              <FieldLabel>{TEXT.howOften}</FieldLabel>
              <Choice
                layout="segments"
                label={TEXT.howOften}
                value={draft.nonVegFrequency}
                options={optionsOf(OPTIONS.frequency)}
                onChange={(nonVegFrequency) => update({ nonVegFrequency })}
              />
            </>
          )}
        </>
      );
    case "orders":
      return (
        <Choice
          layout="segments"
          label={STEP_COPY.orders.title[mode]}
          value={draft.ordersPerWeek}
          options={optionsOf(OPTIONS.orders)}
          onChange={(ordersPerWeek) => update({ ordersPerWeek })}
        />
      );
    case "flights":
      return (
        <>
          <FieldLabel>{TEXT.domestic}</FieldLabel>
          <Choice
            layout="segments"
            label={TEXT.domestic}
            value={draft.domestic}
            options={optionsOf(OPTIONS.domestic).sort(byBand)}
            onChange={(domestic) => update({ domestic })}
          />
          <FieldLabel>{TEXT.international}</FieldLabel>
          <Choice
            layout="segments"
            label={TEXT.international}
            value={draft.international}
            options={optionsOf(OPTIONS.international).sort(byBand)}
            onChange={(international) => update({ international })}
          />
        </>
      );
  }
}

// JavaScript lists number-like keys ("0", "1") before others, so put the bands back in order.
function byBand(a: [string, string], b: [string, string]) {
  return parseInt(a[0]) - parseInt(b[0]);
}

function Finish({ answers, onEnter }: { answers: SetupAnswers; onEnter: () => void }) {
  const mode = useMode();
  const copy = FINISH[mode];
  const lines = recapLines(answers, mode);
  const [ticked, setTicked] = useState(0);

  useEffect(() => {
    if (ticked >= copy.ready.length) return;
    const timer = setTimeout(() => setTicked(ticked + 1), 500);
    return () => clearTimeout(timer);
  }, [ticked, copy.ready.length]);

  return (
    <main className="screen finish halftone">
      <CornerWeb />
      <div className="screen-body">
        {mode === "hero" ? (
          <p className="sticker">{copy.sticker}</p>
        ) : (
          <span className="finish-check"><CheckIcon size={26} /></span>
        )}
        <h1 className="comic-title">{copy.title}</h1>
        <p className="page-intro">{copy.intro}</p>
        <div className="recap">
          {copy.cardSticker && <p className="recap-sticker">{copy.cardSticker}</p>}
          {copy.rows.map((row, i) => (
            <p key={row} className="recap-row">
              <span>{row}</span>
              <strong>{lines[i]}</strong>
            </p>
          ))}
        </div>
        {copy.note && <p className="hint">{copy.note}</p>}
        <p className="ready-title">{copy.readyTitle}</p>
        <ul className="ready">
          {copy.ready.map((line, i) => (
            <li key={line} className={i < ticked ? "done" : ""}>
              <span className="ready-box">{i < ticked && <CheckIcon size={12} />}</span>
              {line}
            </li>
          ))}
        </ul>
      </div>
      <footer className="screen-foot">
        <button type="button" className="cta" onClick={onEnter}>{copy.button}</button>
      </footer>
    </main>
  );
}

export default function Setup() {
  const router = useRouter();
  const mode = useMode();
  const [account, setAccount] = useState<Account | null>(null);
  const [{ draft, step }, setState] = useState<SavedDraft>(loadDraft);
  const [answers, setAnswers] = useState<SetupAnswers | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getAccount().then((found) => {
      if (found) setAccount(found);
      else router.replace("/app/sign-in");
    });
  }, [router]);

  useEffect(() => {
    if (!answers) localStorage.setItem(DRAFT_KEY, JSON.stringify({ draft, step }));
  }, [draft, step, answers]);

  if (answers) {
    return (
      <ThemeRoot>
        <Finish answers={answers} onEnter={() => router.replace("/app")} />
      </ThemeRoot>
    );
  }

  const steps = visibleSteps(draft);
  const index = steps.indexOf(step);
  const position = stepPosition(step, draft);
  const fills = progressFill(step, draft);
  const copy = STEP_COPY[step];
  const isLast = index === steps.length - 1;
  const hasWebBack = mode === "hero" || index > 0;

  function update(changes: Partial<SetupDraft>) {
    setState((current) => ({ ...current, draft: { ...current.draft, ...changes } }));
  }

  function go(to: StepId) {
    setState((current) => ({ ...current, step: to }));
    window.scrollTo(0, 0);
  }

  function back() {
    if (index === 0) router.push("/app/style");
    else go(steps[index - 1]);
  }

  async function finish(final: SetupDraft) {
    if (!account) return;
    setSaving(true);
    setError("");
    try {
      const result = finalizeSetup(final);
      const store = storeFor(account);
      await store.saveSetup(result);
      await store.saveProfile({ mode, onboarded: true });
      localStorage.removeItem(DRAFT_KEY);
      setAnswers(result);
    } catch {
      setError(TEXT.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  function next() {
    if (isLast) finish(draft);
    else go(steps[index + 1]);
  }

  function later() {
    update({ billBand: null });
    go(steps[index + 1]);
  }

  const sectionName = SECTION_NAMES[position.section][mode];
  const progressText = (mode === "hero" ? TEXT.progressHero : TEXT.progressPlain)(
    position.step,
    position.total,
    position.seconds,
  );

  return (
    <ThemeRoot>
      <main className="screen setup halftone">
        <CornerWeb />
        <header className="setup-head">
          {hasWebBack ? (
            <button type="button" className="back-btn" aria-label={TEXT.back} onClick={back}>
              <BackIcon />
              <span className="back-word">{TEXT.back}</span>
            </button>
          ) : (
            <span />
          )}
          <p className="sticker setup-section">
            <span className="issue-word">{TEXT.issue} #{position.sectionIndex + 1} · </span>
            {sectionName}
          </p>
          {step === "bill" ? (
            <button type="button" className="later-btn" onClick={later}>{TEXT.later}</button>
          ) : (
            <span />
          )}
        </header>

        <div className="progress" aria-hidden="true">
          {fills.map((fill, i) => (
            <span key={i}><i style={{ width: `${fill * 100}%` }} /></span>
          ))}
        </div>

        <div className="screen-body">
          <p className="progress-text">{progressText}</p>

          <div className="question">
            <span className="question-avatar" aria-hidden="true"><SpiderIcon /></span>
            <div className="question-text">
              <h1 className="question-title">{copy.title[mode]}</h1>
            </div>
          </div>
          <div className="why">
            <p className="why-label">{TEXT.whyWeAsk}</p>
            <p>{copy.why[mode]}</p>
          </div>

          <div className="answers">
            <StepBody step={step} draft={draft} update={update} />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>

        <footer className="screen-foot">
          <button type="button" className="cta" disabled={!isStepComplete(step, draft) || saving} onClick={next}>
            {isLast ? TEXT.finish : TEXT.next[mode]}
          </button>
        </footer>
      </main>
    </ThemeRoot>
  );
}
