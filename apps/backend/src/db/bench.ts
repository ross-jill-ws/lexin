/**
 * Measures how much the trigram indexes speed up search.
 *
 *   pnpm db:bench                          # 200,000 materials in the lexin_bench database
 *   pnpm db:bench --count 50000 --runs 3   # smaller / quicker
 *   pnpm db:bench --database-url URL       # another server; the name must start with lexin_bench
 *
 * It drops and recreates a separate bench database, migrates it, seeds it with the same generator as
 * `db:seed`, then runs EXPLAIN ANALYZE on the exact SQL the API issues for a few representative
 * searches: first with the trigram indexes, then with them dropped inside a transaction that is
 * rolled back. The app and test databases are never touched.
 */
import { parseArgs } from "node:util";
import { materialsQuerySchema } from "@material-register/shared";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type ReservedSql, type Sql } from "postgres";
import { env } from "../env";
import { createMaterialsRepository } from "../repositories/materials-repository";
import { runMigrations } from "./migrate";
import * as schema from "./schema";
import { seedDatabase } from "./seed";

export const BENCH_SEARCHES = [
  { label: "Material number fragment", q: "1234" },
  { label: "Description word", q: "spherical" },
  { label: "MPN fragment", q: "6205" },
] as const;

const TRIGRAM_INDEXES = [
  "materials_material_number_trgm_idx",
  "materials_description_trgm_idx",
  "materials_mpn_trgm_idx",
];

export type Timing = {
  /** Median execution time of the request's SQL (page query + count query), in ms. */
  ms: number;
  usesTrigramIndex: boolean;
};

export type BenchmarkResult = {
  rows: number;
  runs: number;
  searches: {
    label: string;
    q: string;
    matches: number;
    withIndexes: Timing;
    withoutIndexes: Timing;
  }[];
};

type Statement = { query: string; params: unknown[] };

/** The same server and credentials, pointing at another database. */
export function withDatabaseName(url: string, name: string): string {
  const target = new URL(url);
  target.pathname = `/${name}`;
  return target.toString();
}

const databaseName = (url: string) => decodeURIComponent(new URL(url).pathname.slice(1));

/**
 * The benchmark drops its database, so it only runs against one named for it. Names are compared,
 * not whole URLs, because the same server answers to many hostnames (localhost, 127.0.0.1, ...).
 */
function assertBenchDatabase(url: string) {
  const name = databaseName(url);
  const protectedNames = [env.DATABASE_URL, env.TEST_DATABASE_URL].map(databaseName);
  if (protectedNames.includes(name)) {
    throw new Error("The benchmark needs a separate database, not the app or test database.");
  }
  if (!name.startsWith("lexin_bench")) {
    throw new Error(
      `The benchmark drops its database, so its name must start with lexin_bench (got "${name}").`,
    );
  }
}

export async function runBenchmark({
  databaseUrl,
  count = 200_000,
  runs = 5,
  log = () => {},
}: {
  databaseUrl: string;
  count?: number;
  runs?: number;
  log?: (message: string) => void;
}): Promise<BenchmarkResult> {
  assertBenchDatabase(databaseUrl);

  await recreateDatabase(databaseUrl);
  await runMigrations(databaseUrl);
  log(`Seeding ${count.toLocaleString("en-AU")} materials…`);
  await seedDatabase(databaseUrl, { count });

  const client = postgres(databaseUrl, { max: 1, onnotice: () => {} });
  try {
    // Flushes the GIN pending lists left by the bulk insert and refreshes planner statistics.
    await client`VACUUM ANALYZE materials`;
    const searches = [];
    for (const { label, q } of BENCH_SEARCHES) {
      log(`Measuring "${q}"…`);
      const { statements, matches } = await captureSearch(client, q);
      const withIndexes = await measure(client, statements, runs);
      const withoutIndexes = await withoutTrigramIndexes(client, (tx) =>
        measure(tx, statements, runs),
      );
      searches.push({ label, q, matches, withIndexes, withoutIndexes });
    }
    return { rows: count, runs, searches };
  } finally {
    await client.end();
  }
}

