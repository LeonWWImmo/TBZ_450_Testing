import { describe, it, expect, beforeEach, vi } from "vitest";
import { cacheKey, getForecast, resetCache } from "../src/services/openMeteo.js";
import { expect as chaiExpect } from "chai";

describe("OpenMeteo Service", () => {
  beforeEach(() => resetCache());

  it("soll cacheKey deterministisch sortieren", () => {
    const k1 = cacheKey({ b: 2, a: 1 });
    const k2 = cacheKey({ a: 1, b: 2 });

    expect(k1).toBe(k2); // gleiche Keys trotz anderer Reihenfolge
  });

  it("soll Forecast aus API holen und cachen", async () => {
    // fetch mocken
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true }),
    }));

    const params = { latitude: 47, longitude: 7, hourly: "temp" };
    const res1 = await getForecast(params);
    const res2 = await getForecast(params);

    // SoftAssertions mit chai
    chaiExpect(res1).to.deep.include({ ok: true });
    chaiExpect(res2).to.deep.include({ ok: true });
    chaiExpect(res1).to.equal(res2); // gleiche Referenz = aus Cache
  });

  it("soll Fehler werfen bei API-Error", async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 500 }));

    await expect(
      getForecast({ latitude: 47, longitude: 7, hourly: "temp" })
    ).rejects.toThrow(/Open-Meteo returned 500/);
  });
});
