"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MissionContext } from "@/config/missions";
import { AVERAGE_INDIAN_KG_PER_YEAR, TREE_KG_PER_YEAR } from "@/lib/factors";
import { estimatedMonthUnits } from "@/lib/checkin";
import { lastSixMonths, shiftMonth, sourceRows, sumBreakdowns, topCuts, yearlyPace } from "@/lib/collateral";
import { isWinter, monthToDate, sameDateLastMonth, totalKg } from "@/lib/footprint";
import { missionKey } from "@/lib/home";
import { FOOTPRINT_TEXT as TEXT, LABELS } from "@/lib/labels";
import { getAccount, storeFor, type Account } from "@/lib/storage";
import { nowIST } from "@/lib/time";
import { useMode } from "@/lib/theme";
import type { Bill, Checkin, OneOff, SetupAnswers } from "@/lib/types";
import { AppShell } from "./app-shell";
import { BillCapture } from "./bill-capture";

interface Data {
  account: Account;
  setup: SetupAnswers;
  checkins: Checkin[];
  oneOffs: OneOff[];
  bills: Bill[];
}

export function FootprintScreen() {
  const router = useRouter();
  const mode = useMode();
  const today = useMemo(() => nowIST().date, []);
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<"month" | "six">("month");
  const [chosen, setChosen] = useState<string | null>(null);
  const [howOpen, setHowOpen] = useState(false);
  // Decided once on load, so the card stays up to show its confirmation after a bill is saved.
  const [billDue, setBillDue] = useState(false);

  useEffect(() => {
    async function load() {
      const account = await getAccount();
      if (!account) return router.replace("/app/sign-in");
      const store = storeFor(account);
      const [setup, checkins, oneOffs, bills] = await Promise.all([store.getSetup(), store.getCheckins(), store.getOneOffs(), store.getBills()]);
      if (!setup) return router.replace("/app/style");
      setData({ account, setup, checkins, oneOffs, bills });
      setBillDue(!bills.some((b) => b.periodEnd.slice(0, 7) >= shiftMonth(today.slice(0, 7), -1)));
      setChosen(localStorage.getItem(missionKey(today)));
    }
    load().catch(() => setFailed(true));
  }, [router, today]);

  if (!data) {
    return (
      <AppShell active="footprint">
        <main className="screen fp halftone">
          <header className="page-head"><h1>{LABELS.footprintTab[mode]}</h1></header>
          {failed && <p className="form-error ranks-error" role="alert">{TEXT.loadFailed}</p>}
        </main>
      </AppShell>
    );
  }

  const { account, setup, checkins, oneOffs, bills } = data;
  const thisMonth = today.slice(0, 7);
  const result = monthToDate(today, checkins, oneOffs, bills, setup);
  const previousDate = sameDateLastMonth(today);
  const hadLastMonth = checkins.some((c) => c.date.startsWith(previousDate.slice(0, 7)));
  const previous = hadLastMonth ? totalKg(monthToDate(previousDate, checkins, oneOffs, bills, setup).breakdown) : null;
  const kg = totalKg(result.breakdown);
  const months = lastSixMonths(today, checkins, oneOffs, bills, setup);
  const sixTotal = months.reduce((sum, m) => sum + m.kg, 0);
  const monthsLogged = months.filter((m) => m.logged).length;
  const billMonths = months.filter((m) => m.fromBill).length;
  const breakdown = view === "month" ? result.breakdown : sumBreakdowns(today, checkins, oneOffs, bills, setup);
  const rows = sourceRows(breakdown);
  const biggest = rows.find((r) => r.biggest);
  const context: MissionContext = {
    setup,
    winter: isWinter(today),
    lastEnergy: [...checkins].sort((a, b) => b.date.localeCompare(a.date))[0]?.energy,
  };
  const cuts = topCuts(context);
  const pace = yearlyPace(today, checkins, kg);
  const saved = previous !== null ? previous - kg : 0;
  const lastMonth = shiftMonth(thisMonth, -1);
  const firstMonth = monthsLogged <= 1;
  const barMax = Math.max(...months.map((m) => m.kg), 1);

  async function makeMission(id: string, savedKg: number, savedInr: number) {
    const unset = chosen === id;
    if (unset) localStorage.removeItem(missionKey(today));
    else localStorage.setItem(missionKey(today), id);
    setChosen(unset ? null : id);
    await storeFor(account).saveMission({ date: today, missionId: id, accepted: !unset, savedKg, savedInr }).catch(() => {});
  }

  const electricityTag =
    view === "six"
      ? billMonths > 0 ? TEXT.fromBills(billMonths, monthsLogged) : TEXT.estimated
      : result.electricitySource === "bill" ? TEXT.fromBill : TEXT.estimated;

  return (
    <AppShell active="footprint">
      <main className="screen fp halftone">
        <header className="page-head">
          <h1>{LABELS.footprintTab[mode]}</h1>
          {mode === "hero" && <p>{TEXT.subtitle}</p>}
        </header>

        {mode === "plain" && (
          <div className="fp-switch" role="radiogroup" aria-label={TEXT.viewLabel}>
            <button type="button" role="radio" aria-checked={view === "month"} onClick={() => setView("month")}>{TEXT.thisMonth}</button>
            <button type="button" role="radio" aria-checked={view === "six"} onClick={() => setView("six")}>{TEXT.sixMonths}</button>
          </div>
        )}

        <section className="card fp-total">
          {mode === "hero" && (
            <div className="fp-switch" role="radiogroup" aria-label={TEXT.viewLabel}>
              <button type="button" role="radio" aria-checked={view === "month"} onClick={() => setView("month")}>{TEXT.thisMonth}</button>
              <button type="button" role="radio" aria-checked={view === "six"} onClick={() => setView("six")}>{TEXT.sixMonths}</button>
            </div>
          )}
          <div className="fp-number">
            <strong>{Math.round(view === "month" ? kg : sixTotal).toLocaleString("en-IN")}</strong>
            <span>{view === "month" ? TEXT.soFar : TEXT.lastSix}</span>
          </div>
          {view === "six" ? (
            <p className="fp-note">{monthsLogged > 0 ? TEXT.average(Math.round(sixTotal / monthsLogged)) : TEXT.firstMonthText}</p>
          ) : previous === null ? (
            <p className="fp-note">
              {mode === "hero" ? <mark className="yellow">{TEXT.firstMonth}</mark> : <b>{TEXT.firstMonth}</b>} {TEXT.firstMonthText}
            </p>
          ) : (
            <p className={saved >= 0 ? "fp-note ahead" : "fp-note behind"}>
              {TEXT.compare[mode](Math.round(Math.abs(saved)), Math.round(previous), saved >= 0)}
            </p>
          )}
        </section>

        <section className="card fp-report">
          <p className="ctag">{LABELS.breakdown[mode]}</p>
          {biggest ? (
            <p className="fp-callout">{TEXT.biggest[mode](TEXT.sources[biggest.source])}</p>
          ) : (
            <p className="fp-callout">{TEXT.nothingYet}</p>
          )}
          <ul className="fp-rows">
            {rows.map((row) => (
              <li key={row.source}>
                <p>
                  <strong>{TEXT.sources[row.source]}</strong>
                  {row.source === "electricity" && <em>{electricityTag}</em>}
                  <b>{row.kg > 0 && row.kg < 10 ? row.kg.toFixed(1) : Math.round(row.kg)} kg</b>
                  <span>{Math.round(row.share * 100)}%</span>
                </p>
                <div className="fp-bar" aria-hidden="true">
                  <i className={row.biggest ? "top" : ""} style={{ width: `${row.width * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card fp-cuts">
          <p className="ctag">{LABELS.cuts[mode]}{mode === "hero" ? TEXT.easiest : ""}</p>
          <ul>
            {cuts.map((cut) => {
              const active = chosen === cut.mission.id;
              return (
                <li key={cut.mission.id}>
                  <p className="cut-title">{cut.mission.text(context)}</p>
                  <p className="cut-why">{TEXT.fits(cut.mission.sector, setup)}</p>
                  <div className="cut-foot">
                    <p className="cut-save">
                      −{Math.max(1, Math.round(cut.kg))} kg
                      {cut.inr >= 1 && <> · ₹{Math.round(cut.inr)}</>}
                      <small> {TEXT.aMonth}</small>
                      {cut.inr <= -1 && <small className="cut-cost"> {TEXT.costs(Math.round(-cut.inr))}</small>}
                    </p>
                    <button
                      type="button"
                      className={active ? "cut-btn done" : "cut-btn"}
                      onClick={() => makeMission(cut.mission.id, cut.mission.saves(context).kg, cut.mission.saves(context).inr)}
                    >
                      {active ? TEXT.missionSet[mode] : TEXT.makeMission[mode]}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {!firstMonth && (
          <section className="card fp-trend">
            <p className="ctag">{TEXT.trendTitle[mode]}</p>
            <div className="trend-bars">
              {months.map((m) => (
                <div key={m.month}>
                  <span>{m.logged ? Math.round(m.kg) : ""}</span>
                  <i className={m.month === thisMonth ? "now" : ""} style={{ height: `${(m.kg / barMax) * 100}%` }} />
                  <b>{TEXT.monthShort(m.month)}</b>
                  <small className={m.fromBill ? "from-bill" : ""}>{m.logged ? (m.fromBill ? TEXT.billMark[mode] : TEXT.estMark[mode]) : ""}</small>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="card fp-perspective">
          <p className="ctag">{TEXT.perspective}</p>
          <div className="persp-tiles">
            <p className="tile-you"><small>{TEXT.yourPace}</small><strong>{pace === null ? "–" : TEXT.tonnes[mode](pace.toFixed(1))}</strong><em>{TEXT.tonnesLine}</em></p>
            <p className="tile-avg"><small>{TEXT.averageIndian}</small><strong>{TEXT.tonnes[mode]((AVERAGE_INDIAN_KG_PER_YEAR / 1000).toFixed(1))}</strong><em>{TEXT.tonnesLine}</em></p>
          </div>
          <p className="persp-note">
            {pace === null
              ? TEXT.paceSoon
              : saved >= TREE_KG_PER_YEAR
                ? TEXT.trees[mode](Math.round(saved), Math.max(1, Math.round(saved / TREE_KG_PER_YEAR)))
                : pace <= AVERAGE_INDIAN_KG_PER_YEAR / 1000 ? TEXT.below : TEXT.above}
          </p>
        </section>

        {billDue && (
          <BillCapture
            account={account}
            month={lastMonth}
            className="home-bill fp-bill"
            estimate={(month) => estimatedMonthUnits(month, checkins, setup)}
            onSaved={(bill) => setData({ ...data, bills: [...bills, bill] })}
          />
        )}

        <section className="why-section">
          <button type="button" className="xp-toggle" aria-expanded={howOpen} onClick={() => setHowOpen(!howOpen)}>
            {TEXT.howTitle}
            <svg className={howOpen ? "open" : ""} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {howOpen && (
            <div className="why-answer">
              {TEXT.how.map((line) => <p key={line}>{line}</p>)}
              <p className="how-last">{TEXT.howLast}</p>
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
