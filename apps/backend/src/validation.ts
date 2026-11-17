import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { z } from "zod";
import { errorResponse } from "./errors";

/** zValidator whose failures become a 400 VALIDATION_ERROR listing every invalid field. */
export const validate = <Target extends keyof ValidationTargets, Schema extends z.ZodType>(
  target: Target,
  schema: Schema,
) =>
  zValidator(target, schema, (result, c) => {
    if (result.success) return;
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return errorResponse(c, 400, "VALIDATION_ERROR", "The request has invalid parameters.", issues);
  });
