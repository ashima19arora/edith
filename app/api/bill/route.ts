import { NextResponse, type NextRequest } from "next/server";
import { geminiConfigured, generateWithGemini } from "@/lib/gemini";

const TIME_LIMIT_MS = 30000; // The caller's fallback is better than a long wait
const MAX_BASE64 = 4_000_000; // About 3 MB of file, under Vercel's request limit
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const PROMPT =
  "This is a photo or PDF of an Indian household electricity bill. Reply as JSON: " +
  '{"units": <units or kWh consumed in this billing period, as a number>, ' +
  '"period_start": "YYYY-MM-DD", "period_end": "YYYY-MM-DD"}. ' +
  'If this isn\'t an electricity bill or you can\'t read it, reply {"units": null}.';

// Reads the units and billing period from a bill photo or PDF. The file isn't stored. The caller asks
// the user to type the units on any error.
export async function POST(request: NextRequest) {
  if (!geminiConfigured()) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

  const body = await request.json().catch(() => null);
  const image = typeof body?.image === "string" ? body.image : "";
  const mime = typeof body?.mime === "string" && (body.mime.startsWith("image/") || body.mime === "application/pdf") ? body.mime : null;
  if (!image || !mime || image.length > MAX_BASE64) {
    return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  }

  try {
    const response = await generateWithGemini(
      {
        contents: [{ parts: [{ text: PROMPT }, { inlineData: { mimeType: mime, data: image } }] }],
        generationConfig: { responseMimeType: "application/json" },
      },
      TIME_LIMIT_MS,
    );
    if (!response.ok) throw new Error(`Gemini returned ${response.status}`);

    const data = await response.json();
    const reply = JSON.parse(data.candidates[0].content.parts[0].text) as {
      units?: number | null;
      period_start?: string;
      period_end?: string;
    };
    const units = Number(reply.units);
    const validDates = DATE.test(reply.period_start ?? "") && DATE.test(reply.period_end ?? "");
    if (!Number.isFinite(units) || units <= 0 || units > 100_000 || !validDates) {
      return NextResponse.json({ error: "Couldn't read the bill" }, { status: 422 });
    }
    return NextResponse.json({ units, periodStart: reply.period_start, periodEnd: reply.period_end });
  } catch (error) {
    console.error("Gemini bill failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "AI unavailable" }, { status: 503 });
  }
}
