import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { databaseUrl } from "../env";
import * as schema from "./schema";

export const sqlClient = postgres(databaseUrl);
export const db = drizzle(sqlClient, { schema });
export type Db = typeof db;
