// tests/app.test.js
import { describe, test, expect, beforeEach, vi } from "vitest";
import { JSDOM } from "jsdom";
import { importTestableApp } from "./_loadAppModule";

function setupDOM() {
  const dom = new JSDOM(
    `<!DOCTYPE html><body>
      <form id="query-form"></form>
      <section id="status"></section>
      <table id="hours"><tbody></tbody></table>
      <canvas id="tempChart"></canvas>
      <button id="btn-geolocate"></button>
      <input id="lat" value="47.3769"/>
      <input id="lon" value="8.5417"/>
      <input id="hourly" value="temperature_2m,weather_code"/>
      <input id="tz" value="Europe/Zurich"/>
    </body>`,
    { url: "https://example.test/?lat=1&lon=2&hourly=a&tz=UTC" }
  );

  global.window = dom.window;
  global.document = dom.window.document;
  global.history = dom.window.history;
  global.location = dom.window.location;
  global.localStorage = dom.window.localStorage;

  // Polyfill: matchMedia (wird von Chart.js/Code teilweise genutzt)
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),      // alte API
      removeListener: vi.fn(),   // alte API
      addEventListener: vi.fn(), // neue API
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  // Canvas-Context stub (falls abgefragt)
  const canvas = document.getElementById("tempChart");
  if (canvas && !canvas.getContext) {
    canvas.getContext = vi.fn(() => ({}));
  }

  // fetch mock
  global.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      hourly: {
        time: ["2025-01-01T00:00"],
        temperature_2m: [1],
        weather_code: [0],
      },
    }),
  }));

  // Chart mock
  global.Chart = vi.fn(function () {
    return { destroy: vi.fn(), update: vi.fn() };
  });

  // geolocation mock
  global.navigator = dom.window.navigator;
  global.navigator.geolocation = {
    getCurrentPosition: (ok) =>
      ok({ coords: { latitude: 10, longitude: 20 } }),
  };

  return dom;
}

describe("app.js – Frontendfunktionen", () => {
  let app;

  beforeEach(async () => {
    setupDOM();

    // Windows-sicherer Pfad zu app.js
    const rawPath = new URL("../app.js", import.meta.url).pathname;
    const cleanPath = rawPath.replace(/^\/([A-Za-z]:)/, "$1"); // /C:/... -> C:/...
    app = await importTestableApp(cleanPath);
  });

  test("parseNum", () => {
    expect(app.parseNum("3,5")).toBeCloseTo(3.5);
    expect(app.parseNum("abc")).toBeNull();
    expect(app.parseNum(7)).toBe(7);
  });

  test("paramsFromUI", () => {
    const p = app.paramsFromUI();
    expect(p.lat).toBeCloseTo(47.3769);
    expect(p.lon).toBeCloseTo(8.5417);
    expect(p.hourly).toBe("temperature_2m,weather_code");
    expect(p.tz).toBe("Europe/Zurich");
  });

  test("syncToURL & syncFromURL", () => {
    app.syncToURL({ lat: 1.23, lon: 4.56, hourly: "h", tz: "UTC" });
    expect(window.location.search).toContain("lat=1.23");
    // reset inputs und zurück aus der URL lesen
    document.getElementById("lat").value = "";
    app.syncFromURL();
    expect(document.getElementById("lat").value).toBe("1.23");
  });

  test("buildURL", () => {
    localStorage.removeItem("OPEN_METEO_API_BASE");
    const url = app.buildURL({ lat: 1, lon: 2, hourly: "h", tz: "UTC" });
    expect(url).toMatch(/api\.open-meteo\.com/);
    expect(url).toContain("latitude=1");
    expect(url).toContain("longitude=2");
  });

  test("weatherIcon/Text", () => {
    expect(app.weatherIcon(0)).toBeTypeOf("string");
    expect(app.weatherText(0)).toBeTypeOf("string");
    expect(app.weatherText(999)).toMatch(/Unbekannt/i);
  });

  test("setStatus", () => {
    const el = document.getElementById("status");
    app.setStatus("Hallo", "ok");
    expect(el.textContent).toBe("Hallo");
    expect(el.className).toBe("ok");
  });

  test("setWeatherBackground", () => {
    app.setWeatherBackground(0);
    expect(document.body.getAttribute("data-weather")).toBeTruthy();
  });

  test("renderTable", () => {
    app.renderTable({
      time: ["2025-01-01T00:00"],
      temperature_2m: [5],
      weather_code: [0],
    });
    const rows = document.querySelectorAll("#hours tbody tr");
    expect(rows.length).toBe(1);
  });

  test("renderChart", () => {
    app.renderChart({ time: ["2025-01-01T00:00"], temperature_2m: [5] });
    expect(global.Chart).toHaveBeenCalled();
  });

  test("fetchJSON", async () => {
    const data = await app.fetchJSON("https://example.test/api");
    expect(data.hourly.time.length).toBe(1);
  });

  test("geolocate", async () => {
  
  const geoSpy = vi.spyOn(navigator.geolocation, "getCurrentPosition");
  await app.geolocate();

  expect(Number(document.getElementById("lat").value)).toBeCloseTo(10, 4);
  expect(Number(document.getElementById("lon").value)).toBeCloseTo(20, 4);
  expect(geoSpy).toHaveBeenCalled();
});

});
