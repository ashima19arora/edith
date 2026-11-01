"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadAir } from "@/lib/air";
import {
  answerQuestion,
  assistantMission,
  chatContext,
  forecastCard,
  suggestedQuestions,
  type Answer,
  type AssistantData,
  type CardKind,
  type Question,
} from "@/lib/assistant";
import { profileLives } from "@/lib/family";
import { loadHousehold } from "@/lib/family-store";
import { isWinter, monthToDate } from "@/lib/footprint";
import { missionKey } from "@/lib/home";
import { AIR_TEXT, ASSISTANT_TEXT as TEXT } from "@/lib/labels";
import { getAccount, storeFor, type Account } from "@/lib/storage";
import { nowIST } from "@/lib/time";
import { ThemeRoot, useMode } from "@/lib/theme";
import type { Co2Breakdown, Mode } from "@/lib/types";
import { BackIcon, SpiderIcon } from "./art";
import { Heart } from "./heart";

interface Message {
  id: number;
  who: "you" | "edith";
  text: string;
  card?: CardKind;
  health?: boolean;
  animate?: boolean;
}

interface SpeechResult { results: { 0: { transcript: string } }[] }
interface Recognizer {
  lang: string;
  onresult: (event: SpeechResult) => void;
  onerror: () => void;
  onend: () => void;
  start: () => void;
}

