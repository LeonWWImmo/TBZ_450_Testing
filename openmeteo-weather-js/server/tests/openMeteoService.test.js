import { describe, expect, it, vi } from "vitest";
import { expect as chaiExpect } from "chai";

// Helper: Import mit konfigurierbarer TTL
const importServiceWithTTL = async (ttl = "60000") => {
  vi.stubEnv("CACHE_TTL_MS", String(ttl));
  vi.resetModules();
  return await import("../src/services/openMeteo.js");
};
const importService = async () => importServiceWithTTL("60000");

/* =========================================================
 *  Service-Tests: getForecast()
 * ========================================================= */
describe("getForecast()", () => {
  it("setzt nur definierte Query-Parameter und Accept-Header", async () => {
    const { getForecast } = await importService();
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    });

    await getForecast({
      latitude: 47.38,
      longitude: 8.54,
      hourly: "temperature_2m",
      timezone: "auto",
      daily: undefined,
      current: "",
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = new URL(global.fetch.mock.calls[0][0]);
    const headers = global.fetch.mock.calls[0][1]?.headers;

    expect(calledUrl.origin + calledUrl.pathname)
      .toBe("https://api.open-meteo.com/v1/forecast");
    expect(calledUrl.searchParams.get("latitude")).toBe("47.38");
    expect(calledUrl.searchParams.get("longitude")).toBe("8.54");
    expect(calledUrl.searchParams.get("hourly")).toBe("temperature_2m");
    expect(calledUrl.searchParams.get("timezone")).toBe("auto");
    expect(calledUrl.searchParams.has("daily")).toBe(false);
    expect(calledUrl.searchParams.has("current")).toBe(false);
    expect(headers).toMatchObject({ Accept: "application/json" });
  });

  it("verwendet Cache: gleiche Params → nur 1 fetch()", async () => {
    const { getForecast } = await importService();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: 1 }),
    });

    const payload = { latitude: 47.0, longitude: 8.0, hourly: "temperature_2m" };
    await getForecast(payload);
    await getForecast(payload);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("wirft bei HTTP-Fehlern eine klare Fehlermeldung", async () => {
    const { getForecast } = await importService();
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 502 });
    await expect(getForecast({ latitude: 1, longitude: 2 }))
      .rejects.toThrow(/Open-Meteo returned 502/);
  });


  it("wrappt/propagiert Netzwerkfehler von fetch()", async () => {
    const { getForecast } = await importService();
    global.fetch = vi.fn(() => Promise.reject(new Error("network down")));
    await expect(getForecast({ latitude: 47, longitude: 8, hourly: "t2m" }))
      .rejects.toThrow(/network down/i);
  });

  it("propagiert Fehler, wenn response.json() wirft", async () => {
    const { getForecast } = await importService();
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new Error("bad json"); }
    });
    await expect(getForecast({ latitude: 47, longitude: 8, hourly: "t2m" }))
      .rejects.toThrow(/bad json/i);
  });

  it("nutzt den Cache innerhalb der TTL, aber erneuert nach Ablauf", async () => {
    vi.useFakeTimers();
    const { getForecast } = await importServiceWithTTL("1000");

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, ts: Date.now() })
    });

    const params = { latitude: 47, longitude: 8, hourly: "temperature_2m" };
    const r1 = await getForecast(params);
    const r2 = await getForecast(params);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(r1).toEqual(r2);

    vi.advanceTimersByTime(1101);
    const r3 = await getForecast(params);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(r3).not.toBe(r1);
    vi.useRealTimers();
  });

  it("entfernt undefined/null/Leerstring-Parameter aus der Request-URL", async () => {
    const { getForecast } = await importService();
    let seenUrl;
    global.fetch = vi.fn(async (url) => {
      seenUrl = String(url);
      return { ok: true, json: async () => ({ ok: true }) };
    });

    await getForecast({
      latitude: 47,
      longitude: 8,
      hourly: "temperature_2m",
      daily: "",
      current: null,
      timezone: undefined
    });

    expect(seenUrl).toMatch(/latitude=47/);
    expect(seenUrl).not.toMatch(/daily=/);
  });

  it("reicht forecast_days und past_days korrekt durch", async () => {
    const { getForecast } = await importService();
    let seenUrl = "";
    global.fetch = vi.fn(async (url) => {
      seenUrl = String(url);
      return { ok: true, json: async () => ({ ok: true }) };
    });

    await getForecast({
      latitude: 47,
      longitude: 8,
      hourly: "temperature_2m",
      forecast_days: 3,
      past_days: 2
    });

    expect(seenUrl).toMatch(/forecast_days=3/);
    expect(seenUrl).toMatch(/past_days=2/);
  });

  it("cached trotz unterschiedlicher Param-Reihenfolge (stabiler cacheKey)", async () => {
    const { getForecast, resetCache } = await importService();
    resetCache();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const p1 = { latitude: 47, longitude: 8, hourly: "temperature_2m", past_days: 1 };
    const p2 = { past_days: 1, hourly: "temperature_2m", longitude: 8, latitude: 47 };

    await getForecast(p1);
    await getForecast(p2);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("resetCache() invalidiert Cache (nächster Call -> Netz)", async () => {
    const { getForecast, resetCache } = await importService();
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ n: 1 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ n: 2 }) });

    const params = { latitude: 47, longitude: 8, hourly: "temperature_2m" };
    await getForecast(params);
    await getForecast(params);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    resetCache();
    await getForecast(params);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

/* =========================================================
 *  Utility-Tests: cacheKey + einfaches Caching
 * ========================================================= */
describe("OpenMeteo Backend – Utilities & Basis", () => {
  it("soll cacheKey deterministisch sortieren", async () => {
    const { cacheKey } = await importService();
    const k1 = cacheKey({ b: 2, a: 1 });
    const k2 = cacheKey({ a: 1, b: 2 });
    expect(k1).toBe(k2);
  });

  it("soll Forecast aus API holen und cachen (Basis)", async () => {
    const { getForecast, resetCache } = await importService();
    resetCache();
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true }),
    }));

    const params = { latitude: 47, longitude: 7, hourly: "temp" };
    const res1 = await getForecast(params);
    const res2 = await getForecast(params);
    chaiExpect(res1).to.deep.include({ ok: true });
    chaiExpect(res2).to.equal(res1);
  });

  it("soll Fehler werfen bei API-Error (Basis)", async () => {
    const { getForecast } = await importService();
    global.fetch = vi.fn(async () => ({ ok: false, status: 500 }));
    await expect(
      getForecast({ latitude: 47, longitude: 7, hourly: "temp" })
    ).rejects.toThrow(/Open-Meteo returned 500/);
  });
});
