import type { ApiError, ApiErrorCode } from "@material-register/shared";
import type { Context, ErrorHandler, NotFoundHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/** Every error response uses the shared `{ error: { code, message, issues? } }` shape. */
export function errorResponse(
  c: Context,
  status: ContentfulStatusCode,
  code: ApiErrorCode,
  message: string,
  issues?: ApiError["error"]["issues"],
) {
  const body: ApiError = { error: { code, message, ...(issues && { issues }) } };
  return c.json(body, status);
}

export const notFound: NotFoundHandler = (c) =>
  errorResponse(c, 404, "NOT_FOUND", `Route ${c.req.method} ${c.req.path} not found.`);

export const onError: ErrorHandler = (err, c) => {
  console.error(err);
  return errorResponse(c, 500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
};
