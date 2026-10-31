"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackIcon, CornerWeb } from "@/components/art";
import { STYLE_PICK } from "@/lib/labels";
import { getAccount, storeFor, type Account } from "@/lib/storage";
import { setMode, ThemeRoot } from "@/lib/theme";
import type { Mode } from "@/lib/types";

// The mini previews are decoration, so their numbers are not real readings.
function HeroPreview() {
  return (
    <div className="preview preview-hero" aria-hidden="true">
      <div className="preview-bubble"><i /><i /></div>
      <div className="preview-bar" />
      <div className="preview-split">
        <b className="red">312</b>
        <b className="blue">142</b>
      </div>
      <div className="preview-hearts"><i /><i /><i className="empty" /></div>
    </div>
  );
}

function PlainPreview() {
  return (
    <div className="preview preview-plain" aria-hidden="true">
      <div className="preview-line"><i /><i /></div>
      <i className="preview-dot" />
      <div className="preview-cards"><b>312</b><b>142</b></div>
      <div className="preview-dots"><i /><i /><i className="empty" /></div>
    </div>
  );
}

export default function PickStyle() {
  const router = useRouter();
  const [picked, setPicked] = useState<Mode>("hero");
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    getAccount().then((found) => {
      if (found) setAccount(found);
      else router.replace("/app/sign-in");
    });
  }, [router]);

  async function suitUp() {
    if (!account) return;
    setMode(picked);
    // The choice is safe in localStorage if this fails, and is saved again at the end of setup.
    await storeFor(account).saveProfile({ mode: picked }).catch(() => {});
    router.push("/app/setup");
  }

  const cards: [Mode, string, string, React.ReactNode][] = [
    ["hero", STYLE_PICK.heroName, STYLE_PICK.heroLine, <HeroPreview key="hero" />],
    ["plain", STYLE_PICK.plainName, STYLE_PICK.plainLine, <PlainPreview key="plain" />],
  ];

  return (
    <ThemeRoot mode="hero">
      <main className="screen halftone">
        <CornerWeb />
        <div className="screen-body style-body screen-in">
          <button type="button" className="back-btn" aria-label="Back" onClick={() => router.push("/app/sign-in")}>
            <BackIcon />
          </button>
          <p className="sticker style-sticker">{STYLE_PICK.sticker}</p>
          <h1 className="comic-title">{STYLE_PICK.title}</h1>
          <p className="page-intro">{STYLE_PICK.intro}</p>

          <div className="style-cards" role="radiogroup" aria-label={STYLE_PICK.title}>
            {cards.map(([mode, name, line, preview]) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={picked === mode}
                className={`style-card style-card-${mode}`}
                onClick={() => setPicked(mode)}
              >
                {picked === mode && <span className="sticker picked">{STYLE_PICK.picked}</span>}
                {preview}
                <span className="style-card-text">
                  <strong>{name}</strong>
                  <small>{line}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
        <footer className="screen-foot style-foot">
          <button type="button" className="cta" onClick={suitUp} disabled={!account}>
            {STYLE_PICK.button}
          </button>
          <p className="foot-note">{STYLE_PICK.note}</p>
        </footer>
      </main>
    </ThemeRoot>
  );
}
