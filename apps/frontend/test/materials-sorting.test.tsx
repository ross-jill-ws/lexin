import type { Material, MaterialsResponse } from "@material-register/shared";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { renderAt } from "./render";
import { server } from "./server";

const material = (n: number): Material => ({
  id: n,
  materialNumber: `MAT-${String(n).padStart(6, "0")}`,
  description: `Material ${n}`,
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
 * Fakes the materials API over 60 materials. Ascending order lists MAT-000001 first and
 * descending order MAT-000060 first, whatever the column. Returns the requested query strings.
 */
function serveMaterials() {
  const all = Array.from({ length: 60 }, (_, i) => material(i + 1));
  const requests: string[] = [];
  server.use(
    http.get("/api/materials", ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params.toString());
      const page = Number(params.get("page") ?? 1);
      const pageSize = Number(params.get("pageSize") ?? 10);
      const ordered = params.get("order") === "asc" ? all : [...all].reverse();
      const body: MaterialsResponse = {
        data: ordered.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        total: all.length,
        totalPages: Math.ceil(all.length / pageSize),
      };
      return HttpResponse.json(body);
    }),
  );
  return requests;
}

const header = (name: string) => screen.getByRole("columnheader", { name });
const sortButton = (name: string) => screen.getByRole("button", { name });
const search = (router: ReturnType<typeof renderAt>["router"]) => router.state.location.search;

describe("Materials page sorting", () => {
  it("shows the default sort, most recently updated first, on the Last updated header", async () => {
    const requests = serveMaterials();

    renderAt("/");

    await screen.findByRole("cell", { name: "MAT-000060" });
    expect(header("Last updated")).toHaveAttribute("aria-sort", "descending");
    expect(header("Material #")).toHaveAttribute("aria-sort", "none");
    expect(requests).toEqual(["sort=updatedAt&order=desc&page=1&pageSize=10"]);
  });

  it("makes every sortable header clickable and leaves the others plain", async () => {
    serveMaterials();

    renderAt("/");

    await screen.findByRole("cell", { name: "MAT-000060" });
    for (const name of [
      "Material #",
      "Description",
      "Type",
      "Manufacturer",
      "Plant",
      "Status",
      "Unit price",
      "Qty on hand",
      "Last updated",
    ]) {
      expect(sortButton(name)).toBeInTheDocument();
    }
    for (const name of ["MPN", "UoM"]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
      expect(header(name)).not.toHaveAttribute("aria-sort");
    }
  });

  it("sorts ascending on a header click, then toggles direction on the next click", async () => {
    const requests = serveMaterials();
    const user = userEvent.setup();
    const { router } = renderAt("/");
    await screen.findByRole("cell", { name: "MAT-000060" });

    await user.click(sortButton("Material #"));

    expect(await screen.findByRole("cell", { name: "MAT-000001" })).toBeInTheDocument();
    expect(search(router)).toBe("?sort=materialNumber&order=asc");
    expect(requests.at(-1)).toBe("sort=materialNumber&order=asc&page=1&pageSize=10");
    expect(header("Material #")).toHaveAttribute("aria-sort", "ascending");
    expect(header("Last updated")).toHaveAttribute("aria-sort", "none");

    await user.click(sortButton("Material #"));

    expect(await screen.findByRole("cell", { name: "MAT-000060" })).toBeInTheDocument();
    expect(search(router)).toBe("?sort=materialNumber");
    expect(requests.at(-1)).toBe("sort=materialNumber&order=desc&page=1&pageSize=10");
    expect(header("Material #")).toHaveAttribute("aria-sort", "descending");

    await user.click(sortButton("Material #"));

    await waitFor(() => expect(search(router)).toBe("?sort=materialNumber&order=asc"));
  });

  it("toggles the default Last updated sort to ascending", async () => {
    serveMaterials();
    const user = userEvent.setup();
    const { router } = renderAt("/");
    await screen.findByRole("cell", { name: "MAT-000060" });

    await user.click(sortButton("Last updated"));

    expect(await screen.findByRole("cell", { name: "MAT-000001" })).toBeInTheDocument();
    expect(search(router)).toBe("?order=asc");
    expect(header("Last updated")).toHaveAttribute("aria-sort", "ascending");
  });

  it("returns to page 1 when the sort changes", async () => {
    const requests = serveMaterials();
    const user = userEvent.setup();
    const { router } = renderAt("/?page=2");
    await screen.findByRole("cell", { name: "MAT-000050" });

    await user.click(sortButton("Plant"));

    expect(await screen.findByRole("cell", { name: "MAT-000001" })).toBeInTheDocument();
    expect(search(router)).toBe("?sort=plant&order=asc");
    expect(requests.at(-1)).toBe("sort=plant&order=asc&page=1&pageSize=10");
  });

  it("loads the sort named in the URL", async () => {
    const requests = serveMaterials();

    renderAt("/?sort=unitPrice&order=asc");

    expect(await screen.findByRole("cell", { name: "MAT-000001" })).toBeInTheDocument();
    expect(header("Unit price")).toHaveAttribute("aria-sort", "ascending");
    expect(requests).toEqual(["sort=unitPrice&order=asc&page=1&pageSize=10"]);
  });

  it("falls back to the default sort for a malformed sort or order in the URL", async () => {
    const requests = serveMaterials();

    renderAt("/?sort=colour&order=sideways");

    await screen.findByRole("cell", { name: "MAT-000060" });
    expect(header("Last updated")).toHaveAttribute("aria-sort", "descending");
    expect(requests).toEqual(["sort=updatedAt&order=desc&page=1&pageSize=10"]);
  });

  it("restores the previous sort with the back button", async () => {
    serveMaterials();
    const user = userEvent.setup();
    const { router } = renderAt("/");
    await screen.findByRole("cell", { name: "MAT-000060" });
    await user.click(sortButton("Description"));
    await screen.findByRole("cell", { name: "MAT-000001" });

    await router.navigate(-1);

    expect(await screen.findByRole("cell", { name: "MAT-000060" })).toBeInTheDocument();
    expect(header("Last updated")).toHaveAttribute("aria-sort", "descending");
    expect(header("Description")).toHaveAttribute("aria-sort", "none");
  });
});
