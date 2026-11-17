import { Hono } from "hono";
import type { PlantsRepository } from "../repositories/plants-repository";

export function plantsRoutes(repository: PlantsRepository) {
  return new Hono().get("/", async (c) => c.json(await repository.list()));
}
