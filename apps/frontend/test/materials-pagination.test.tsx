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
 * Fakes the materials API over `total` materials, paging the way the real API does.
 * Returns the query strings the page requested, in order.
 */
function serveMaterials(total: number) {
  const all = Array.from({ length: total }, (_, i) => material(i + 1));
  const requests: string[] = [];
  server.use(
    http.get("/api/materials", ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params.toString());
      const page = Number(params.get("page") ?? 1);
      const pageSize = Number(params.get("pageSize") ?? 10);
      const body: MaterialsResponse = {
        data: all.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      };
      return HttpResponse.json(body);
    }),
  );
  return requests;
}

const shownMaterialNumbers = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => row.querySelector("td")?.textContent);

const search = (router: ReturnType<typeof renderAt>["router"]) => router.state.location.search;

describe("Materials page pagination", () => {
  it("loads the page and page size named in the URL", async () => {
    const requests = serveMaterials(120);

    renderAt("/?page=3&pageSize=25");

    expect(await screen.findByRole("cell", { name: "MAT-000051" })).toBeInTheDocument();
    expect(shownMaterialNumbers()).toHaveLength(25);
    expect(requests).toEqual(["sort=updatedAt&order=desc&page=3&pageSize=25"]);
  });

  it("moves to the next page and to a chosen page, keeping the URL in step", async () => {
    serveMaterials(120);
    const user = userEvent.setup();
    const { router } = renderAt("/");
    await screen.findByRole("cell", { name: "MAT-000001" });

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(await screen.findByRole("cell", { name: "MAT-000011" })).toBeInTheDocument();
    expect(search(router)).toBe("?page=2");

    await user.click(screen.getByRole("button", { name: "5" }));

    expect(await screen.findByRole("cell", { name: "MAT-000041" })).toBeInTheDocument();
    expect(search(router)).toBe("?page=5");
  });

  it("leaves page 1 out of the URL when going back to the first page", async () => {
    serveMaterials(120);
    const user = userEvent.setup();
    const { router } = renderAt("/?page=2");
    await screen.findByRole("cell", { name: "MAT-000011" });

    await user.click(screen.getByRole("button", { name: "Previous page" }));

    expect(await screen.findByRole("cell", { name: "MAT-000001" })).toBeInTheDocument();
    expect(search(router)).toBe("");
  });

  it("changes the page size and returns to page 1", async () => {
    const requests = serveMaterials(120);
    const user = userEvent.setup();
    const { router } = renderAt("/?page=3");
    await screen.findByRole("cell", { name: "MAT-000021" });

    await user.selectOptions(screen.getByRole("combobox", { name: "Rows per page" }), "50");

    await waitFor(() => expect(shownMaterialNumbers()).toHaveLength(50));
    expect(shownMaterialNumbers()[0]).toBe("MAT-000001");
    expect(search(router)).toBe("?pageSize=50");
    expect(requests.at(-1)).toBe("sort=updatedAt&order=desc&page=1&pageSize=50");
  });

  it("offers page sizes of 10, 25, 50 and 100", async () => {
    serveMaterials(1);
    renderAt("/");

    const picker = await screen.findByRole("combobox", { name: "Rows per page" });

    expect(picker).toHaveValue("10");
    expect([...(picker as HTMLSelectElement).options].map((o) => o.value)).toEqual([
      "10",
      "25",
      "50",
      "100",
    ]);
  });

  it.each([
    ["/?page=abc&pageSize=7", "MAT-000001", 10],
    ["/?page=0&pageSize=-10", "MAT-000001", 10],
    ["/?page=2.5&pageSize=50", "MAT-000001", 50],
    ["/?page=2&pageSize=lots", "MAT-000011", 10],
  ])("falls back to defaults for the malformed parts of %s", async (url, first, rows) => {
    const requests = serveMaterials(120);

    renderAt(url);

    expect(await screen.findByRole("cell", { name: first })).toBeInTheDocument();
    expect(shownMaterialNumbers()).toHaveLength(rows);
    expect(requests).toHaveLength(1);
    expect(screen.getByRole("combobox", { name: "Rows per page" })).toHaveValue(String(rows));
  });

  it("restores each page with back and forward", async () => {
    serveMaterials(120);
    const user = userEvent.setup();
    const { router } = renderAt("/");
    await screen.findByRole("cell", { name: "MAT-000001" });
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await screen.findByRole("cell", { name: "MAT-000011" });
    await user.selectOptions(screen.getByRole("combobox", { name: "Rows per page" }), "25");
    await waitFor(() => expect(shownMaterialNumbers()).toHaveLength(25));

    await router.navigate(-1);

    await waitFor(() => expect(shownMaterialNumbers()).toHaveLength(10));
    expect(shownMaterialNumbers()[0]).toBe("MAT-000011");
    expect(screen.getByRole("combobox", { name: "Rows per page" })).toHaveValue("10");

    await router.navigate(-1);

    expect(await screen.findByRole("cell", { name: "MAT-000001" })).toBeInTheDocument();

    await router.navigate(1);

    expect(await screen.findByRole("cell", { name: "MAT-000011" })).toBeInTheDocument();
    expect(search(router)).toBe("?page=2");
  });

  it("shows the current page as selected in the pagination control", async () => {
    serveMaterials(120);

    renderAt("/?page=4");

    await screen.findByRole("cell", { name: "MAT-000031" });
    expect(screen.getByRole("button", { name: "4" })).toHaveAttribute("aria-current", "page");
  });

  it("explains a URL past the last page and offers a way back to the last page", async () => {
    serveMaterials(60);
    const user = userEvent.setup();
    const { router } = renderAt("/?page=9&pageSize=25");

    expect(
      await screen.findByText("Page 9 doesn't exist. These results only go up to page 3."),
    ).toBeInTheDocument();
    // Distinct from the "Page not found" 404 route.
    expect(screen.getByText("Past the last page")).toBeInTheDocument();
    expect(screen.queryByText("Page not found")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go to page 3" }));

    expect(await screen.findByRole("cell", { name: "MAT-000051" })).toBeInTheDocument();
    expect(search(router)).toBe("?page=3&pageSize=25");
    expect(screen.queryByText(/doesn't exist/)).not.toBeInTheDocument();
  });

  it("sends a URL past the end of no results back to page 1", async () => {
    serveMaterials(0);
    const user = userEvent.setup();
    const { router } = renderAt("/?page=4");

    expect(
      await screen.findByText("Page 4 doesn't exist. There are no results to page through."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go to page 1" }));

    await waitFor(() => expect(search(router)).toBe(""));
    expect(screen.queryByText(/doesn't exist/)).not.toBeInTheDocument();
  });
});
