import { materialsQuerySchema } from "@material-register/shared";
import { Hono } from "hono";
import type { MaterialsRepository } from "../repositories/materials-repository";
import { validate } from "../validation";

export function materialsRoutes(repository: MaterialsRepository) {
  return new Hono().get("/", validate("query", materialsQuerySchema), async (c) =>
    c.json(await repository.list(c.req.valid("query"))),
  );
}
