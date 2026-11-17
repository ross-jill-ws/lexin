import type { Material, MaterialsResponse, PlantsResponse } from "@material-register/shared";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { renderAt } from "./render";
import { server } from "./server";

const plants: PlantsResponse = [
  { id: 1, code: "1000", name: "Brisbane" },
  { id: 2, code: "2000", name: "Gladstone" },
];

const material = (n: number, overrides: Partial<Material>): Material => ({
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
  ...overrides,
});

/**
 * Fakes the plants API and a materials API over 30 materials that honours the type, status
 * and plant filters. Returns the decoded query strings requested, in order, and a count of
 * plants requests.
 */
function serveApi() {
  const all = Array.from({ length: 30 }, (_, i) =>
    material(i + 1, {
      materialType: i % 3 === 0 ? "TOOL" : "SPARE_PART",
      status: i % 2 === 0 ? "ACTIVE" : "OBSOLETE",
      plant: plants[i % 2] ?? { code: "1000", name: "Brisbane" },
    }),
  );
  const requests: string[] = [];
  const plantsRequests = { count: 0 };
  server.use(
    http.get("/api/plants", () => {
      plantsRequests.count += 1;
      return HttpResponse.json(plants);
    }),
    http.get("/api/materials", ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(decodeURIComponent(params.toString()));
      const list = (key: string) => params.get(key)?.split(",");
      const [types, statuses, plantCodes] = [list("type"), list("status"), list("plant")];
      const matches = all.filter(
        (m) =>
          (!types || types.includes(m.materialType)) &&
          (!statuses || statuses.includes(m.status)) &&
          (!plantCodes || plantCodes.includes(m.plant.code)),
      );
      const page = Number(params.get("page") ?? 1);
      const pageSize = Number(params.get("pageSize") ?? 10);
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
  return { requests, plantsRequests };
}

const search = (router: ReturnType<typeof renderAt>["router"]) =>
  decodeURIComponent(router.state.location.search);
const filters = () => screen.getByRole("group", { name: "Filters" });
const filterInput = (label: string) => within(filters()).getByRole("combobox", { name: label });
const openOptions = async () => within(await screen.findByRole("listbox")).findAllByRole("option");
type User = ReturnType<typeof userEvent.setup>;

async function choose(user: User, label: string, option: string) {
  await user.click(filterInput(label));
  const options = await openOptions();
  const match = options.find((o) => o.textContent === option);
  if (!match) throw new Error(`No ${label} option "${option}"`);
  await user.click(match);
  await user.keyboard("{Escape}");
}

/** The options the filter shows as selected, read from its opened dropdown. */
async function selected(user: User, label: string) {
  await user.click(filterInput(label));
  const options = await openOptions();
  await user.keyboard("{Escape}");
  return options
    .filter((o) => o.getAttribute("aria-selected") === "true")
    .map((o) => o.textContent);
}

describe("Materials page filters", () => {
  it("selecting types puts them in the URL and the request, back on page 1", async () => {
    const { requests } = serveApi();
    const user = userEvent.setup();
    const { router } = renderAt("/?page=2&pageSize=25");
    await screen.findByText("30 materials");

    await choose(user, "Type", "Tool");

    expect(await screen.findByText("10 materials")).toBeInTheDocument();
    expect(search(router)).toBe("?type=TOOL&pageSize=25");
    expect(requests.at(-1)).toBe("type=TOOL&sort=updatedAt&order=desc&page=1&pageSize=25");

    await choose(user, "Type", "Spare Part");

    expect(await screen.findByText("30 materials")).toBeInTheDocument();
    expect(search(router)).toBe("?type=TOOL,SPARE_PART&pageSize=25");
  });

  it("combines status and plant filters, with plants offered from the API by code", async () => {
    const { requests } = serveApi();
    const user = userEvent.setup();
    const { router } = renderAt("/");
    await screen.findByText("30 materials");

    await choose(user, "Status", "Active");
    await screen.findByText("15 materials");
    await choose(user, "Plant", "2000 · Gladstone");

    expect(await screen.findByText("0 materials")).toBeInTheDocument();
    expect(search(router)).toBe("?status=ACTIVE&plant=2000");
    expect(requests.at(-1)).toBe(
      "status=ACTIVE&plant=2000&sort=updatedAt&order=desc&page=1&pageSize=10",
    );
  });

  it("offers every type and status with readable labels", async () => {
    serveApi();
    const user = userEvent.setup();
    renderAt("/");
    await screen.findByText("30 materials");

    await user.click(filterInput("Type"));
    expect((await openOptions()).map((o) => o.textContent)).toEqual([
      "Spare Part",
      "Consumable",
      "Raw Material",
      "Tool",
    ]);
    await user.keyboard("{Escape}");

    await user.click(filterInput("Status"));
    expect((await openOptions()).map((o) => o.textContent)).toEqual([
      "Active",
      "Obsolete",
      "Pending Review",
    ]);
  });

  it("restores the selections named in the URL", async () => {
    const { requests } = serveApi();

    renderAt("/?type=TOOL,SPARE_PART&status=OBSOLETE&plant=2000");

    expect(await screen.findByText("15 materials")).toBeInTheDocument();
    expect(requests).toEqual([
      "type=TOOL,SPARE_PART&status=OBSOLETE&plant=2000&sort=updatedAt&order=desc&page=1&pageSize=10",
    ]);
    const user = userEvent.setup();
    expect(await selected(user, "Type")).toEqual(["Spare Part", "Tool"]);
    expect(await selected(user, "Status")).toEqual(["Obsolete"]);
    expect(await selected(user, "Plant")).toEqual(["2000 · Gladstone"]);
  });

  it("clears one filter on its own, back on page 1", async () => {
    const { requests } = serveApi();
    const user = userEvent.setup();
    const { router } = renderAt("/?type=TOOL&status=ACTIVE&page=2&pageSize=25");
    await screen.findByText("5 materials");

    await user.click(within(filters()).getByRole("button", { name: "Clear Type filter" }));

    expect(await screen.findByText("15 materials")).toBeInTheDocument();
    expect(search(router)).toBe("?status=ACTIVE&pageSize=25");
    expect(requests.at(-1)).toBe("status=ACTIVE&sort=updatedAt&order=desc&page=1&pageSize=25");
    expect(await selected(user, "Type")).toEqual([]);
    expect(await selected(user, "Status")).toEqual(["Active"]);
  });

  it("Clear all resets search and every filter, keeping sort and page size", async () => {
    const { requests } = serveApi();
    const user = userEvent.setup();
    const { router } = renderAt(
      "/?q=material&type=TOOL&status=ACTIVE&plant=1000&sort=materialNumber&order=asc&pageSize=25",
    );
    await screen.findByText("5 materials");

    await user.click(screen.getByRole("button", { name: "Clear all" }));

    expect(await screen.findByText("30 materials")).toBeInTheDocument();
    expect(search(router)).toBe("?sort=materialNumber&order=asc&pageSize=25");
    expect(requests.at(-1)).toBe("sort=materialNumber&order=asc&page=1&pageSize=25");
    expect(screen.getByRole("textbox", { name: "Search materials" })).toHaveValue("");
    for (const label of ["Type", "Status", "Plant"])
      expect(await selected(user, label)).toEqual([]);
    expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument();
  });

  it("shows Clear all only once a search or filter is applied", async () => {
    serveApi();
    const user = userEvent.setup();
    renderAt("/?sort=materialNumber&pageSize=25");
    await screen.findByText("30 materials");

    expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument();

    await choose(user, "Status", "Obsolete");

    expect(await screen.findByRole("button", { name: "Clear all" })).toBeInTheDocument();
  });

  it("fetches the plants once, however often the filters change", async () => {
    const { plantsRequests } = serveApi();
    const user = userEvent.setup();
    renderAt("/");
    await screen.findByText("30 materials");

    await choose(user, "Plant", "1000 · Brisbane");
    await screen.findByText("15 materials");
    await choose(user, "Type", "Tool");
    await screen.findByText("5 materials");

    expect(plantsRequests.count).toBe(1);
  });
});
