import type { Material, MaterialsResponse } from "@material-register/shared";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { renderAt } from "./render";
import { server } from "./server";

const material = (n: number, description: string): Material => ({
  id: n,
  materialNumber: `MAT-${String(n).padStart(6, "0")}`,
  description,
  materialType: "SPARE_PART",
  manufacturer: { name: "SKF" },
  manufacturerPartNumber: `MPN-${n}`,
  plant: { code: "1000", name: "Brisbane" },
  status: "ACTIVE",
  unitOfMeasure: "EA",
  unitPrice: "10.00",
  quantityOnHand: 1,
  updatedAt: "2025-03-14T02:00:00.000Z",
});

/**
 * Fakes the materials API over 40 materials: odd ones are bearings, even ones seals. `q`
 * matches descriptions case-insensitively. Returns the requested query strings, in order.
 */
function serveMaterials() {
  const all = Array.from({ length: 40 }, (_, i) =>
    material(i + 1, i % 2 ? `Seal ${i + 1}` : `Bearing ${i + 1}`),
  );
  const requests: string[] = [];
  server.use(
    http.get("/api/materials", ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params.toString());
      const q = params.get("q")?.toLowerCase() ?? "";
      const matches = all.filter((m) => m.description.toLowerCase().includes(q));
      const page = Number(params.get("page") ?? 1);
      const pageSize = Number(params.get("pageSize") ?? 25);
      const body: MaterialsResponse = {
        data: matches.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        total: matches.length,
        totalPages: Math.ceil(matches.length / pageSize),
      };
      return HttpResponse.json(body);
    }),
  );
  return requests;
}

const searchBox = () => screen.getByRole("textbox", { name: "Search materials" });
const search = (router: ReturnType<typeof renderAt>["router"]) => router.state.location.search;
const DEFAULT_REQUEST = "sort=updatedAt&order=desc&page=1&pageSize=25";

describe("Materials page search", () => {
  it("sends one request after a burst of typing, and puts the term in the URL", async () => {
    const requests = serveMaterials();
    const user = userEvent.setup();
    const { router } = renderAt("/");
    await screen.findByRole("cell", { name: "Bearing 1" });

    await user.type(searchBox(), "seal");

    // Still inside the 300ms pause: nothing sent yet.
    expect(requests).toEqual([DEFAULT_REQUEST]);
    expect(await screen.findByText("20 materials")).toBeInTheDocument();
    expect(search(router)).toBe("?q=seal");
    expect(requests).toEqual([DEFAULT_REQUEST, `q=seal&${DEFAULT_REQUEST}`]);
    expect(screen.queryByRole("cell", { name: "Bearing 1" })).not.toBeInTheDocument();
  });

  it("trims the term before putting it in the URL", async () => {
    serveMaterials();
    const user = userEvent.setup();
    const { router } = renderAt("/");
    await screen.findByRole("cell", { name: "Bearing 1" });

    await user.type(searchBox(), "  seal ");

    await waitFor(() => expect(search(router)).toBe("?q=seal"));
    // The box keeps what was typed, so typing can carry on naturally.
    expect(searchBox()).toHaveValue("  seal ");
  });

  it("returns to page 1 when the search changes", async () => {
    const requests = serveMaterials();
    const user = userEvent.setup();
    const { router } = renderAt("/?page=2&pageSize=10");
    await screen.findByRole("cell", { name: "Bearing 11" });

    await user.type(searchBox(), "bearing");

    await waitFor(() =>
      expect(requests.at(-1)).toBe("q=bearing&sort=updatedAt&order=desc&page=1&pageSize=10"),
    );
    expect(search(router)).toBe("?q=bearing&pageSize=10");
  });

  it("keeps the page when typing does not change the term", async () => {
    const requests = serveMaterials();
    const user = userEvent.setup();
    const { router } = renderAt("/?q=bearing&page=2&pageSize=10");
    await screen.findByRole("cell", { name: "Bearing 21" });

    await user.type(searchBox(), " ");
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(search(router)).toBe("?q=bearing&page=2&pageSize=10");
    expect(requests).toHaveLength(1);
  });

  it("loads the search named in the URL into the box and the request", async () => {
    const requests = serveMaterials();

    renderAt("/?q=seal");

    expect(await screen.findByText("20 materials")).toBeInTheDocument();
    expect(searchBox()).toHaveValue("seal");
    expect(requests).toEqual([`q=seal&${DEFAULT_REQUEST}`]);
  });

  it("clears the search with the × control", async () => {
    const requests = serveMaterials();
    const user = userEvent.setup();
    const { router } = renderAt("/?q=seal&page=2&pageSize=10");
    await screen.findByText("20 materials");

    await user.click(screen.getByRole("button", { name: "Clear search" }));

    expect(await screen.findByText("40 materials")).toBeInTheDocument();
    expect(searchBox()).toHaveValue("");
    expect(search(router)).toBe("?pageSize=10");
    expect(requests.at(-1)).toBe("sort=updatedAt&order=desc&page=1&pageSize=10");
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
  });

  it("follows the URL on back and forward", async () => {
    serveMaterials();
    const user = userEvent.setup();
    const { router } = renderAt("/");
    await screen.findByRole("cell", { name: "Bearing 1" });
    await user.type(searchBox(), "seal");
    await screen.findByText("20 materials");

    await router.navigate(-1);

    expect(await screen.findByText("40 materials")).toBeInTheDocument();
    expect(searchBox()).toHaveValue("");

    await router.navigate(1);

    expect(await screen.findByText("20 materials")).toBeInTheDocument();
    expect(searchBox()).toHaveValue("seal");
  });

  it("explains an over-long term instead of searching for it", async () => {
    const requests = serveMaterials();
    const user = userEvent.setup();
    const { router } = renderAt("/");
    await screen.findByRole("cell", { name: "Bearing 1" });

    await user.click(searchBox());
    await user.paste("x".repeat(101));

    expect(await screen.findByText("Search must be 100 characters or fewer.")).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(search(router)).toBe("");
    // Only the long term matters: a background refetch from an earlier view may still land.
    expect(requests.filter((query) => query.includes("q=xxx"))).toEqual([]);
  });
});
