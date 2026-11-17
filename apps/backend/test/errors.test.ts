import { apiErrorSchema } from "@material-register/shared";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import type { Db } from "../src/db/client";

describe("API errors", () => {
  it("returns a JSON 404 for unknown routes", async () => {
    const res = await createApp().request("/api/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = apiErrorSchema.parse(await res.json());
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns a JSON 500 without internals when the database fails", async () => {
    const brokenDb = {
      select: () => {
        throw new Error("connection refused at 10.0.0.1 with secret password");
      },
    } as unknown as Db;
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await createApp(brokenDb).request("/api/materials");

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({
      error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
    });
  });
});
