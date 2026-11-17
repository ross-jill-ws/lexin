import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { runBenchmark, withDatabaseName } from "../src/db/bench";
import { env } from "../src/env";
import { insertManufacturer, insertMaterial, insertPlant } from "./fixtures";

/** A throwaway bench database, so the test never clobbers a real 200k benchmark run. */
const benchUrl = withDatabaseName(env.TEST_DATABASE_URL, "lexin_bench_test");

describe("runBenchmark", () => {
  it("refuses to run against the app or test database", async () => {
    await expect(runBenchmark({ databaseUrl: env.TEST_DATABASE_URL, count: 10 })).rejects.toThrow(
      /separate/,
    );
    await expect(runBenchmark({ databaseUrl: env.DATABASE_URL, count: 10 })).rejects.toThrow(
      /separate/,
    );
  });

  it("refuses the app or test database however its server is spelled", async () => {
    const alias = (url: string) => {
      const aliased = new URL(url);
      aliased.hostname = "127.0.0.1";
      return aliased.toString();
    };

    await expect(runBenchmark({ databaseUrl: alias(env.DATABASE_URL), count: 10 })).rejects.toThrow(
      /separate/,
    );
    await expect(
      runBenchmark({ databaseUrl: alias(env.TEST_DATABASE_URL), count: 10 }),
    ).rejects.toThrow(/separate/);
  });

  it("refuses a database whose name doesn't mark it as a bench database", async () => {
    await expect(
      runBenchmark({
        databaseUrl: withDatabaseName(env.TEST_DATABASE_URL, "inventory"),
        count: 10,
      }),
    ).rejects.toThrow(/lexin_bench/);
  });

  it("times each representative search with and without the trigram indexes in its own database", async () => {
    const plant = await insertPlant();
    const manufacturer = await insertManufacturer();
    await insertMaterial({ plantId: plant.id, manufacturerId: manufacturer.id });

    const result = await runBenchmark({ databaseUrl: benchUrl, count: 2000, runs: 1 });

    expect(result.rows).toBe(2000);
    expect(result.searches.map((s) => s.label)).toEqual([
      "Material number fragment",
      "Description word",
      "MPN fragment",
    ]);
    for (const search of result.searches) {
      expect(search.matches).toBeGreaterThan(0);
      expect(search.withIndexes.ms).toBeGreaterThan(0);
      expect(search.withoutIndexes.ms).toBeGreaterThan(0);
      expect(search.withoutIndexes.usesTrigramIndex).toBe(false);
    }

    // The test database still holds exactly what this test put there.
    const res = await createApp().request("/api/materials");
    expect(await res.json()).toMatchObject({ total: 1 });
  }, 120_000);

  it("restores the trigram indexes after each without-index pass", async () => {
    const result = await runBenchmark({ databaseUrl: benchUrl, count: 20_000, runs: 1 });

    // Searches are measured one after another, so every later "with" pass proves the
    // previous search's dropped indexes came back.
    for (const search of result.searches) {
      expect(search.withIndexes.usesTrigramIndex).toBe(true);
    }
  }, 120_000);
});
