import { NextResponse } from "next/server";
import { connection } from "next/server";
import { headlineAqi, parseOpenMeteo } from "@/lib/aqi";

const DELHI = { lat: 28.6139, lng: 77.209 };
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Current headline AQI for Delhi, shown on the sign-in screen. The full air API comes with Airspace.
export async function GET() {
  await connection();
  try {
    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${DELHI.lat}&longitude=${DELHI.lng}` +
      "&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone" +
      "&past_days=1&forecast_days=2&timezone=Asia%2FKolkata";
    const response = await fetch(url, { next: { revalidate: 900 } });
    if (!response.ok) throw new Error(`Air API returned ${response.status}`);

    const hours = parseOpenMeteo(await response.json());
    const now = new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 13) + ":00";
    const result = headlineAqi(hours, hours.findIndex((h) => h.time === now));
    if (!result) throw new Error("Not enough air data");

    return NextResponse.json({ aqi: result.aqi, category: result.category });
  } catch {
    return NextResponse.json({ error: "Air data unavailable" }, { status: 503 });
  }
}