function speechApi(): (new () => Recognizer) | null {
  const w = window as unknown as { SpeechRecognition?: new () => Recognizer; webkitSpeechRecognition?: new () => Recognizer };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const slug = (category: string) => category.replace(" ", "-").toLowerCase();

function ForecastCard({ data, mode }: { data: AssistantData; mode: Mode }) {
  const { bars, go, tomorrow } = forecastCard(data);
  if (bars.length === 0) return null;
  return (
    <div className="chat-card chat-forecast">
      <p className="chat-card-head">
        <span>{TEXT.forecastDay(tomorrow)}</span>
        {go && <b>{TEXT.forecastBest[mode](go.label)}</b>}
      </p>
      <div className="chat-bars" aria-hidden="true">
        {bars.map((bar) => (
          <i key={bar.hour} className={`cat-bar-${slug(bar.category)} ${bar.go ? "go" : ""}`} style={{ height: `${Math.min(bar.aqi / 400, 1) * 40}px` }} />
        ))}
      </div>
    </div>
  );
}

function PersonCard({ name, safe, mode }: { name: string; safe: number; mode: Mode }) {
  return (
    <div className="chat-card chat-person">
      <span className="avatar avatar-s tint-a3" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
      <strong>{name}</strong>
      <span className="mini-hearts" role="img" aria-label={TEXT.heartsAlt(safe)}>
        {Array.from({ length: 5 }, (_, i) => <Heart key={i} mode={mode} safe={i < safe} />)}
      </span>
      <b>{TEXT.personCount[mode](safe)}</b>
    </div>
  );
}

function FootprintCard({ breakdown, mode }: { breakdown: Co2Breakdown; mode: Mode }) {
  const rows: [string, number][] = [
    [TEXT.sources.travel, breakdown.travel],
    [TEXT.sources.food, breakdown.food],
    [TEXT.homeEnergy, breakdown.electricity + breakdown.cooking],
    [TEXT.sources.deliveries, breakdown.deliveries],
  ];
  const top = Math.max(1, ...rows.map(([, v]) => v));
  return (
    <div className="chat-card chat-footprint">
      <p className="chat-card-head"><span>{TEXT.footprintHead[mode]}</span></p>
      <ul>
        {rows.map(([name, value]) => (
          <li key={name}>
            <span>{name}</span>
            <div aria-hidden="true"><i style={{ width: `${(value / top) * 100}%` }} /></div>
            <b>{Math.round(value)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TipCard({ data, account, mode }: { data: AssistantData; account: Account; mode: Mode }) {
  const mission = assistantMission(data);
  const [accepted, setAccepted] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!mission) return null;
  const { saving } = mission;

  async function accept() {
    try {
      localStorage.setItem(missionKey(data.date), mission!.id);
      await storeFor(account).saveMission({ date: data.date, missionId: mission!.id, accepted: true, savedKg: saving.kg, savedInr: saving.inr });
      setAccepted(true);
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="chat-card chat-tip">
      <p className="chat-tip-text">{mission.text(data.missionContext)}</p>
      <p className="chat-tip-save">{TEXT.tipSave(saving.kg.toFixed(1), saving.inr)}</p>
      <button type="button" className={accepted ? "chat-tip-btn done" : "chat-tip-btn"} disabled={accepted} onClick={accept}>
        {accepted ? TEXT.tipDone[mode] : TEXT.tipAccept[mode]}
      </button>
      {failed && <p className="form-error" role="alert">{TEXT.tipFailed}</p>}
    </div>
  );
}

export function AssistantScreen() {
  return (
    <ThemeRoot>
      <AssistantInner />
    </ThemeRoot>
  );
}

function AssistantInner() {
  const router = useRouter();
  const mode = useMode();
  const today = useMemo(() => nowIST(), []);
  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [loaded, setLoaded] = useState<Omit<AssistantData, "mode"> | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [asked, setAsked] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [listening, setListening] = useState(false);
  const nextId = useRef(1);

  useEffect(() => {
    async function load() {
      const found = await getAccount();
      if (!found) return router.replace("/app/sign-in");
      const store = storeFor(found);
      const [setup, profile, checkins, oneOffs, bills] = await Promise.all([
        store.getSetup(),
        store.getProfile(),
        store.getCheckins(),
        store.getOneOffs(),
        store.getBills(),
      ]);
      if (!setup) return router.replace("/app/style");
      setAccount(found);
      setName((profile.displayName ?? "").trim().split(" ")[0]);
      const house = found.kind === "user" ? await loadHousehold(found.id, today.date).catch(() => null) : null;
      const { air } = await loadAir(setup);
      const latest = [...checkins].sort((a, b) => b.date.localeCompare(a.date))[0];
      setLoaded({
        setup,
        air,
        breakdown: monthToDate(today.date, checkins, oneOffs, bills, setup).breakdown,
        missionContext: { setup, winter: isWinter(today.date), lastEnergy: latest?.energy },
        profiles: house?.profiles ?? [],
        date: today.date,
        tomorrow: today.tomorrow,
        now: today.time,
      });
    }
    load().catch(() => router.replace("/app"));
  }, [router, today]);

  const data: AssistantData | null = loaded ? { ...loaded, mode } : null;
  const area = loaded?.setup.location.area.startsWith("Using") ? AIR_TEXT.yourLocation : loaded?.setup.location.area;
  const chips = data ? suggestedQuestions(data).filter((q) => !asked.includes(q.id)) : [];
  const chatting = messages.length > 0;
  const elder = data?.profiles.find((p) => p.kind === "elder");
  const elderCard = data?.air && elder
    ? {
        name: elder.name,
        safe: profileLives(elder, data.air.hours.filter((h) => h.time.startsWith(today.date)), data.setup.purifier, data.air.aqi, today.time).safe,
      }
    : null;

  function push(message: Omit<Message, "id">) {
    const id = nextId.current++;
    setMessages((current) => [...current, { ...message, id }]);
  }

  function ask(question: Question) {
    if (!data) return;
    push({ who: "you", text: question.text });
    setAsked((current) => [...current, question.id]);
    const answer = answerQuestion(question.id, data);
    setTimeout(() => push({ who: "edith", text: answer.reply, card: answer.card, health: answer.health, animate: true }), 450);
  }

  async function send() {
    const question = input.trim().slice(0, 500);
    if (!question || !data || waiting) return;
    setInput("");
    push({ who: "you", text: question });
    setWaiting(true);
    let answer: Answer = { reply: TEXT.typedFallback };
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          context: chatContext(data),
          history: messages.filter((m) => m.who === "you").slice(-6).map((m) => m.text),
        }),
      });
      if (response.ok) answer = await response.json();
    } catch {
      // The friendly fallback stands
    }
    push({ who: "edith", text: answer.reply, card: answer.card, health: answer.health });
    setWaiting(false);
  }

  function listen() {
    const Api = speechApi();
    if (!Api || listening) return;
    const recognizer = new Api();
    recognizer.lang = "en-IN";
    recognizer.onresult = (event) => setInput(event.results[0][0].transcript);
    recognizer.onerror = () => setListening(false);
    recognizer.onend = () => setListening(false);
    setListening(true);
    recognizer.start();
  }

  const hasSpeech = typeof window !== "undefined" && !!speechApi();
  const mic = hasSpeech && (
    <button type="button" className={listening ? "chat-mic on" : "chat-mic"} aria-label={TEXT.mic} onClick={listen}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0014 0M12 18v3" />
      </svg>
    </button>
  );

  return (
    <main className="screen chat halftone">
      <header className="chat-head">
        <button type="button" className="chat-close" aria-label={TEXT.close} onClick={() => router.push("/app")}>
          {mode === "hero" ? <BackIcon /> : TEXT.done}
        </button>
        <span className="chat-avatar" aria-hidden="true"><SpiderIcon /></span>
        <div className="chat-who">
          <h1>EDITH</h1>
          <p><i aria-hidden="true" />{TEXT.watching(area ?? "")}</p>
        </div>
      </header>

      <div className="chat-scroll" aria-live="polite">
        {waiting && <p className="bubble edith thinking">{TEXT.thinking}</p>}
        {[...messages].reverse().map((m) => (
          <div key={m.id} className={`chat-msg ${m.who} ${m.animate ? "pop" : ""}`}>
            <p className={`bubble ${m.who}`}>{m.text}</p>
            {data && account && m.card === "forecast" && <ForecastCard data={data} mode={mode} />}
            {data && m.card === "person" && elderCard && <PersonCard mode={mode} name={elderCard.name} safe={elderCard.safe} />}
            {data && m.card === "footprint" && <FootprintCard breakdown={data.breakdown} mode={mode} />}
            {data && account && m.card === "tip" && <TipCard data={data} account={account} mode={mode} />}
            {m.health && <p className="chat-health">{TEXT.healthNote}</p>}
          </div>
        ))}
        {!chatting && data && (
          <div className="chat-empty">
            <p className="chat-greeting">{TEXT.greeting[mode](name, data.air?.category ?? null)}</p>
            <p className="chat-try">{TEXT.tryAsking[mode]}</p>
            <div className="chat-stack">
              {chips.map((q) => (
                <button key={q.id} type="button" className="chat-chip" onClick={() => ask(q)}>
                  {q.text}
                  {q.diwali && mode === "hero" && <em>{TEXT.diwaliTag}</em>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {chatting && chips.length > 0 && (
        <div className="chat-row">
          {chips.map((q) => <button key={q.id} type="button" className="chat-chip" onClick={() => ask(q)}>{q.text}</button>)}
        </div>
      )}

      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
        {mode === "plain" && mic}
        <input value={input} maxLength={500} placeholder={TEXT.placeholder[mode]} aria-label={TEXT.placeholder[mode]} onChange={(e) => setInput(e.target.value)} />
        {mode === "hero" && mic}
        <button type="submit" className="chat-send" aria-label={TEXT.send} disabled={waiting}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19V5M6 11l6-6 6 6" />
          </svg>
        </button>
      </form>
    </main>
  );
}
