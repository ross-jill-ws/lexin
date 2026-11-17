/**
 * Loads the deterministic Material Register seed into a database.
 *
 *   pnpm db:seed                                   # 5,000 materials into DATABASE_URL
 *   pnpm db:seed --count 200000 --database-url ... # e.g. a larger dataset
 */
import { parseArgs } from "node:util";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import { manufacturers, materials, plants } from "./schema";
import { generateSeed, type SeedOptions } from "./seed/generate";

/** Rows per INSERT: 1,000 rows x 11 columns stays far below Postgres' 65,535 parameter limit. */
const BATCH_SIZE = 1000;

/** Truncates the register and reloads it in one transaction. Returns the inserted counts. */
export async function seedDatabase(url: string, options: SeedOptions = {}) {
  const seed = generateSeed(options);
  const client = postgres(url, { max: 1, onnotice: () => {} });
  const db = drizzle(client);

  try {
    await db.transaction(async (tx) => {
      await tx.execute("TRUNCATE materials, manufacturers, plants RESTART IDENTITY CASCADE");

      const plantRows = await tx.insert(plants).values(seed.plants).returning();
      const manufacturerRows = await tx
        .insert(manufacturers)
        .values(seed.manufacturers)
        .returning();
      const plantIds = new Map(plantRows.map((p) => [p.code, p.id]));
      const manufacturerIds = new Map(manufacturerRows.map((m) => [m.name, m.id]));

      for (let start = 0; start < seed.materials.length; start += BATCH_SIZE) {
        const batch = seed.materials
          .slice(start, start + BATCH_SIZE)
          .map(({ plantCode, manufacturerName, ...material }) => ({
            ...material,
            plantId: lookup(plantIds, plantCode),
            manufacturerId: lookup(manufacturerIds, manufacturerName),
          }));
        await tx.insert(materials).values(batch);
      }
    });
  } finally {
    await client.end();
  }

  return {
    plants: seed.plants.length,
    manufacturers: seed.manufacturers.length,
    materials: seed.materials.length,
  };
}

function lookup(ids: Map<string, number>, key: string): number {
  const id = ids.get(key);
  if (id === undefined) throw new Error(`Seed references unknown key "${key}"`);
  return id;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { values } = parseArgs({
    options: { count: { type: "string" }, "database-url": { type: "string" } },
  });
  const count = values.count === undefined ? undefined : Number(values.count);
  if (count !== undefined && (!Number.isInteger(count) || count < 0)) {
    throw new Error(`--count must be a non-negative integer, got "${values.count}"`);
  }
  const counts = await seedDatabase(values["database-url"] ?? env.DATABASE_URL, { count });
  console.log(
    `Seeded ${counts.plants} plants, ${counts.manufacturers} manufacturers, ${counts.materials} materials.`,
  );
}
