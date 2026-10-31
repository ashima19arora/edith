"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import type { Mode } from "./types";

const KEY = "edith.mode";
const listeners = new Set<() => void>();

function read(): Mode {
  return localStorage.getItem(KEY) === "plain" ? "plain" : "hero";
}

export function setMode(mode: Mode) {
  localStorage.setItem(KEY, mode);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMode(): Mode {
  return useSyncExternalStore(subscribe, read, () => "hero");
}

const noSubscribe = () => () => {};

// For screens that read localStorage or window while rendering: skips the server render.
export function ClientOnly({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(noSubscribe, () => true, () => false);
  return ready ? children : null;
}

export function ThemeRoot({ children, mode }: { children: ReactNode; mode?: Mode }) {
  const stored = useMode();
  return (
    <div data-mode={mode ?? stored} className="edith-root">
      {children}
    </div>
  );
}
