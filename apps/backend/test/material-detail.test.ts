import { apiErrorSchema, materialSchema } from "@material-register/shared";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { insertManufacturer, insertMaterial, insertPlant } from "./fixtures";

const app = createApp();

describe("GET /api/materials/:materialNumber", () => {
  it("returns the one material with that number, with its plant and manufacturer", async () => {
    const plant = await insertPlant("2000", "Sydney");
    const manufacturer = await insertManufacturer("Parker");
    await insertMaterial({ plantId: plant.id, manufacturerId: manufacturer.id });
    await insertMaterial({
      plantId: plant.id,
      manufacturerId: manufacturer.id,
      materialNumber: "MAT-004242",
      description: "Hose, hydraulic, 1/2in, 2-wire braid",
      materialType: "CONSUMABLE",
      manufacturerPartNumber: "451TC-8",
      status: "PENDING_REVIEW",
      unitOfMeasure: "M",
      unitPrice: "18.40",
      quantityOnHand: 120,
      updatedAt: new Date("2026-03-01T04:30:00Z"),
    });

    const res = await app.request("/api/materials/MAT-004242");

    expect(res.status).toBe(200);
    expect(materialSchema.parse(await res.json())).toMatchObject({
      materialNumber: "MAT-004242",
      description: "Hose, hydraulic, 1/2in, 2-wire braid",
      materialType: "CONSUMABLE",
      manufacturer: { name: "Parker" },
      manufacturerPartNumber: "451TC-8",
      plant: { code: "2000", name: "Sydney" },
      status: "PENDING_REVIEW",
      unitOfMeasure: "M",
      unitPrice: "18.40",
      quantityOnHand: 120,
      updatedAt: "2026-03-01T04:30:00.000Z",
    });
  });

  it("matches the material number case-insensitively", async () => {
    const plant = await insertPlant();
    const manufacturer = await insertManufacturer();
    await insertMaterial({
      plantId: plant.id,
      manufacturerId: manufacturer.id,
      materialNumber: "MAT-000777",
    });

    const res = await app.request("/api/materials/mat-000777");

    expect(res.status).toBe(200);
    expect(materialSchema.parse(await res.json()).materialNumber).toBe("MAT-000777");
  });

  it("answers 404 NOT_FOUND naming the material when no material has that number", async () => {
    const res = await app.request("/api/materials/MAT-999999");

    expect(res.status).toBe(404);
    expect(apiErrorSchema.parse(await res.json()).error).toEqual({
      code: "NOT_FOUND",
      message: "Material MAT-999999 not found.",
    });
  });
});
