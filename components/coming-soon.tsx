"use client";

import { COMING_SOON, HOME_TEXT } from "@/lib/labels";
import { useMode } from "@/lib/theme";
import { AppShell } from "./app-shell";

export function ComingSoon({ section }: { section: keyof typeof COMING_SOON }) {
  const mode = useMode();
  const { title, nav } = COMING_SOON[section];
  return (
    <AppShell active={nav}>
      <main className="screen screen-center soon">
        <h1 className="page-title">{title[mode]}</h1>
        <p className="page-intro">{HOME_TEXT.comingSoon}</p>
      </main>
    </AppShell>
  );
}
