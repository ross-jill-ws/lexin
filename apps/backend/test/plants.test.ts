import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { insertPlant } from "./fixtures";

const app = createApp();

describe("GET /api/plants", () => {
  it("returns every plant with id, code and name, ordered by code", async () => {
    const gladstone = await insertPlant("2000", "Gladstone");
    const brisbane = await insertPlant("1000", "Brisbane");
    const perth = await insertPlant("7000", "Perth");

    const res = await app.request("/api/plants");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { id: brisbane.id, code: "1000", name: "Brisbane" },
      { id: gladstone.id, code: "2000", name: "Gladstone" },
      { id: perth.id, code: "7000", name: "Perth" },
    ]);
  });

  it("returns an empty list when there are no plants", async () => {
    const res = await app.request("/api/plants");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});
