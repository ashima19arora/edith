"use client";

import { useState } from "react";
import { XP } from "@/lib/factors";
import { BILL_TEXT as TEXT } from "@/lib/labels";
import { storeFor, type Account } from "@/lib/storage";
import { nowIST } from "@/lib/time";
import { useMode } from "@/lib/theme";
import type { Bill } from "@/lib/types";
import { CameraIcon } from "./art";

const MAX_SIDE = 1600;

// Phone photos are large, so shrink them to fit the upload limit while keeping the text readable.
async function shrink(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
}

function monthRange(month: string) {
  const [year, m] = month.split("-").map(Number);
  return { periodStart: `${month}-01`, periodEnd: new Date(Date.UTC(year, m, 0)).toISOString().slice(0, 10) };
}

interface BillCaptureProps {
  account: Account;
  month: string; // The month this bill most likely covers
  className: string;
  estimate?: (month: string) => number | null;
  onDone?: () => void;
  onSaved?: (bill: Bill) => void;
}

export function BillCapture({ account, month, className, estimate, onDone, onSaved }: BillCaptureProps) {
  const mode = useMode();
  const [state, setState] = useState<"idle" | "reading" | "manual">("idle");
  const [units, setUnits] = useState("");
  const [saved, setSaved] = useState<Bill | null>(null);
  const [error, setError] = useState("");

  async function save(bill: Bill) {
    try {
      const store = storeFor(account);
      await store.saveBill(bill);
      await store.addXp([{ date: nowIST().date, kind: "bill", xp: XP.bill }]);
      setSaved(bill);
      onDone?.();
      onSaved?.(bill);
    } catch {
      setState("manual");
      setError(TEXT.saveFailed);
    }
  }

  async function picked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setState("reading");
    setError("");
    try {
      const image = await shrink(file);
      const response = await fetch("/api/bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, mime: "image/jpeg" }),
      });
      if (!response.ok) throw new Error("Couldn't read the bill");
      const read = (await response.json()) as { units: number; periodStart: string; periodEnd: string };
      await save({ ...read, source: "photo" });
    } catch {
      setState("manual");
      setError(TEXT.readFailed);
    }
  }

  function submitManual(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(units);
    if (!(value > 0 && value <= 100_000)) return setError(TEXT.badUnits);
    save({ units: value, ...monthRange(month), source: "manual" });
  }

  if (saved) {
    const billMonth = saved.periodEnd.slice(0, 7);
    const estimated = estimate?.(billMonth) ?? null;
    return (
      <section className={`${className} bill-read`} role="status">
        <div>
          <p className="bill-read-tag">{TEXT.readTag}</p>
          <p className="bill-read-units">{TEXT.readUnits(Math.round(saved.units), billMonth)}</p>
          {estimated !== null && <p className="bill-read-note">{TEXT.readNote(Math.round(estimated))}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className={className}>
      <span className="bill-icon" aria-hidden="true"><CameraIcon /></span>
      {state === "manual" ? (
        <form className="bill-manual" onSubmit={submitManual}>
          <p className="bill-error" role="alert">{error}</p>
          <div>
            <input
              className="text-input"
              inputMode="numeric"
              value={units}
              placeholder={TEXT.unitsPlaceholder}
              aria-label={TEXT.unitsPlaceholder}
              onChange={(e) => setUnits(e.target.value)}
            />
            <button type="submit" className="bill-btn">{TEXT.saveButton}</button>
          </div>
        </form>
      ) : (
        <>
          <p className="bill-text">
            <strong>{TEXT.title[mode]}</strong> {TEXT.text[mode]}
          </p>
          <label className="bill-btn">
            {state === "reading" ? TEXT.reading : TEXT.button[mode]}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              disabled={state === "reading"}
              onChange={picked}
            />
          </label>
        </>
      )}
    </section>
  );
}
