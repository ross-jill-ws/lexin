import { z } from "zod";

export const SEARCH_MAX_LENGTH = 100;

// biome-ignore lint/suspicious/noControlCharactersInRegex: matching them is the point.
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

/** Query-string field for the free-text search. Blank after trimming means no search. */
export const searchQueryShape = {
  q: z
    .string()
    .trim()
    .max(SEARCH_MAX_LENGTH, {
      error: `Search must be ${SEARCH_MAX_LENGTH} characters or fewer.`,
    })
    // Postgres text can't hold NUL, and no planner types control characters: reject, don't 500.
    .refine((term) => !CONTROL_CHARACTERS.test(term), {
      error: "Search can't contain control characters.",
    })
    .transform((term) => term || undefined)
    .optional(),
};
