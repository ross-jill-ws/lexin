import { z } from "zod";

export const MATERIAL_TYPES = ["SPARE_PART", "CONSUMABLE", "RAW_MATERIAL", "TOOL"] as const;
export const MATERIAL_STATUSES = ["ACTIVE", "OBSOLETE", "PENDING_REVIEW"] as const;
export const UNITS_OF_MEASURE = ["EA", "BOX", "KG", "L", "M", "SET", "PK"] as const;

export const materialTypeSchema = z.enum(MATERIAL_TYPES);
export const materialStatusSchema = z.enum(MATERIAL_STATUSES);
export const unitOfMeasureSchema = z.enum(UNITS_OF_MEASURE);

export type MaterialType = z.infer<typeof materialTypeSchema>;
export type MaterialStatus = z.infer<typeof materialStatusSchema>;
export type UnitOfMeasure = z.infer<typeof unitOfMeasureSchema>;
