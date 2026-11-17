import { materialsQuerySchema } from "@material-register/shared";
import { Hono } from "hono";
import { errorResponse } from "../errors";
import type { MaterialsRepository } from "../repositories/materials-repository";
import { validate } from "../validation";

export function materialsRoutes(repository: MaterialsRepository) {
  return new Hono()
    .get("/", validate("query", materialsQuerySchema), async (c) =>
      c.json(await repository.list(c.req.valid("query"))),
    )
    .get("/:materialNumber", async (c) => {
      const materialNumber = c.req.param("materialNumber");
      const material = await repository.findByNumber(materialNumber);
      if (!material) {
        return errorResponse(c, 404, "NOT_FOUND", `Material ${materialNumber} not found.`);
      }
      return c.json(material);
    });
}
