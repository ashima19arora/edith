"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CornerWeb, Skyline, SpiderIcon } from "@/components/art";
import { SIGN_IN } from "@/lib/labels";
import { startGuest } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { ThemeRoot } from "@/lib/theme";

export default function SignIn() {
  const router = useRouter();
  const [air, setAir] = useState<{ aqi: number; category: string; place?: string } | null>(null);
  const [message, setMessage] = useState(() =>
    new URLSearchParams(window.location.search).has("error") ? SIGN_IN.googleFailed : "",
  );

  useEffect(() => {
    fetch("/api/air?nearby=1")
      .then((response) => (response.ok ? response.json() : null))
      .then(setAir)
      .catch(() => setAir(null));
  }, []);

  async function google() {
    const supabase = createClient();
    if (!supabase) return setMessage(SIGN_IN.googleMissing);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setMessage(SIGN_IN.googleFailed);
  }

  function guest() {
    startGuest();
    router.push("/app");
  }

  // Always Hero: the style is picked on the next screen.
  return (
    <ThemeRoot mode="hero">
      <main className="screen sign-in halftone">
        <CornerWeb />
        <div className="spider-drop" aria-hidden="true">
          <div className="spider-bob">
            <span />
            <SpiderIcon className="spider-drop-icon" />
          </div>
        </div>

        <section className="sign-in-pitch">
          <p className="sticker">{SIGN_IN.sticker}</p>
          <h1 className="sign-in-name">
            <Image src="/brand/edith-wordmark.png" alt={SIGN_IN.name} width={565} height={239} priority />
          </h1>
          <p className="sign-in-tagline">
            {SIGN_IN.taglineOne}
            <br />
            <span>{SIGN_IN.taglineTwo}</span>
          </p>
          {air && (
            <p className="air-bubble">
              {SIGN_IN.airPrefix(air.place ?? SIGN_IN.airDefaultPlace)} <b>AQI {air.aqi} · {air.category}</b>
            </p>
          )}
        </section>

        <div className="sign-skyline">
          <Skyline />
          <Skyline />
          <Skyline />
        </div>

        <section className="sign-in-actions">
          <button type="button" className="google-btn" onClick={google}>
            <span className="google-g" aria-hidden="true">G</span>
            {SIGN_IN.google}
          </button>
          <button type="button" className="guest-btn" onClick={guest}>
            {SIGN_IN.guest}
          </button>
          {message && <p className="form-error" role="alert">{message}</p>}
          <p className="sign-in-note">{SIGN_IN.guestNote}</p>
        </section>
      </main>
    </ThemeRoot>
  );
}
