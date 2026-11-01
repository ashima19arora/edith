"use client";

import { useEffect } from "react";

// Registers the service worker in production only, so development always shows fresh code.
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // The app works the same without it, just not offline
    });
  }, []);
  return null;
}
