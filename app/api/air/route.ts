import { connection, NextResponse, type NextRequest } from "next/server";
import { headlineAqi, parseOpenMeteo, pm25Mean } from "@/lib/aqi";
import { DELHI } from "@/lib/factors";
import { nowIST } from "@/lib/time";

function coordinate(value: string | null, limit: number, fallback: number): number {
  const number = value === null ? NaN : Number(value);
  // Two decimals is about a kilometre: close enough for air, and nearby users share a cache entry.
  return Number.isFinite(number) && Math.abs(number) <= limit ? Math.round(number * 100) / 100 : fallback;
}

// Rough city from the visitor's IP address, which Vercel adds to each request. India only.
function ipPlace(request: NextRequest) {
  const { headers } = request;
  const lat = Number(headers.get("x-vercel-ip-latitude") ?? NaN);
  const lng = Number(headers.get("x-vercel-ip-longitude") ?? NaN);
  const city = headers.get("x-vercel-ip-city");
  if (headers.get("x-vercel-ip-country") !== "IN" || !city || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  try {
    return { lat, lng, place: decodeURIComponent(city) };
  } catch {
    return null;
  }
}

// Current air for a location, defaulting to Delhi. Responses are cached for 15 minutes.
export async function GET(request: NextRequest) {
  await connection();
  const params = request.nextUrl.searchParams;
  const nearby = params.has("nearby") ? ipPlace(request) : null;
  const lat = coordinate(nearby ? String(nearby.lat) : params.get("lat"), 90, DELHI.lat);
  const lng = coordinate(nearby ? String(nearby.lng) : params.get("lng"), 180, DELHI.lng);

  try {
    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}` +
      "&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone" +
      "&past_days=14&forecast_days=2&timezone=Asia%2FKolkata";
    const response = await fetch(url, { next: { revalidate: 900 } });
    if (!response.ok) throw new Error(`Air API returned ${response.status}`);

    const hours = parseOpenMeteo(await response.json());
    const nowIndex = hours.findIndex((h) => h.time === nowIST().time);
    const result = headlineAqi(hours, nowIndex);
    if (!result) throw new Error("Not enough air data");

    return NextResponse.json({
      aqi: result.aqi,
      category: result.category,
      mainPollutant: result.mainPollutant,
      pm25Mean: pm25Mean(hours, nowIndex),
      hours,
      ...(nearby && { place: nearby.place }),
    });
  } catch {
    return NextResponse.json({ error: "Air data unavailable" }, { status: 503 });
  }
}
