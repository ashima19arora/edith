"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PENDING_JOIN_KEY } from "@/lib/family-store";

// An invite link. The code waits until the person has signed in and finished setup.
function Join() {
  const router = useRouter();
  const { code } = useParams<{ code: string }>();

  useEffect(() => {
    if (/^[a-z0-9-]{4,40}$/i.test(code)) localStorage.setItem(PENDING_JOIN_KEY, code);
    router.replace("/app/family");
  }, [code, router]);

  return null;
}

export default function JoinPage() {
  return (
    <Suspense>
      <Join />
    </Suspense>
  );
}
