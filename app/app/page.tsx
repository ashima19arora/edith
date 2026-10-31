"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HOME_SOON } from "@/lib/labels";
import { getAccount, storeFor } from "@/lib/storage";
import { setMode, ThemeRoot } from "@/lib/theme";

// Sends everyone to the right place in the first-run flow. Home itself is the next step.
export default function AppEntry() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function route() {
      const account = await getAccount();
      if (!account) return router.replace("/app/sign-in");
      try {
        const profile = await storeFor(account).getProfile();
        setMode(profile.mode);
        if (!profile.onboarded) return router.replace("/app/style");
        setReady(true);
      } catch {
        router.replace("/app/sign-in?error=1");
      }
    }
    route();
  }, [router]);

  if (!ready) return null;
  return (
    <ThemeRoot>
      <main className="screen screen-center">
        <h1 className="page-title">{HOME_SOON.title}</h1>
        <p className="page-intro">{HOME_SOON.line}</p>
      </main>
    </ThemeRoot>
  );
}
