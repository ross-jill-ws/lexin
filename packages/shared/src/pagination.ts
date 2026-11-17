import { z } from "zod";

export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 25;

export type PageSize = (typeof PAGE_SIZES)[number];

/** Query-string fields for paging. Values arrive as strings, so both coerce to numbers. */
export const paginationQueryShape = {
  page: z.coerce
    .number({ error: "Page must be a whole number." })
    .int({ error: "Page must be a whole number." })
    .positive({ error: "Page must be 1 or more." })
    .default(DEFAULT_PAGE),
  pageSize: z.coerce
    .number({ error: `Page size must be one of ${PAGE_SIZES.join(", ")}.` })
    .pipe(z.literal(PAGE_SIZES, { error: `Page size must be one of ${PAGE_SIZES.join(", ")}.` }))
    .default(DEFAULT_PAGE_SIZE),
};

export const paginatedSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    data: z.array(item),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  });
