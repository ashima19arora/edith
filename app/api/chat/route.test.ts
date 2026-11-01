import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

function post(body: unknown) {
  return POST(new NextRequest("http://localhost/api/chat", { method: "POST", body: JSON.stringify(body) }));
}

const valid = { question: "Is it okay to run?", context: "{}", history: [] };

function configure(text: string) {
  vi.stubEnv("GEMINI_API_KEY", "key");
  vi.stubEnv("GEMINI_MODEL", "test-model");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ candidates: [{ content: { parts: [{ text }] } }] })));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("chat route", () => {
  it("reports unavailable without a key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    expect((await post(valid)).status).toBe(503);
  });

  it("returns the reply and a known card", async () => {
    configure('{"reply":"Wait till 4.","card":"forecast","health":true}');
    expect(await (await post(valid)).json()).toEqual({ reply: "Wait till 4.", card: "forecast", health: true });
  });

  it("drops unknown cards", async () => {
    configure('{"reply":"Hi.","card":"bank-details"}');
    expect(await (await post(valid)).json()).toEqual({ reply: "Hi.", health: false });
  });

  it("survives bad replies", async () => {
    configure("Sure!");
    expect((await post(valid)).status).toBe(503);
    configure('{"reply":""}');
    expect((await post(valid)).status).toBe(503);
  });

  it("rejects oversized input without calling Gemini", async () => {
    configure("{}");
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    expect((await post({ ...valid, question: "" })).status).toBe(400);
    expect((await post({ ...valid, question: "a".repeat(501) })).status).toBe(400);
    expect((await post({ ...valid, context: "a".repeat(6001) })).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
