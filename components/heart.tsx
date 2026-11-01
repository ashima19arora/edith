import type { Mode } from "@/lib/types";

export function Heart({ safe, mode }: { safe: boolean; mode: Mode }) {
  if (mode === "plain") {
    return (
      <svg viewBox="0 0 24 24" className={`heart heart-plain ${safe ? "safe" : "risk"}`} aria-hidden="true">
        <path d="M12 21s-8.5-5.3-10-10.7C1 6.6 3.5 3.5 7 3.5c2 0 3.8 1 5 2.8 1.2-1.8 3-2.8 5-2.8 3.5 0 6 3.1 5 6.8C20.5 15.7 12 21 12 21z" />
      </svg>
    );
  }
  return (
    <svg viewBox="-0.5 -0.5 8 7" className={`heart heart-pixel ${safe ? "safe" : "risk"}`} aria-hidden="true">
      <path d="M1 0H3V1H4V0H6V1H7V3H6V4H5V5H4V6H3V5H2V4H1V3H0V1H1Z" />
      {safe && <rect x="1" y="1" width="1" height="1" fill="#FFB3C0" />}
    </svg>
  );
}
