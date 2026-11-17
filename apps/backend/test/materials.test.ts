import { apiErrorSchema, materialsResponseSchema } from "@material-register/shared";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { insertManufacturer, insertMaterial, insertPlant } from "./fixtures";

const app = createApp();

describe("GET /api/materials", () => {
  it("returns page 1 of materials, most recently updated first, with nested plant and manufacturer", async () => {
    const plant = await insertPlant("1000", "Brisbane");
    const skf = await insertManufacturer("SKF");
    const ids = { plantId: plant.id, manufacturerId: skf.id };
    await insertMaterial({
      ...ids,
      materialNumber: "MAT-000001",
      description: "Bearing, deep groove ball, 25mm bore",
      manufacturerPartNumber: "6205-2RS1",
      unitPrice: "12.5",
      quantityOnHand: 7,
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    });
    await insertMaterial({
      ...ids,
      materialNumber: "MAT-000002",
      updatedAt: new Date("2025-06-01T00:00:00Z"),
    });
    // Same updated-at as MAT-000002: the higher id comes first (id tiebreaker, descending).
    await insertMaterial({
      ...ids,
      materialNumber: "MAT-000003",
      updatedAt: new Date("2025-06-01T00:00:00Z"),
    });

    const res = await app.request("/api/materials");

    expect(res.status).toBe(200);
    const body = materialsResponseSchema.parse(await res.json());
    expect(body).toMatchObject({ page: 1, pageSize: 10, total: 3, totalPages: 1 });
    expect(body.data.map((m) => m.materialNumber)).toEqual([
      "MAT-000003",
      "MAT-000002",
      "MAT-000001",
    ]);
    expect(body.data[2]).toEqual({
      id: 1,
      materialNumber: "MAT-000001",
      description: "Bearing, deep groove ball, 25mm bore",
      materialType: "SPARE_PART",
      manufacturer: { name: "SKF" },
      manufacturerPartNumber: "6205-2RS1",
      plant: { code: "1000", name: "Brisbane" },
      status: "ACTIVE",
      unitOfMeasure: "EA",
      unitPrice: "12.50",
      quantityOnHand: 7,
      updatedAt: "2024-01-01T00:00:00.000Z",
    });
  });

  it("returns at most 10 materials on page 1 with the correct totals", async () => {
    const plant = await insertPlant();
    const manufacturer = await insertManufacturer();
    for (let i = 0; i < 30; i++) {
      await insertMaterial({ plantId: plant.id, manufacturerId: manufacturer.id });
    }

    const res = await app.request("/api/materials");
    const body = materialsResponseSchema.parse(await res.json());

    expect(body.data).toHaveLength(10);
    expect(body).toMatchObject({ page: 1, pageSize: 10, total: 30, totalPages: 3 });
  });

  describe("pagination", () => {
    /** Inserts `n` materials with strictly decreasing updated-at, so MAT order is page order. */
    async function insertMaterials(n: number) {
      const plant = await insertPlant();
      const manufacturer = await insertManufacturer();
      for (let i = 0; i < n; i++) {
        await insertMaterial({
          plantId: plant.id,
          manufacturerId: manufacturer.id,
          materialNumber: `MAT-${String(i + 1).padStart(6, "0")}`,
          updatedAt: new Date(Date.UTC(2025, 0, 1) - i * 60_000),
        });
      }
    }

    async function getPage(query: string) {
      const res = await app.request(`/api/materials?${query}`);
      expect(res.status).toBe(200);
      return materialsResponseSchema.parse(await res.json());
    }

    it("returns the requested page at the requested page size", async () => {
      await insertMaterials(23);

      const body = await getPage("page=2&pageSize=10");

      expect(body).toMatchObject({ page: 2, pageSize: 10, total: 23, totalPages: 3 });
      expect(body.data.map((m) => m.materialNumber)).toEqual([
        "MAT-000011",
        "MAT-000012",
        "MAT-000013",
        "MAT-000014",
        "MAT-000015",
        "MAT-000016",
        "MAT-000017",
        "MAT-000018",
        "MAT-000019",
        "MAT-000020",
      ]);
    });

    it("returns a partial last page", async () => {
      await insertMaterials(23);

      const body = await getPage("page=3&pageSize=10");

      expect(body.data.map((m) => m.materialNumber)).toEqual([
        "MAT-000021",
        "MAT-000022",
        "MAT-000023",
      ]);
      expect(body).toMatchObject({ page: 3, total: 23, totalPages: 3 });
    });

    it("returns empty data with the correct totals for a page past the end", async () => {
      await insertMaterials(23);

      const body = await getPage("page=9&pageSize=10");

      expect(body).toEqual({ data: [], page: 9, pageSize: 10, total: 23, totalPages: 3 });
    });

    it("reports zero pages when there are no materials", async () => {
      const body = await getPage("");

      expect(body).toEqual({ data: [], page: 1, pageSize: 10, total: 0, totalPages: 0 });
    });

    it.each([
      ["page=0", "page"],
      ["page=-1", "page"],
      ["page=1.5", "page"],
      ["page=abc", "page"],
      ["pageSize=20", "pageSize"],
      ["pageSize=abc", "pageSize"],
    ])("rejects %s with a 400 VALIDATION_ERROR naming the %s field", async (query, field) => {
      const res = await app.request(`/api/materials?${query}`);

      expect(res.status).toBe(400);
      const body = apiErrorSchema.parse(await res.json());
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toBeTruthy();
      expect(body.error.issues).toEqual([{ path: field, message: expect.any(String) }]);
    });

    it("lists every invalid field at once", async () => {
      const res = await app.request("/api/materials?page=0&pageSize=7");

      expect(res.status).toBe(400);
      const body = apiErrorSchema.parse(await res.json());
      expect(body.error.issues?.map((i) => i.path).sort()).toEqual(["page", "pageSize"]);
    });
  });
});
