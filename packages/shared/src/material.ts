import { z } from "zod";
import { materialStatusSchema, materialTypeSchema, unitOfMeasureSchema } from "./enums";
import { filtersQueryShape } from "./filters";
import { paginatedSchema, paginationQueryShape } from "./pagination";
import { searchQueryShape } from "./search";
import { sortingQueryShape } from "./sorting";

export const materialSchema = z.object({
  id: z.number().int(),
  materialNumber: z.string(),
  description: z.string(),
  materialType: materialTypeSchema,
  manufacturer: z.object({ name: z.string() }),
  manufacturerPartNumber: z.string(),
  plant: z.object({ code: z.string(), name: z.string() }),
  status: materialStatusSchema,
  unitOfMeasure: unitOfMeasureSchema,
  /** Exact decimal string, e.g. "12.50", so no float rounding creeps in. */
  unitPrice: z.string().regex(/^\d+\.\d{2}$/),
  quantityOnHand: z.number().int().nonnegative(),
  updatedAt: z.iso.datetime({ offset: true }),
});

export type Material = z.infer<typeof materialSchema>;

export const materialsResponseSchema = paginatedSchema(materialSchema);
export type MaterialsResponse = z.infer<typeof materialsResponseSchema>;

/** GET /api/materials query string. The API validates with it; the frontend parses the URL with it. */
export const materialsQuerySchema = z.object({
  ...searchQueryShape,
  ...filtersQueryShape,
  ...sortingQueryShape,
  ...paginationQueryShape,
});
export type MaterialsQuery = z.infer<typeof materialsQuerySchema>;
