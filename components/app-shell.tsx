"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { NAV } from "@/lib/labels";
import { ThemeRoot, useMode } from "@/lib/theme";

const ICONS: Record<keyof typeof NAV, ReactNode> = {
  home: <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />,
  air: <path d="M3 8h11a3 3 0 10-3-3M3 13h16a3 3 0 11-3 3M3 18h8" />,
  checkin: <path d="M5 4h14v16H5zM9 12l2.5 2.5L15.5 9" />,
  footprint: (
    <path d="M11 3c-2 0-3 2-3 5s1 5 1 7 1 3 2 3 2-1 2-3-1-3-1-5 1-3 1-5-1-2-2-2zM8 20a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z" />
  ),
  progress: <path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.2 6L12 16.7 6.5 19.6l1.2-6L3.2 9.4l6.1-.8z" />,
};

export type NavKey = keyof typeof NAV;

export function BottomNav({ active }: { active: NavKey | null }) {
  const mode = useMode();
  return (
    <nav className="app-nav" aria-label="Main">
      {(Object.keys(NAV) as NavKey[]).map((key) => (
        <Link key={key} href={NAV[key].href} className="nav-item" aria-current={active === key ? "page" : undefined}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
            {ICONS[key]}
          </svg>
          <span>{NAV[key][mode]}</span>
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ active, children }: { active: NavKey | null; children: ReactNode }) {
  return (
    <ThemeRoot>
      <div className="app-frame">
        {children}
        <BottomNav active={active} />
      </div>
    </ThemeRoot>
  );
}
