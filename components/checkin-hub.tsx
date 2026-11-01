"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isDiwaliSeason } from "@/config/diwali";
import { oneOffKg, type OneOffInput } from "@/lib/checkin";
import { totalKg } from "@/lib/footprint";
import { addDays } from "@/lib/family";
import { HUB_TEXT as TEXT, LABELS } from "@/lib/labels";
import { canFillLate, currentStreak } from "@/lib/progress";
import { getAccount, storeFor, type Account } from "@/lib/storage";
import { nowIST } from "@/lib/time";
import { useMode } from "@/lib/theme";
import type { Bill, Checkin, OneOff } from "@/lib/types";
import { AppShell } from "./app-shell";
import { BillCapture } from "./bill-capture";

type Kind = OneOffInput["kind"];

function Chips<T extends string>({ label, options, value, onChange }: { label: string; options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="ci-chips" role="radiogroup" aria-label={label}>
      {options.map(([key, text]) => (
        <button key={key} type="button" role="radio" aria-checked={value === key} className="ci-chip" onClick={() => onChange(key)}>
          {text}
        </button>
      ))}
    </div>
  );
}

function OneOffSheet({ today, onSave, onClose }: { today: string; onSave: (o: OneOff) => Promise<void>; onClose: () => void }) {
  const mode = useMode();
  const [kind, setKind] = useState<Kind>("flight");
  const [route, setRoute] = useState<"domestic" | "international">("domestic");
  const [trip, setTrip] = useState<"one-way" | "return">("return");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [travel, setTravel] = useState<"train" | "bus">("train");
  const [km, setKm] = useState("");
  const [size, setSize] = useState<"small" | "medium" | "large">("small");
  const [people, setPeople] = useState(4);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const kinds = (Object.entries(TEXT.kinds) as [Kind, string][]).filter(([k]) => k !== "crackers" || isDiwaliSeason(today));

  async function save() {
    let input: OneOffInput;
    if (kind === "flight") input = { kind, route, trip };
    else if (kind === "long-trip") {
      const distance = Number(km);
      if (!(distance > 0 && distance <= 5000)) return setError(TEXT.badKm);
      input = { kind, mode: travel, km: distance };
    } else if (kind === "purchase") input = { kind, size };
    else if (kind === "guests") input = { kind, people };
    else input = { kind };

    const details: Record<string, unknown> = { ...input };
    delete details.kind;
    setSaving(true);
    try {
      await onSave({
        date: today,
        kind,
        details: kind === "flight" ? { ...details, from: from.trim(), to: to.trim() } : details,
        co2Kg: oneOffKg(input),
      });
      onClose();
    } catch {
      setError(TEXT.saveFailed);
      setSaving(false);
    }
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <section className="diwali-sheet family-sheet" role="dialog" aria-modal="true" aria-label={TEXT.oneOffTitle[mode]} onClick={(e) => e.stopPropagation()}>
        <span className="sheet-handle" aria-hidden="true" />
        <header className="sheet-head">
          <h2>{TEXT.oneOffTitle[mode]}</h2>
          <button type="button" className="sheet-close" aria-label={TEXT.close} onClick={onClose}>✕</button>
        </header>
        <div className="sheet-body">
          <Chips label={TEXT.oneOffTitle[mode]} options={kinds} value={kind} onChange={(k) => { setKind(k); setError(""); }} />
          {kind === "flight" && (
            <>
              <input className="text-input" value={from} placeholder={TEXT.from} aria-label={TEXT.from} onChange={(e) => setFrom(e.target.value)} />
              <input className="text-input" value={to} placeholder={TEXT.to} aria-label={TEXT.to} onChange={(e) => setTo(e.target.value)} />
              <Chips label={TEXT.route} options={[["domestic", TEXT.domestic], ["international", TEXT.international]]} value={route} onChange={setRoute} />
              <Chips label={TEXT.tripType} options={[["return", TEXT.returnTrip], ["one-way", TEXT.oneWay]]} value={trip} onChange={setTrip} />
            </>
          )}
          {kind === "long-trip" && (
            <>
              <Chips label={TEXT.tripType} options={[["train", TEXT.train], ["bus", TEXT.bus]]} value={travel} onChange={setTravel} />
              <input className="text-input" inputMode="numeric" value={km} placeholder={TEXT.kmPlaceholder} aria-label={TEXT.kmPlaceholder} onChange={(e) => setKm(e.target.value)} />
            </>
          )}
          {kind === "purchase" && (
            <Chips label={TEXT.kinds.purchase} options={[["small", TEXT.sizes.small], ["medium", TEXT.sizes.medium], ["large", TEXT.sizes.large]]} value={size} onChange={setSize} />
          )}
          {kind === "guests" && (
            <div className="ci-counter">
              <span><strong>{TEXT.guestCount}</strong></span>
              <div className="ci-counter-controls">
                <button type="button" aria-label={TEXT.fewerGuests} disabled={people <= 1} onClick={() => setPeople(people - 1)}>−</button>
                <b aria-live="polite">{people}</b>
                <button type="button" className="plus" aria-label={TEXT.moreGuests} disabled={people >= 50} onClick={() => setPeople(people + 1)}>+</button>
              </div>
            </div>
          )}
          <p className="sheet-note">{TEXT.estimateNote}</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="button" className="cta" disabled={saving} onClick={save}>{TEXT.save}</button>
        </div>
      </section>
    </div>
  );
}

