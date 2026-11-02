import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

function post(body: unknown) {
  return POST(new NextRequest("http://localhost/api/bill", { method: "POST", body: JSON.stringify(body) }));
}

const valid = { image: "aGVsbG8=", mime: "image/jpeg" };

function geminiSays(text: string) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ candidates: [{ content: { parts: [{ text }] } }] })));
}

function configure() {
  vi.stubEnv("GEMINI_API_KEY", "key");
  vi.stubEnv("GEMINI_MODEL", "test-model");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("bill route", () => {
  it("reports unavailable without a key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    expect((await post(valid)).status).toBe(503);
  });

  it("returns the units and period", async () => {
    configure();
    geminiSays('{"units": 320, "period_start": "2026-09-01", "period_end": "2026-09-30"}');
    expect(await (await post(valid)).json()).toEqual({ units: 320, periodStart: "2026-09-01", periodEnd: "2026-09-30" });
  });

  it("accepts a PDF", async () => {
    configure();
    geminiSays('{"units": 320, "period_start": "2026-09-01", "period_end": "2026-09-30"}');
    expect((await post({ image: "aGVsbG8=", mime: "application/pdf" })).status).toBe(200);
  });

  it("rejects other file types", async () => {
    configure();
    expect((await post({ image: "aGVsbG8=", mime: "text/plain" })).status).toBe(400);
  });

  it("rejects an unreadable bill, nonsense units and bad dates", async () => {
    configure();
    geminiSays('{"units": null}');
    expect((await post(valid)).status).toBe(422);
    geminiSays('{"units": -5, "period_start": "2026-09-01", "period_end": "2026-09-30"}');
    expect((await post(valid)).status).toBe(422);
    geminiSays('{"units": 300, "period_start": "September", "period_end": "2026-09-30"}');
    expect((await post(valid)).status).toBe(422);
  });

  it("rejects bad uploads without calling Gemini", async () => {
    configure();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await post({ image: "", mime: "image/jpeg" })).status).toBe(400);
    expect((await post({ image: "abc", mime: "text/plain" })).status).toBe(400);
    expect((await post({ image: "a".repeat(4_000_001), mime: "image/jpeg" })).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