/** Starts every run from an empty database, so results never depend on a previous run. */
async function recreateDatabase(url: string) {
  const name = databaseName(url);
  const admin = postgres(withDatabaseName(url, "postgres"), { max: 1, onnotice: () => {} });
  try {
    await admin.unsafe(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    await admin.unsafe(`CREATE DATABASE "${name}"`);
  } finally {
    await admin.end();
  }
}

/** Runs one search through the real repository and records the SQL it sends. */
async function captureSearch(client: Sql, q: string) {
  const statements: Statement[] = [];
  const db = drizzle(client, {
    schema,
    logger: { logQuery: (query, params) => statements.push({ query, params }) },
  });
  const { total } = await createMaterialsRepository(db).list(materialsQuerySchema.parse({ q }));
  return { statements, matches: total };
}

/** EXPLAIN ANALYZEs every statement `runs` times; returns the median of their summed times. */
async function measure(
  sql: Sql | ReservedSql,
  statements: Statement[],
  runs: number,
): Promise<Timing> {
  const totals: number[] = [];
  let usesTrigramIndex = false;
  for (let run = 0; run < runs; run += 1) {
    let total = 0;
    for (const { query, params } of statements) {
      const [
        {
          "QUERY PLAN": [plan],
        },
      ] = (await sql.unsafe(
        `EXPLAIN (ANALYZE, FORMAT JSON) ${query}`,
        params as postgres.ParameterOrJSON<never>[],
      )) as unknown as [{ "QUERY PLAN": [{ "Execution Time": number }] }];
      total += plan["Execution Time"];
      usesTrigramIndex ||= JSON.stringify(plan).includes("_trgm_idx");
    }
    totals.push(total);
  }
  return { ms: median(totals), usesTrigramIndex };
}

/** Drops the trigram indexes in a transaction, runs `work`, then rolls back to restore them. */
async function withoutTrigramIndexes<T>(client: Sql, work: (sql: ReservedSql) => Promise<T>) {
  const connection = await client.reserve();
  try {
    await connection`BEGIN`;
    for (const index of TRIGRAM_INDEXES) await connection.unsafe(`DROP INDEX ${index}`);
    return await work(connection);
  } finally {
    await connection`ROLLBACK`;
    connection.release();
  }
}

/** The middle value (the upper one of the middle pair for an even count). */
function median(values: number[]): number {
  return [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? 0;
}

/** A Markdown table, ready to paste into the README. */
export function formatReport({ rows, runs, searches }: BenchmarkResult): string {
  const ms = (t: Timing) => `${t.ms.toFixed(2)} ms`;
  const plan = (t: Timing) => (t.usesTrigramIndex ? "trigram index" : "seq scan");
  return [
    `${rows.toLocaleString("en-AU")} materials, median of ${runs} runs (page query + count query)`,
    "",
    "| Search | Term | Matches | With trigram indexes | Without | Speed-up |",
    "| --- | --- | ---: | ---: | ---: | ---: |",
    ...searches.map(
      (s) =>
        `| ${s.label} | \`${s.q}\` | ${s.matches.toLocaleString("en-AU")} | ${ms(s.withIndexes)} (${plan(s.withIndexes)}) | ${ms(s.withoutIndexes)} (${plan(s.withoutIndexes)}) | ${(s.withoutIndexes.ms / s.withIndexes.ms).toFixed(1)}x |`,
    ),
  ].join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { values } = parseArgs({
    options: {
      count: { type: "string", default: "200000" },
      runs: { type: "string", default: "5" },
      "database-url": { type: "string" },
    },
  });
  const result = await runBenchmark({
    databaseUrl: values["database-url"] ?? withDatabaseName(env.DATABASE_URL, "lexin_bench"),
    count: Number(values.count),
    runs: Number(values.runs),
    log: console.log,
  });
  console.log(`\n${formatReport(result)}`);
}
