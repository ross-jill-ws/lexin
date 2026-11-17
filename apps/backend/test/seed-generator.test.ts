import { describe, expect, it } from "vitest";
import { generateSeed } from "../src/db/seed/generate";

const { materials } = generateSeed({ count: 5000 });

const share = (predicate: (m: (typeof materials)[number]) => boolean) =>
  materials.filter(predicate).length / materials.length;

describe("generateSeed", () => {
  it("numbers the requested count of materials sequentially from MAT-000001", () => {
    expect(materials).toHaveLength(5000);
    expect(materials[0]?.materialNumber).toBe("MAT-000001");
    expect(materials[4999]?.materialNumber).toBe("MAT-005000");
    expect(new Set(materials.map((m) => m.materialNumber)).size).toBe(5000);
  });

  it("weights statuses roughly 75% Active, 15% Obsolete, 10% Pending Review", () => {
    expect(share((m) => m.status === "ACTIVE")).toBeCloseTo(0.75, 1);
    expect(share((m) => m.status === "OBSOLETE")).toBeCloseTo(0.15, 1);
    expect(share((m) => m.status === "PENDING_REVIEW")).toBeCloseTo(0.1, 1);
  });

  it("skews quantity on hand toward low values", () => {
    const quantities = materials.map((m) => m.quantityOnHand).sort((a, b) => a - b);
    const median = quantities[quantities.length / 2] ?? 0;
    const max = quantities.at(-1) ?? 0;
    expect(quantities[0]).toBe(0);
    expect(share((m) => m.quantityOnHand <= 20)).toBeGreaterThan(0.4);
    expect(median).toBeLessThan(max / 10);
  });

  it("spreads updated-at over the three years before the reference date", () => {
    const referenceDate = new Date("2026-11-01T00:00:00Z");
    const threeYearsBefore = new Date("2023-11-01T00:00:00Z");
    const times = generateSeed({ count: 2000, referenceDate }).materials.map((m) =>
      m.updatedAt.getTime(),
    );
    expect(Math.min(...times)).toBeGreaterThanOrEqual(threeYearsBefore.getTime());
    expect(Math.max(...times)).toBeLessThanOrEqual(referenceDate.getTime());
    expect(Math.min(...times)).toBeLessThan(new Date("2024-02-01T00:00:00Z").getTime());
    expect(Math.max(...times)).toBeGreaterThan(new Date("2026-08-01T00:00:00Z").getTime());
  });

  it("is deterministic: the same options always produce identical data", () => {
    expect(generateSeed({ count: 500 })).toEqual(generateSeed({ count: 500 }));
    expect(generateSeed({ count: 500, seed: 1 })).not.toEqual(
      generateSeed({ count: 500, seed: 2 }),
    );
  });

  it("seeds the eight Australian plants and about 25 real manufacturers", () => {
    const seed = generateSeed({ count: 0 });
    expect(seed.plants.map((p) => `${p.code} ${p.name}`)).toEqual([
      "1000 Brisbane",
      "1100 Gladstone",
      "1200 Mackay",
      "2000 Sydney",
      "2100 Newcastle",
      "3000 Melbourne",
      "4000 Perth",
      "4100 Kalgoorlie",
    ]);
    const names = seed.manufacturers.map((m) => m.name);
    expect(names).toHaveLength(25);
    expect(names).toEqual(expect.arrayContaining(["SKF", "Gates", "Parker", "Loctite", "Mobil"]));
  });

  it("ties every material to a seeded plant and manufacturer, across all four material types", () => {
    const { plants, manufacturers } = generateSeed({ count: 0 });
    const plantCodes = new Set(plants.map((p) => p.code));
    const names = new Set(manufacturers.map((m) => m.name));
    expect(materials.every((m) => plantCodes.has(m.plantCode))).toBe(true);
    expect(materials.every((m) => names.has(m.manufacturerName))).toBe(true);
    expect(new Set(materials.map((m) => m.plantCode)).size).toBe(8);
    expect(new Set(materials.map((m) => m.manufacturerName)).size).toBe(25);
    expect(new Set(materials.map((m) => m.materialType))).toEqual(
      new Set(["SPARE_PART", "CONSUMABLE", "RAW_MATERIAL", "TOOL"]),
    );
    expect(materials.every((m) => /^\d+\.\d{2}$/.test(m.unitPrice))).toBe(true);
  });

  it("uses realistic part numbers, e.g. SKF deep groove ball bearings like 6205-2RS1", () => {
    const skfBallBearings = materials.filter(
      (m) => m.manufacturerName === "SKF" && m.description.startsWith("Bearing, deep groove ball"),
    );
    expect(skfBallBearings.length).toBeGreaterThan(0);
    for (const m of skfBallBearings)
      expect(m.manufacturerPartNumber).toMatch(/^6[23]0\d(-2RS1|-2Z)?$/);
    expect(materials.some((m) => m.manufacturerPartNumber === "6205-2RS1")).toBe(true);
    const gatesBelts = materials.filter((m) => m.description.startsWith("V-belt"));
    expect(
      gatesBelts.every(
        (m) => m.manufacturerName === "Gates" && /^[ABC]\d+$/.test(m.manufacturerPartNumber),
      ),
    ).toBe(true);
  });
});
