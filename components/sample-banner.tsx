"use client";

import { SAMPLE_TEXT } from "@/lib/labels";
import { endSample, isSample } from "@/lib/storage";

// Sample data is always labelled, so it can't be mistaken for someone's real history.
export function SampleBanner() {
  if (!isSample()) return null;
  return (
    <div className="sample-banner" role="status">
      <span>{SAMPLE_TEXT.banner}</span>
      <button
        type="button"
        onClick={() => {
          endSample();
          window.location.replace("/app");
        }}
      >
        {SAMPLE_TEXT.exit}
      </button>
    </div>
  );
}
