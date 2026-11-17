import { apiErrorSchema, materialsResponseSchema } from "@material-register/shared";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { insertManufacturer, insertMaterial, insertPlant } from "./fixtures";

const app = createApp();

async function searchMaterialNumbers(q: string) {
  const res = await app.request(
    `/api/materials?sort=materialNumber&order=asc&q=${encodeURIComponent(q)}`,
  );
  expect(res.status).toBe(200);
  const body = materialsResponseSchema.parse(await res.json());
  expect(body.total).toBe(body.data.length);
  return body.data.map((m) => m.materialNumber);
}

async function insertCatalogue() {
  const plant = await insertPlant();
  const skf = await insertManufacturer("SKF");
  const ids = { plantId: plant.id, manufacturerId: skf.id };
  await insertMaterial({
    ...ids,
    materialNumber: "MAT-000123",
    description: "Bearing, deep groove ball, 25mm bore",
    manufacturerPartNumber: "6205-2RS1",
  });
  await insertMaterial({
    ...ids,
    materialNumber: "MAT-000456",
    description: "V-belt, SPA profile",
    manufacturerPartNumber: "SPA-1250",
  });
  await insertMaterial({
    ...ids,
    materialNumber: "MAT-000789",
    description: "Filter, 100% polyester, 5_micron",
    manufacturerPartNumber: "FLT\\100",
  });
}

describe("GET /api/materials search", () => {
  it("matches part of the material number", async () => {
    await insertCatalogue();

    expect(await searchMaterialNumbers("000123")).toEqual(["MAT-000123"]);
  });

  it("matches part of the description", async () => {
    await insertCatalogue();

    expect(await searchMaterialNumbers("deep groove")).toEqual(["MAT-000123"]);
  });

  it("matches part of the manufacturer part number", async () => {
    await insertCatalogue();

    expect(await searchMaterialNumbers("1250")).toEqual(["MAT-000456"]);
  });

  it("ORs the fields together", async () => {
    await insertCatalogue();

    // "spa" is in MAT-000456's description and MPN; "mat-000789" only in a material number.
    expect(await searchMaterialNumbers("SPA")).toEqual(["MAT-000456"]);
    expect(await searchMaterialNumbers("2rs1")).toEqual(["MAT-000123"]);
    expect(await searchMaterialNumbers("mat-000")).toEqual([
      "MAT-000123",
      "MAT-000456",
      "MAT-000789",
    ]);
  });

  it.each(["BEARING", "bearing", "BeArInG"])("ignores case (%s)", async (q) => {
    await insertCatalogue();

    expect(await searchMaterialNumbers(q)).toEqual(["MAT-000123"]);
  });

  it.each([
    // Unescaped, "%" and "_" would be wildcards matching every material.
    ["%", ["MAT-000789"]],
    ["_", ["MAT-000789"]],
    ["5_micron", ["MAT-000789"]],
    ["5_m", ["MAT-000789"]],
    ["0%", ["MAT-000789"]],
    // Unescaped, "\" would escape the next character instead of matching itself.
    ["\\", ["MAT-000789"]],
    ["T\\1", ["MAT-000789"]],
    ["groove%ball", []],
    ["SP_", []],
  ])("matches %j literally", async (q, expected) => {
    await insertCatalogue();

    expect(await searchMaterialNumbers(q)).toEqual(expected);
  });

  it("ignores leading and trailing whitespace", async () => {
    await insertCatalogue();

    expect(await searchMaterialNumbers("  deep groove \t")).toEqual(["MAT-000123"]);
  });

  it.each(["", "   "])("treats a blank term (%j) as no search", async (q) => {
    await insertCatalogue();

    expect(await searchMaterialNumbers(q)).toHaveLength(3);
  });

  it("returns an empty page with zero totals when nothing matches", async () => {
    await insertCatalogue();

    const res = await app.request("/api/materials?q=no-such-part");

    expect(materialsResponseSchema.parse(await res.json())).toEqual({
      data: [],
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    });
  });

  it("pages through the matches, counting only matches in the totals", async () => {
    const plant = await insertPlant();
    const skf = await insertManufacturer();
    for (let i = 1; i <= 12; i++) {
      await insertMaterial({
        plantId: plant.id,
        manufacturerId: skf.id,
        description: i % 2 ? `Bearing ${i}` : `Seal ${i}`,
      });
    }

    const res = await app.request("/api/materials?q=bearing&pageSize=10&page=1");

    const body = materialsResponseSchema.parse(await res.json());
    expect(body).toMatchObject({ total: 6, totalPages: 1 });
    expect(body.data.every((m) => m.description.startsWith("Bearing"))).toBe(true);
  });

  it("accepts a term of exactly 100 characters, measured after trimming", async () => {
    await insertCatalogue();

    expect(await searchMaterialNumbers(` ${"a".repeat(100)} `)).toEqual([]);
  });

  it("rejects a term over 100 characters with a 400 VALIDATION_ERROR naming q", async () => {
    const res = await app.request(`/api/materials?q=${"a".repeat(101)}`);

    expect(res.status).toBe(400);
    const body = apiErrorSchema.parse(await res.json());
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.issues).toEqual([
      { path: "q", message: "Search must be 100 characters or fewer." },
    ]);
  });

  it("rejects a term containing a NUL byte with a 400 VALIDATION_ERROR instead of a 500", async () => {
    const res = await app.request("/api/materials?q=%00abc");

    expect(res.status).toBe(400);
    const body = apiErrorSchema.parse(await res.json());
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.issues?.[0]?.path).toBe("q");
  });
});
