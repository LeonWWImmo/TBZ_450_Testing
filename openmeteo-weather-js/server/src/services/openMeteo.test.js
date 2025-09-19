import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const importService = async () => {
  vi.stubEnv("CACHE_TTL_MS", "60000");
  vi.resetModules();
  return await import("./openMeteo.js");
};

describe("getForecast()", () => {
  beforeEach(() => {
    vi.useFakeTimers(); 
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("setzt nur definierte Query-Parameter und Accept-Header", async () => {
    const { getForecast } = await importService();

    global.fetch.mockResolvedValueOnce({
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

    const payload = { latitude: 47.0, longitude: 8.0, hourly: "temperature_2m" };
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: 1 }),
    });

    await getForecast(payload);
    await getForecast(payload);

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("wirft bei HTTP-Fehlern eine klare Fehlermeldung", async () => {
    const { getForecast } = await importService();

    global.fetch.mockResolvedValueOnce({ ok: false, status: 502 });
    await expect(getForecast({ latitude: 1, longitude: 2 }))
      .rejects.toThrow(/Open-Meteo returned 502/);
  });
});
