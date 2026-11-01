"use client";

import Link from "next/link";
import { BackIcon } from "@/components/art";
import { CALCULATE as TEXT } from "@/lib/labels";
import { ThemeRoot } from "@/lib/theme";

export default function CalculatePage() {
  return (
    <ThemeRoot>
      <main className="screen settings calculate halftone">
        <header className="settings-head">
          <Link href="/app/settings" className="back-btn" aria-label={TEXT.back}>
            <BackIcon />
            <span className="back-word">{TEXT.back}</span>
          </Link>
          <h1>{TEXT.title}</h1>
        </header>
        <p className="calc-intro">{TEXT.intro}</p>
        <div className="calc-sections">
          {TEXT.sections.map(({ title, points }, i) => (
            <details key={title} className="calc-section">
              <summary>
                <span className="calc-number">{i + 1}</span>
                {title}
              </summary>
              <ul>
                {points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </details>
          ))}
        </div>
        <section className="group about-group">
          <p className="group-label">{TEXT.sourcesTitle}</p>
          <ul className="calc-sources">
            {TEXT.sources.map(([name, what]) => (
              <li key={name}>
                <strong>{name}</strong>
                <small>{what}</small>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </ThemeRoot>
  );
}
