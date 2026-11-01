"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HomeScreen } from "@/components/home-screen";
import { PENDING_JOIN_KEY } from "@/lib/family-store";
import { adoptGuestData, getAccount, storeFor, type Account, type Profile } from "@/lib/storage";
import { setMode } from "@/lib/theme";
import type { SetupAnswers } from "@/lib/types";

// Sends everyone to the right place in the first-run flow, then shows Home.
export default function AppEntry() {
  const router = useRouter();
  const [state, setState] = useState<{ account: Account; profile: Profile; setup: SetupAnswers } | null>(null);

  useEffect(() => {
    async function route() {
      const account = await getAccount();
      if (!account) return router.replace("/app/sign-in");
      try {
        await adoptGuestData(account);
        const store = storeFor(account);
        const [profile, setup] = await Promise.all([store.getProfile(), store.getSetup()]);
        setMode(profile.mode);
        if (!profile.onboarded || !setup) return router.replace("/app/style");
        if (account.kind === "user" && localStorage.getItem(PENDING_JOIN_KEY)) return router.replace("/app/family");
        setState({ account, profile, setup });
      } catch {
        router.replace("/app/sign-in?error=1");
      }
    }
    route();
  }, [router]);

  return state ? <HomeScreen {...state} /> : null;
}
