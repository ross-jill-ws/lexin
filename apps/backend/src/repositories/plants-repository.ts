import type { PlantsResponse } from "@material-register/shared";
import { asc } from "drizzle-orm";
import type { Db } from "../db/client";
import { plants } from "../db/schema";

export function createPlantsRepository(db: Db) {
  return {
    list: (): Promise<PlantsResponse> =>
      db
        .select({ id: plants.id, code: plants.code, name: plants.name })
        .from(plants)
        .orderBy(asc(plants.code)),
  };
}

export type PlantsRepository = ReturnType<typeof createPlantsRepository>;
