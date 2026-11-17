import {
  type ApiError,
  apiErrorSchema,
  type MaterialsQuery,
  materialsResponseSchema,
  plantsResponseSchema,
} from "@material-register/shared";
import type { z } from "zod";
import { toQueryString } from "../lib/search-params";

/** Any failed API call. Its message is written for the planner and safe to show as-is. */
export abstract class ApiClientError extends Error {}

/** The API answered with its error shape: the server's code, message and any field issues. */
export class ApiRequestError extends ApiClientError {
  override name = "ApiRequestError";
  constructor(
    readonly status: number,
    readonly error: ApiError["error"],
  ) {
    super(error.message);
  }
}

/** The API couldn't be reached: the request failed, or something other than the API answered. */
export class NetworkError extends ApiClientError {
  override name = "NetworkError";
  constructor(readonly status?: number) {
    const http = status === undefined ? "" : ` (HTTP ${status})`;
    super(`Can't reach the server${http}. Check that it's running, then retry.`);
  }
}

/** The API answered successfully, but with a body that doesn't match the shared schema. */
export class UnexpectedResponseError extends ApiClientError {
  override name = "UnexpectedResponseError";
  constructor(readonly cause: z.ZodError) {
    super("The server sent a response the app couldn't read.");
  }
}

async function getJson<T extends z.ZodType>(path: string, schema: T): Promise<z.infer<T>> {
  const res = await fetch(path).catch(() => {
    throw new NetworkError();
  });
  const body: unknown = await res.json().catch(() => undefined);
  if (!res.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    if (!parsed.success) throw new NetworkError(res.status);
    throw new ApiRequestError(res.status, parsed.data.error);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new UnexpectedResponseError(parsed.error);
  return parsed.data;
}

export const api = {
  listMaterials: (query: MaterialsQuery) =>
    getJson(`/api/materials?${toQueryString(query)}`, materialsResponseSchema),
  listPlants: () => getJson("/api/plants", plantsResponseSchema),
};
