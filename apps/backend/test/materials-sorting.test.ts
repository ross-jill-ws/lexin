import { apiErrorSchema, materialsResponseSchema } from "@material-register/shared";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { insertManufacturer, insertMaterial, insertPlant } from "./fixtures";

const app = createApp();

async function getMaterialNumbers(query: string) {
  const res = await app.request(`/api/materials?${query}`);
  expect(res.status).toBe(200);
  return materialsResponseSchema.parse(await res.json()).data.map((m) => m.materialNumber);
}

/**
 * Four materials whose values order differently in every column. Material numbers are out of
 * id order, plant names out of code order, and prices/quantities out of string order.
 */
async function insertFourMaterials() {
  const sydney = await insertPlant("1000", "Sydney");
  const brisbane = await insertPlant("2000", "Brisbane");
  const adelaide = await insertPlant("3000", "Adelaide");
  const parker = await insertManufacturer("Parker");
  const skf = await insertManufacturer("SKF");
  const gates = await insertManufacturer("Gates");
  const bosch = await insertManufacturer("Bosch Rexroth");

  // id 1
  await insertMaterial({
    materialNumber: "MAT-000030",
    description: "Valve, ball, 1 inch",
    materialType: "TOOL",
    status: "OBSOLETE",
    plantId: adelaide.id,
    manufacturerId: parker.id,
    unitPrice: "5.00",
    quantityOnHand: 40,
    updatedAt: new Date("2024-03-01T00:00:00Z"),
  });
  // id 2
  await insertMaterial({
    materialNumber: "MAT-000010",
    description: "Bearing, deep groove ball",
    materialType: "SPARE_PART",
    status: "PENDING_REVIEW",
    plantId: sydney.id,
    manufacturerId: skf.id,
    unitPrice: "120.00",
    quantityOnHand: 2,
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  });
  // id 3
  await insertMaterial({
    materialNumber: "MAT-000040",
    description: "Grease, lithium complex",
    materialType: "CONSUMABLE",
    status: "ACTIVE",
    plantId: brisbane.id,
    manufacturerId: gates.id,
    unitPrice: "19.99",
    quantityOnHand: 300,
    updatedAt: new Date("2023-07-01T00:00:00Z"),
  });
  // id 4
  await insertMaterial({
    materialNumber: "MAT-000020",
    description: "Hydraulic fitting, 1/2 inch",
    materialType: "RAW_MATERIAL",
    status: "ACTIVE",
    plantId: sydney.id,
    manufacturerId: bosch.id,
    unitPrice: "0.95",
    quantityOnHand: 15,
    updatedAt: new Date("2025-06-01T00:00:00Z"),
  });
}

describe("GET /api/materials sorting", () => {
  it.each([
    // Ties (status ACTIVE, plant 1000) break on id, in the same direction as the sort.
    ["materialNumber", "asc", ["MAT-000010", "MAT-000020", "MAT-000030", "MAT-000040"]],
    ["materialNumber", "desc", ["MAT-000040", "MAT-000030", "MAT-000020", "MAT-000010"]],
    ["description", "asc", ["MAT-000010", "MAT-000040", "MAT-000020", "MAT-000030"]],
    ["description", "desc", ["MAT-000030", "MAT-000020", "MAT-000040", "MAT-000010"]],
    // Types sort alphabetically: Consumable, Raw Material, Spare Part, Tool.
    ["materialType", "asc", ["MAT-000040", "MAT-000020", "MAT-000010", "MAT-000030"]],
    ["materialType", "desc", ["MAT-000030", "MAT-000010", "MAT-000020", "MAT-000040"]],
    ["status", "asc", ["MAT-000040", "MAT-000020", "MAT-000030", "MAT-000010"]],
    ["status", "desc", ["MAT-000010", "MAT-000030", "MAT-000020", "MAT-000040"]],
    // Plant sorts by code (1000 Sydney, 2000 Brisbane, 3000 Adelaide), not name.
    ["plant", "asc", ["MAT-000010", "MAT-000020", "MAT-000040", "MAT-000030"]],
    ["plant", "desc", ["MAT-000030", "MAT-000040", "MAT-000020", "MAT-000010"]],
    ["manufacturer", "asc", ["MAT-000020", "MAT-000040", "MAT-000030", "MAT-000010"]],
    ["manufacturer", "desc", ["MAT-000010", "MAT-000030", "MAT-000040", "MAT-000020"]],
    // Numeric, not string, order: 0.95 < 5.00 < 19.99 < 120.00.
    ["unitPrice", "asc", ["MAT-000020", "MAT-000030", "MAT-000040", "MAT-000010"]],
    ["unitPrice", "desc", ["MAT-000010", "MAT-000040", "MAT-000030", "MAT-000020"]],
    ["quantityOnHand", "asc", ["MAT-000010", "MAT-000020", "MAT-000030", "MAT-000040"]],
    ["quantityOnHand", "desc", ["MAT-000040", "MAT-000030", "MAT-000020", "MAT-000010"]],
    ["updatedAt", "asc", ["MAT-000040", "MAT-000030", "MAT-000010", "MAT-000020"]],
    ["updatedAt", "desc", ["MAT-000020", "MAT-000010", "MAT-000030", "MAT-000040"]],
  ])("sorts by %s %s", async (sort, order, expected) => {
    await insertFourMaterials();

    expect(await getMaterialNumbers(`sort=${sort}&order=${order}`)).toEqual(expected);
  });

  it("defaults the direction to descending", async () => {
    await insertFourMaterials();

    expect(await getMaterialNumbers("sort=unitPrice")).toEqual([
      "MAT-000010",
      "MAT-000040",
      "MAT-000030",
      "MAT-000020",
    ]);
  });

  it.each(["asc", "desc"])(
    "pages through tied values (%s) by id without skips or repeats",
    async (order) => {
      const plant = await insertPlant();
      const manufacturer = await insertManufacturer();
      const inserted: string[] = [];
      for (let i = 1; i <= 23; i++) {
        const material = await insertMaterial({
          plantId: plant.id,
          manufacturerId: manufacturer.id,
          unitPrice: "10.00",
        });
        inserted.push(material.materialNumber);
      }

      const pages = await Promise.all(
        [1, 2, 3].map((page) =>
          getMaterialNumbers(`sort=unitPrice&order=${order}&pageSize=10&page=${page}`),
        ),
      );

      // Inserted in id order, so ascending id is insertion order.
      expect(pages.flat()).toEqual(order === "asc" ? inserted : [...inserted].reverse());
    },
  );

  it.each([
    ["sort=colour", "sort"],
    ["sort=id", "sort"],
    ["order=up", "order"],
    ["order=ASC", "order"],
  ])("rejects %s with a 400 VALIDATION_ERROR naming the %s field", async (query, field) => {
    const res = await app.request(`/api/materials?${query}`);

    expect(res.status).toBe(400);
    const body = apiErrorSchema.parse(await res.json());
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.issues).toEqual([{ path: field, message: expect.any(String) }]);
  });
});
