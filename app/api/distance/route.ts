import { NextResponse, type NextRequest } from "next/server";

const ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

// Road distance from the user's base to a typed address. The caller falls back to an estimate on any error.
export async function POST(request: NextRequest) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return NextResponse.json({ error: "Maps not configured" }, { status: 503 });

  const body = await request.json().catch(() => null);
  const lat = Number(body?.from?.lat);
  const lng = Number(body?.from?.lng);
  const to = typeof body?.to === "string" ? body.to.trim() : "";
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || to.length < 3 || to.length > 200) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const response = await fetch(ROUTES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: lat, longitude: lng } } },
        destination: { address: to },
        travelMode: "DRIVE",
        regionCode: "IN",
      }),
    });
    if (!response.ok) throw new Error(`Routes API returned ${response.status}`);

    const data = (await response.json()) as { routes?: { distanceMeters?: number }[] };
    const meters = data.routes?.[0]?.distanceMeters;
    if (!meters) return NextResponse.json({ error: "No route found" }, { status: 404 });
    return NextResponse.json({ km: meters / 1000 });
  } catch {
    return NextResponse.json({ error: "Maps unavailable" }, { status: 503 });
  }
}
