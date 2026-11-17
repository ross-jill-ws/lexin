import { z } from "zod";

export const ERROR_CODES = ["VALIDATION_ERROR", "NOT_FOUND", "INTERNAL_ERROR"] as const;

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum(ERROR_CODES),
    message: z.string(),
    issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiErrorCode = ApiError["error"]["code"];
