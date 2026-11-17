import { z } from "zod";

type Values = Record<string, unknown>;

/**
 * Parses URL search params field by field, so one malformed value falls back to its
 * schema default instead of discarding the whole URL.
 */
export function parseSearchParams<Shape extends z.ZodRawShape>(
  schema: z.ZodObject<Shape>,
  params: URLSearchParams,
): z.infer<z.ZodObject<Shape>> {
  const entries = Object.entries(schema.shape).map(([key, field]) => {
    const parsed = z.safeParse(field, params.get(key) ?? undefined);
    return [key, parsed.success ? parsed.data : z.parse(field, undefined)];
  });
  return Object.fromEntries(entries) as z.infer<z.ZodObject<Shape>>;
}

/**
 * Serialises values to search params, leaving out any equal to `omit` (e.g. the defaults).
 * Lists become comma-separated values.
 */
export function toSearchParams(values: Values, omit: Values = {}): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === omit[key]) continue;
    params.set(key, String(value));
  }
  return params;
}

/** Like toSearchParams, as a query string that keeps list commas readable (`type=A,B`). */
export const toQueryString = (values: Values, omit: Values = {}): string =>
  toSearchParams(values, omit).toString().replaceAll("%2C", ",");