export function CheckinHub() {
  const router = useRouter();
  const mode = useMode();
  const today = useMemo(() => nowIST().date, []);
  const [account, setAccount] = useState<Account | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [oneOffs, setOneOffs] = useState<OneOff[]>([]);
  const [bills, setBills] = useState<Bill[] | null>(null);
  const [sheet, setSheet] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    async function load() {
      const found = await getAccount();
      if (!found) return router.replace("/app/sign-in");
      const store = storeFor(found);
      if (!(await store.getSetup())) return router.replace("/app/style");
      setAccount(found);
      const [c, o, b] = await Promise.all([store.getCheckins(), store.getOneOffs(), store.getBills()]);
      setCheckins(c);
      setOneOffs(o);
      setBills(b);
    }
    load().catch(() => setFailed(true));
  }, [router]);

  const todayCheckin = checkins.find((c) => c.date === today);
  const streak = currentStreak(checkins.map((c) => c.date), today);
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const month = today.slice(0, 7);
  const lastMonth = addDays(`${month}-01`, -1).slice(0, 7);
  const recent = oneOffs.filter((o) => o.date.startsWith(month));
  const billDone = bills?.some((b) => b.periodEnd.slice(0, 7) >= lastMonth);

  async function saveOneOff(oneOff: OneOff) {
    await storeFor(account!).saveOneOff(oneOff);
    setOneOffs([...oneOffs, oneOff]);
  }

  return (
    <AppShell active="checkin">
      <main className="screen hub halftone">
        <header className="page-head">
          <h1>{LABELS.checkinTab[mode]}</h1>
        </header>
        {failed && <p className="form-error ranks-error" role="alert">{TEXT.loadFailed}</p>}

        <section className="card hub-today">
          <p className="ctag">{TEXT.todayTag}</p>
          {todayCheckin ? (
            <>
              <p className="hub-status">{TEXT.doneToday[mode]}</p>
              <p className="hub-sub">{TEXT.doneLine(totalKg(todayCheckin.co2Breakdown).toFixed(1), Math.floor(todayCheckin.livesKept), streak)}</p>
              <Link href="/app/checkin?start=1" className="hub-edit">{TEXT.edit}</Link>
            </>
          ) : (
            <>
              <p className="hub-status">{TEXT.notYet[mode]}</p>
              <p className="hub-sub">{TEXT.notYetLine(streak)}</p>
              <Link href="/app/checkin?start=1" className="cta home-cta">{TEXT.start[mode]}</Link>
            </>
          )}
        </section>

        <section className="card hub-week">
          <p className="ctag">{TEXT.weekTag}</p>
          <div className="hub-days">
            {week.map((date) => {
              const done = checkins.some((c) => c.date === date);
              const missed = !done && date !== today;
              const fillable = missed && canFillLate(date, today);
              const name = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" });
              const state = done ? "done" : date === today ? "waiting" : fillable ? "fill" : "missed";
              return fillable ? (
                <Link key={date} href={`/app/checkin?date=${date}`} className="hub-day" aria-label={TEXT.fillDay(name)}>
                  <i className={state}>+</i>
                  <small>{name}</small>
                </Link>
              ) : (
                <span key={date} className="hub-day">
                  <i className={state}>{done ? "✓" : ""}</i>
                  <small>{name}</small>
                </span>
              );
            })}
          </div>
          <p className="hub-sub">{TEXT.lateNote}</p>
        </section>

        <section className="card hub-oneoff">
          <p className="ctag">{TEXT.oneOffTitle[mode]}</p>
          {recent.length > 0 ? (
            <ul className="hub-list">
              {recent.map((o, i) => (
                <li key={`${o.date}-${i}`}>
                  <span>{TEXT.kinds[o.kind]}</span>
                  <b>{Math.round(o.co2Kg)} kg</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hub-sub">{TEXT.oneOffLine}</p>
          )}
          <button type="button" className="ci-add" onClick={() => setSheet(true)}>{TEXT.addOneOff}</button>
        </section>

        {account && bills !== null && !billDone && (
          <BillCapture account={account} month={lastMonth} className="home-bill fp-bill" />
        )}
        {billDone && <p className="hub-bill-done" role="status">{TEXT.billDone}</p>}

        {sheet && <OneOffSheet today={today} onSave={saveOneOff} onClose={() => setSheet(false)} />}
      </main>
    </AppShell>
  );
}
