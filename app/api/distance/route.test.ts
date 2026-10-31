import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

function post(body: unknown) {
  return POST(new NextRequest("http://localhost/api/distance", { method: "POST", body: JSON.stringify(body) }));
}

const valid = { from: { lat: 28.6, lng: 77 }, to: "MAIT, Rohini" };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("distance route", () => {
  it("reports unavailable without a key, so the app falls back", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "");
    expect((await post(valid)).status).toBe(503);
  });

  it("rejects bad input without calling Google", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "key");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await post({ ...valid, to: "x" })).status).toBe(400);
    expect((await post({ to: "MAIT, Rohini" })).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the road distance in km", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "key");
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ routes: [{ distanceMeters: 12400 }] }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await post(valid);
    expect(await response.json()).toEqual({ km: 12.4 });
    expect(fetchMock.mock.calls[0][1].headers["X-Goog-Api-Key"]).toBe("key");
  });

  it("handles no route and Google errors", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({})));
    expect((await post(valid)).status).toBe(404);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 403 })));
    expect((await post(valid)).status).toBe(503);
  });
});
