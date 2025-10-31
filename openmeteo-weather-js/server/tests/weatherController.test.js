import request from "supertest";
import app from "../src/index.js";
import * as openMeteo from "../src/services/openMeteo.js";
import { describe, it, expect, vi } from "vitest";

// Service mocken
vi.spyOn(openMeteo, "getForecast").mockImplementation(async (params) => {
  return { mock: true, params };
});

describe("Weather Controller (/api/forecast)", () => {
  it("soll 400 zurückgeben, wenn latitude fehlt", async () => {
    const res = await request(app).get("/api/forecast?longitude=7&hourly=temp");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/latitude/);
  });

  it("soll 400 zurückgeben, wenn keine hourly/daily/current Parameter gesetzt sind", async () => {
    const res = await request(app).get("/api/forecast?latitude=47&longitude=7");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Mindestens/);
  });

  it("soll Forecast zurückgeben (Happy Path)", async () => {
    const res = await request(app).get(
      "/api/forecast?latitude=47&longitude=7&hourly=temperature_2m"
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("mock", true);
    expect(res.body.params).toHaveProperty("latitude", "47");
  });

  it("soll 502 zurückgeben, wenn Service einen Fehler wirft", async () => {
    openMeteo.getForecast.mockImplementationOnce(async () => {
      throw new Error("Service kaputt");
    });

    const res = await request(app).get(
      "/api/forecast?latitude=47&longitude=7&hourly=temperature_2m"
    );
    expect(res.status).toBe(502);
    expect(res.body).toHaveProperty("error", "Failed to fetch forecast");
  });


});
