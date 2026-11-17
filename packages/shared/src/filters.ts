import { z } from "zod";
import { MATERIAL_STATUSES, MATERIAL_TYPES } from "./enums";

/**
 * A comma-separated multi-value query field, e.g. `type=SPARE_PART,TOOL`. Values are trimmed
 * and de-duplicated; an empty list means no filter. Each value must pass `item`.
 */
const commaList = <Item extends z.ZodType<string, string>>(item: Item) =>
  z
    .string()
    .transform((raw) => [...new Set(raw.split(",").map((value) => value.trim()))].filter(Boolean))
    .pipe(z.array(item))
    .transform((values) => (values.length > 0 ? values : undefined))
    .optional();

/** Query-string fields for the filters: AND across fields, OR within one. Plants by code. */
export const filtersQueryShape = {
  type: commaList(
    z.enum(MATERIAL_TYPES, { error: `Type must be one of ${MATERIAL_TYPES.join(", ")}.` }),
  ),
  status: commaList(
    z.enum(MATERIAL_STATUSES, {
      error: `Status must be one of ${MATERIAL_STATUSES.join(", ")}.`,
    }),
  ),
  plant: commaList(
    z.string().regex(/^[A-Za-z0-9]{1,4}$/, {
      error: "Plant must be a plant code of 1 to 4 letters or digits.",
    }),
  ),
};
