import request from "supertest";
import app from "../src/index.js";
import * as openMeteo from "../src/services/openMeteo.js"; 
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("Weather Controller (/api/forecast)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("soll 400 zurückgeben, wenn latitude fehlt", async () => {
    const res = await request(app).get("/api/forecast?longitude=7&hourly=temp");
    expect(res.status).toBe(400);
  });

  it("soll 400 zurückgeben, wenn keine hourly/daily/current Parameter gesetzt sind", async () => {
    const res = await request(app).get("/api/forecast?latitude=47&longitude=7");
    expect(res.status).toBe(400);
  });

  it("soll Forecast zurückgeben (Happy Path)", async () => {
    vi.spyOn(openMeteo, "getForecast").mockResolvedValue({
      mock: true,
      params: { latitude: "47", longitude: "7", hourly: "temperature_2m" },
      data: { hourly: { time: ["2025-01-01T00:00"], temperature_2m: [1] } },
    });

    const res = await request(app).get(
      "/api/forecast?latitude=47&longitude=7&hourly=temperature_2m"
    );

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("mock", true); 
    expect(res.body.params).toHaveProperty("latitude", "47");
  });

  it("soll 502 zurückgeben, wenn Service einen Fehler wirft", async () => {
    vi.spyOn(openMeteo, "getForecast").mockRejectedValueOnce(
      new Error("Service kaputt")
    );

    const res = await request(app).get(
      "/api/forecast?latitude=47&longitude=7&hourly=temperature_2m"
    );

    expect(res.status).toBe(502);
  });
});
