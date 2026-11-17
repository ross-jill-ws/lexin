import { apiErrorSchema, materialsResponseSchema } from "@material-register/shared";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { insertManufacturer, insertMaterial, insertPlant } from "./fixtures";

const app = createApp();

/** Material numbers returned for `query`, sorted by material number. */
async function materialNumbers(query: string) {
  const res = await app.request(`/api/materials?sort=materialNumber&order=asc&${query}`);
  expect(res.status).toBe(200);
  const body = materialsResponseSchema.parse(await res.json());
  expect(body.total).toBe(body.data.length);
  return body.data.map((m) => m.materialNumber);
}

/**
 * Six materials across two plants, every type and status:
 *
 * | number     | plant | type         | status         | description          |
 * | MAT-000001 | 1000  | SPARE_PART   | ACTIVE         | Bearing, ball        |
 * | MAT-000002 | 1000  | SPARE_PART   | OBSOLETE       | Bearing, roller      |
 * | MAT-000003 | 2000  | SPARE_PART   | ACTIVE         | Bearing, tapered     |
 * | MAT-000004 | 1000  | CONSUMABLE   | ACTIVE         | Grease, lithium      |
 * | MAT-000005 | 2000  | TOOL         | PENDING_REVIEW | Bearing puller       |
 * | MAT-000006 | 2000  | RAW_MATERIAL | ACTIVE         | Steel bar            |
 */
async function insertCatalogue() {
  const brisbane = await insertPlant("1000", "Brisbane");
  const gladstone = await insertPlant("2000", "Gladstone");
  const { id: manufacturerId } = await insertManufacturer("SKF");
  const rows = [
    [brisbane, "SPARE_PART", "ACTIVE", "Bearing, ball"],
    [brisbane, "SPARE_PART", "OBSOLETE", "Bearing, roller"],
    [gladstone, "SPARE_PART", "ACTIVE", "Bearing, tapered"],
    [brisbane, "CONSUMABLE", "ACTIVE", "Grease, lithium"],
    [gladstone, "TOOL", "PENDING_REVIEW", "Bearing puller"],
    [gladstone, "RAW_MATERIAL", "ACTIVE", "Steel bar"],
  ] as const;
  for (const [i, [plant, materialType, status, description]] of rows.entries()) {
    await insertMaterial({
      plantId: plant.id,
      manufacturerId,
      materialType,
      status,
      description,
      materialNumber: `MAT-00000${i + 1}`,
    });
  }
}

describe("GET /api/materials filters", () => {
  it("filters by one material type", async () => {
    await insertCatalogue();

    expect(await materialNumbers("type=CONSUMABLE")).toEqual(["MAT-000004"]);
  });

  it("filters by several material types (OR within the filter)", async () => {
    await insertCatalogue();

    expect(await materialNumbers("type=CONSUMABLE,TOOL")).toEqual(["MAT-000004", "MAT-000005"]);
  });

  it("filters by status", async () => {
    await insertCatalogue();

    expect(await materialNumbers("status=OBSOLETE")).toEqual(["MAT-000002"]);
    expect(await materialNumbers("status=OBSOLETE,PENDING_REVIEW")).toEqual([
      "MAT-000002",
      "MAT-000005",
    ]);
  });

  it("filters by plant code", async () => {
    await insertCatalogue();

    expect(await materialNumbers("plant=2000")).toEqual(["MAT-000003", "MAT-000005", "MAT-000006"]);
    expect(await materialNumbers("plant=1000,2000")).toHaveLength(6);
  });

  it("ANDs different filters together", async () => {
    await insertCatalogue();

    expect(await materialNumbers("type=SPARE_PART&status=ACTIVE")).toEqual([
      "MAT-000001",
      "MAT-000003",
    ]);
    expect(await materialNumbers("type=SPARE_PART&status=ACTIVE&plant=1000")).toEqual([
      "MAT-000001",
    ]);
  });

  it("combines filters with search", async () => {
    await insertCatalogue();

    expect(await materialNumbers("q=bearing&status=ACTIVE&plant=1000")).toEqual(["MAT-000001"]);
    expect(await materialNumbers("q=bearing&plant=2000")).toEqual(["MAT-000003", "MAT-000005"]);
  });

  it("counts only filtered materials in the totals", async () => {
    await insertCatalogue();

    const res = await app.request("/api/materials?type=SPARE_PART&pageSize=10");

    expect(materialsResponseSchema.parse(await res.json())).toMatchObject({
      total: 3,
      totalPages: 1,
    });
  });

  it("returns nothing for a plant code that does not exist", async () => {
    await insertCatalogue();

    expect(await materialNumbers("plant=9999")).toEqual([]);
  });

  it("ignores blank, padded and repeated values", async () => {
    await insertCatalogue();

    expect(await materialNumbers("type=")).toHaveLength(6);
    expect(await materialNumbers("type=TOOL,,%20TOOL%20")).toEqual(["MAT-000005"]);
  });

  it("rejects unknown values with a 400 VALIDATION_ERROR naming each bad parameter", async () => {
    const res = await app.request(
      "/api/materials?type=SPARE_PART,WIDGET&status=LOST&plant=10%2000",
    );

    expect(res.status).toBe(400);
    const body = apiErrorSchema.parse(await res.json());
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.issues).toEqual([
      {
        path: "type.1",
        message: "Type must be one of SPARE_PART, CONSUMABLE, RAW_MATERIAL, TOOL.",
      },
      { path: "status.0", message: "Status must be one of ACTIVE, OBSOLETE, PENDING_REVIEW." },
      { path: "plant.0", message: "Plant must be a plant code of 1 to 4 letters or digits." },
    ]);
  });
});
