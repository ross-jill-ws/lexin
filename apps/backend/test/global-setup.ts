import { runMigrations } from "../src/db/migrate";
import { env } from "../src/env";

/** Migrates the test database once per run. */
export default async function setup() {
  await runMigrations(env.TEST_DATABASE_URL);
}
