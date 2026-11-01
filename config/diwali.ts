// This season's Diwali details. Update each year from the official notice; never state rules that aren't confirmed.

export const DIWALI = {
  date: "2026-11-08",
  // Shown during Diwali week and a few days after.
  showFrom: "2026-11-01",
  showUntil: "2026-11-12",
  year: 2026,
  // Null means nothing confirmed yet, so the app shows nothing rather than guessing.
  firecrackers: null as string | null,
  permittedHours: null as string | null,
  noticeUrl: null as string | null,
  noisePortalUrl: "https://ngms.delhi.gov.in",
  emergency: "112",
};

export function isDiwaliSeason(date: string): boolean {
  return date >= DIWALI.showFrom && date <= DIWALI.showUntil;
}
