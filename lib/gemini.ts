// Server-side only. Calls Gemini, moving to the next key when one hits its limit or is rejected.

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const TRY_NEXT_KEY = [401, 403, 429];

// GEMINI_API_KEY, then GEMINI_API_KEY_2, GEMINI_API_KEY_3 and so on, stopping at the first gap.
export function geminiKeys(env: Record<string, string | undefined> = process.env): string[] {
  const keys: string[] = [];
  if (env.GEMINI_API_KEY) keys.push(env.GEMINI_API_KEY);
  for (let n = 2; env[`GEMINI_API_KEY_${n}`]; n++) keys.push(env[`GEMINI_API_KEY_${n}`]!);
  return keys;
}

export function geminiConfigured(): boolean {
  return geminiKeys().length > 0 && !!process.env.GEMINI_MODEL;
}

// The time limit covers every attempt together, so extra keys never make anyone wait longer.
export async function generateWithGemini(body: unknown, timeLimitMs: number): Promise<Response> {
  const url = `${GEMINI_URL}/${encodeURIComponent(process.env.GEMINI_MODEL ?? "")}:generateContent`;
  const signal = AbortSignal.timeout(timeLimitMs);
  let last: Response | null = null;
  for (const key of geminiKeys()) {
    last = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal,
      body: JSON.stringify(body),
    });
    if (!TRY_NEXT_KEY.includes(last.status)) return last;
  }
  if (!last) throw new Error("No Gemini key");
  return last;
}
