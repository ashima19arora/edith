import { afterEach, describe, expect, it, vi } from "vitest";
import { generateWithGemini, geminiKeys } from "./gemini";

function statuses(...codes: number[]) {
  const mock = vi.fn();
  for (const status of codes) mock.mockResolvedValueOnce(new Response("{}", { status }));
  vi.stubGlobal("fetch", mock);
  return mock;
}

const usedKeys = (mock: ReturnType<typeof vi.fn>) => mock.mock.calls.map((call) => call[1].headers["x-goog-api-key"]);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Gemini keys", () => {
  it("reads keys in order and stops at a gap", () => {
    expect(geminiKeys({ GEMINI_API_KEY: "a", GEMINI_API_KEY_2: "b", GEMINI_API_KEY_3: "c", GEMINI_API_KEY_5: "e" })).toEqual(["a", "b", "c"]);
    expect(geminiKeys({})).toEqual([]);
  });

  function configure() {
    vi.stubEnv("GEMINI_MODEL", "m");
    vi.stubEnv("GEMINI_API_KEY", "a");
    vi.stubEnv("GEMINI_API_KEY_2", "b");
    vi.stubEnv("GEMINI_API_KEY_3", "c");
  }

  it("moves on when a key hits its limit or is rejected", async () => {
    configure();
    const mock = statuses(429, 403, 200);
    expect((await generateWithGemini({}, 1000)).status).toBe(200);
    expect(usedKeys(mock)).toEqual(["a", "b", "c"]);
  });

  it("stays on the first key when it works, and on other errors", async () => {
    configure();
    let mock = statuses(200);
    await generateWithGemini({}, 1000);
    expect(usedKeys(mock)).toEqual(["a"]);
    mock = statuses(500);
    expect((await generateWithGemini({}, 1000)).status).toBe(500);
    expect(usedKeys(mock)).toEqual(["a"]);
  });

  it("reports the last failure when every key is used up", async () => {
    configure();
    statuses(429, 429, 429);
    expect((await generateWithGemini({}, 1000)).status).toBe(429);
  });
});
