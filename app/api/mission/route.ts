import { NextResponse, type NextRequest } from "next/server";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_CANDIDATES = 40;

interface Candidate {
  id: string;
  text: string;
  kg: number;
}

function isCandidate(c: Partial<Candidate>): c is Candidate {
  return typeof c?.id === "string" && typeof c.text === "string" && c.text.length < 200 && typeof c.kg === "number";
}

// Asks Gemini to choose from missions the app already found applicable. It can't invent one:
// anything outside the list is rejected, and the caller keeps its rule-based pick on any error.
export async function POST(request: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!key || !model) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

  const body = await request.json().catch(() => null);
  const candidates: Partial<Candidate>[] = Array.isArray(body?.candidates) ? body.candidates : [];
  const biggest = typeof body?.biggest === "string" ? body.biggest.slice(0, 30) : "unknown";
  if (candidates.length === 0 || candidates.length > MAX_CANDIDATES || !candidates.every(isCandidate)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const prompt =
    "You choose one daily climate action for a person in Delhi, India. " +
    `Their biggest footprint source is ${biggest}. ` +
    "Choose the action most likely to be done today and worth doing. " +
    'Reply as JSON: {"id": "<one id from the list>"}.\n' +
    (candidates as Candidate[]).map((c) => `${c.id}: ${c.text} (saves ${c.kg.toFixed(1)} kg CO2)`).join("\n");

  try {
    const response = await fetch(`${GEMINI_URL}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
    if (!response.ok) throw new Error(`Gemini returned ${response.status}`);

    const data = await response.json();
    const { id } = JSON.parse(data.candidates[0].content.parts[0].text) as { id?: string };
    if (!(candidates as Candidate[]).some((c) => c.id === id)) throw new Error("Gemini chose outside the list");
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: "AI unavailable" }, { status: 503 });
  }
}
