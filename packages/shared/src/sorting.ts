import { z } from "zod";

export const SORT_FIELDS = [
  "materialNumber",
  "description",
  "materialType",
  "status",
  "plant",
  "manufacturer",
  "unitPrice",
  "quantityOnHand",
  "updatedAt",
] as const;
export const SORT_ORDERS = ["asc", "desc"] as const;

export const DEFAULT_SORT = "updatedAt";
export const DEFAULT_ORDER = "desc";

export type SortField = (typeof SORT_FIELDS)[number];
export type SortOrder = (typeof SORT_ORDERS)[number];

/** Query-string fields for single-column sorting. */
export const sortingQueryShape = {
  sort: z
    .enum(SORT_FIELDS, { error: `Sort must be one of ${SORT_FIELDS.join(", ")}.` })
    .default(DEFAULT_SORT),
  order: z
    .enum(SORT_ORDERS, { error: `Order must be one of ${SORT_ORDERS.join(", ")}.` })
    .default(DEFAULT_ORDER),
};
