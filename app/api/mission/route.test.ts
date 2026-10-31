import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

function post(body: unknown) {
  return POST(new NextRequest("http://localhost/api/mission", { method: "POST", body: JSON.stringify(body) }));
}

const valid = {
  biggest: "travel",
  candidates: [
    { id: "metro-instead", text: "Take the Metro", kg: 1.2 },
    { id: "lid-on", text: "Keep lids on", kg: 0.1 },
  ],
};

function geminiSays(text: string) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ candidates: [{ content: { parts: [{ text }] } }] })));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("mission route", () => {
  it("reports unavailable without a key or model", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GEMINI_MODEL", "");
    expect((await post(valid)).status).toBe(503);
    vi.stubEnv("GEMINI_API_KEY", "key");
    expect((await post(valid)).status).toBe(503);
  });

  describe("with a key", () => {
    function configure() {
      vi.stubEnv("GEMINI_API_KEY", "key");
      vi.stubEnv("GEMINI_MODEL", "test-model");
    }

    it("returns Gemini's choice", async () => {
      configure();
      geminiSays('{"id":"lid-on"}');
      expect(await (await post(valid)).json()).toEqual({ id: "lid-on" });
    });

    it("rejects a mission outside the list", async () => {
      configure();
      geminiSays('{"id":"move-to-the-hills"}');
      expect((await post(valid)).status).toBe(503);
    });

    it("survives a reply that isn't JSON", async () => {
      configure();
      geminiSays("Sure! Try the Metro.");
      expect((await post(valid)).status).toBe(503);
    });

    it("rejects bad input without calling Gemini", async () => {
      configure();
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      expect((await post({ candidates: [] })).status).toBe(400);
      expect((await post({ candidates: [{ id: 1 }] })).status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
