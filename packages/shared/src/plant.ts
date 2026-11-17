import { z } from "zod";

export const plantSchema = z.object({
  id: z.number().int(),
  code: z.string(),
  name: z.string(),
});
export type Plant = z.infer<typeof plantSchema>;

/** GET /api/plants response: every plant, ordered by code. */
export const plantsResponseSchema = z.array(plantSchema);
export type PlantsResponse = z.infer<typeof plantsResponseSchema>;
