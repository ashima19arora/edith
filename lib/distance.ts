import { ROAD_DISTANCE_FACTOR } from "@/lib/factors";

export const MAX_TRIP_KM = 40;

interface Point {
  latitude: number;
  longitude: number;
}

function straightLineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// Estimated road km to the closest match, or null when no match is within a daily trip:
// a far-off place with the same name is the wrong place, not a very long commute.
export function estimateTripKm(base: { lat: number; lng: number }, places: Point[]): number | null {
  if (places.length === 0) return null;
  const closest = Math.min(...places.map((p) => straightLineKm(base.lat, base.lng, p.latitude, p.longitude)));
  const km = Math.round(closest * ROAD_DISTANCE_FACTOR);
  return km > MAX_TRIP_KM ? null : Math.max(1, km);
}

interface PlaceLookup {
  locality?: string;
  city?: string;
  localityInfo?: { administrative?: { name?: string }[] };
}

// The most specific name a person would use: "Rohini", not "Outer North Delhi district".
export function placeFromLookup(data: PlaceLookup): string | null {
  const areas = (data.localityInfo?.administrative ?? []).map((a) => a.name).reverse();
  const names = [data.locality, ...areas, data.city];
  return names.find((name) => name && !/district|tehsil/i.test(name)) ?? null;
}
