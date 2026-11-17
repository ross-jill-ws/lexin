import { materialsResponseSchema } from "@material-register/shared";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { seedDatabase } from "../src/db/seed";
import { env } from "../src/env";

const app = createApp();

async function firstPage() {
  const res = await app.request("/api/materials");
  expect(res.status).toBe(200);
  return materialsResponseSchema.parse(await res.json());
}

describe("seedDatabase", () => {
  it("fills the target database with 5,000 materials the API can serve", async () => {
    await seedDatabase(env.TEST_DATABASE_URL);

    const body = await firstPage();
    expect(body).toMatchObject({ total: 5000, totalPages: 500 });
    expect(body.data).toHaveLength(10);
    expect(body.data[0]?.materialNumber).toMatch(/^MAT-00\d{4}$/);
  });

  it("is idempotent and deterministic: re-running yields the same data with no duplicates", async () => {
    await seedDatabase(env.TEST_DATABASE_URL, { count: 300 });
    const first = await firstPage();

    await seedDatabase(env.TEST_DATABASE_URL, { count: 300 });
    const second = await firstPage();

    expect(second.total).toBe(300);
    // Identical rows, ids included, so identities were restarted too.
    expect(second).toEqual(first);
  });
});
