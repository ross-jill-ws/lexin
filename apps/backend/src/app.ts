import { Hono } from "hono";
import { type Db, db as defaultDb } from "./db/client";
import { notFound, onError } from "./errors";
import { createMaterialsRepository } from "./repositories/materials-repository";
import { createPlantsRepository } from "./repositories/plants-repository";
import { materialsRoutes } from "./routes/materials";
import { plantsRoutes } from "./routes/plants";

export function createApp(db: Db = defaultDb) {
  return new Hono()
    .route("/api/materials", materialsRoutes(createMaterialsRepository(db)))
    .route("/api/plants", plantsRoutes(createPlantsRepository(db)))
    .notFound(notFound)
    .onError(onError);
}
