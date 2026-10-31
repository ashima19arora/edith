import { connection, NextResponse, type NextRequest } from "next/server";
import { headlineAqi, parseOpenMeteo, pm25Mean } from "@/lib/aqi";
import { DELHI } from "@/lib/factors";
import { nowIST } from "@/lib/time";

function coordinate(value: string | null, limit: number, fallback: number): number {
  const number = value === null ? NaN : Number(value);
  // Two decimals is about a kilometre: close enough for air, and nearby users share a cache entry.
  return Number.isFinite(number) && Math.abs(number) <= limit ? Math.round(number * 100) / 100 : fallback;
}

// Current air for a location, defaulting to Delhi. Responses are cached for 15 minutes.
export async function GET(request: NextRequest) {
  await connection();
  const lat = coordinate(request.nextUrl.searchParams.get("lat"), 90, DELHI.lat);
  const lng = coordinate(request.nextUrl.searchParams.get("lng"), 180, DELHI.lng);

  try {
    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}` +
      "&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone" +
      "&past_days=1&forecast_days=2&timezone=Asia%2FKolkata";
    const response = await fetch(url, { next: { revalidate: 900 } });
    if (!response.ok) throw new Error(`Air API returned ${response.status}`);

    const hours = parseOpenMeteo(await response.json());
    const nowIndex = hours.findIndex((h) => h.time === nowIST().time);
    const result = headlineAqi(hours, nowIndex);
    if (!result) throw new Error("Not enough air data");

    return NextResponse.json({
      aqi: result.aqi,
      category: result.category,
      pm25Mean: pm25Mean(hours, nowIndex),
      hours,
    });
  } catch {
    return NextResponse.json({ error: "Air data unavailable" }, { status: 503 });
  }
}
