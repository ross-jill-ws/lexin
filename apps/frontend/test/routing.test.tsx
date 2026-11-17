import type { ApiError, Material, MaterialsResponse } from "@material-register/shared";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { renderAt } from "./render";
import { server } from "./server";

const hose: Material = {
  id: 4242,
  materialNumber: "MAT-004242",
  description: "Hose, hydraulic, 1/2in, 2-wire braid",
  materialType: "CONSUMABLE",
  manufacturer: { name: "Parker" },
  manufacturerPartNumber: "451TC-8",
  plant: { code: "2000", name: "Sydney" },
  status: "PENDING_REVIEW",
  unitOfMeasure: "M",
  unitPrice: "18.40",
  quantityOnHand: 120,
  updatedAt: "2026-03-01T04:30:00.000Z",
};

const notFound = (materialNumber: string): ApiError => ({
  error: { code: "NOT_FOUND", message: `Material ${materialNumber} not found.` },
});

/** Serves the list (one page holding just the hose) and the detail endpoint. */
function serveApi() {
  const detailRequests: string[] = [];
  const page: MaterialsResponse = { data: [hose], page: 1, pageSize: 10, total: 1, totalPages: 1 };
  server.use(
    http.get("/api/materials", () => HttpResponse.json(page)),
    http.get("/api/materials/:materialNumber", ({ params }) => {
      const materialNumber = String(params.materialNumber);
      detailRequests.push(materialNumber);
      return materialNumber === hose.materialNumber
        ? HttpResponse.json(hose)
        : HttpResponse.json(notFound(materialNumber), { status: 404 });
    }),
  );
  return { detailRequests };
}

/** The value shown against a label (its <dt>) in the material's fact sheet. */
const fact = (label: string) =>
  within(screen.getByRole("region", { name: "Material details" })).getByText(label, {
    selector: "dt",
  }).nextElementSibling?.textContent;

describe("routing", () => {
  it("shows a friendly not-found page for an unknown path, with a way back to the register", async () => {
    const user = userEvent.setup();
    serveApi();
    const { router } = renderAt("/no/such/page");

    expect(await screen.findByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
    expect(screen.getByText("/no/such/page")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Back to the register" }));

    expect(await screen.findByRole("cell", { name: "MAT-004242" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  it("shows every detail of the material named in the URL", async () => {
    const { detailRequests } = serveApi();

    renderAt("/materials/MAT-004242");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Hose, hydraulic, 1/2in, 2-wire braid",
      }),
    ).toBeVisible();
    expect(screen.getAllByText("MAT-004242").length).toBeGreaterThan(0);
    expect(fact("Type")).toBe("Consumable");
    expect(fact("Status")).toBe("Pending Review");
    expect(fact("Manufacturer")).toBe("Parker");
    expect(fact("Manufacturer part number")).toBe("451TC-8");
    expect(fact("Plant")).toBe("2000 · Sydney");
    expect(fact("Unit of measure")).toBe("M");
    expect(fact("Unit price")).toBe("$18.40");
    expect(fact("Quantity on hand")).toBe("120");
    expect(fact("Stock value")).toBe("$2,208.00");
    expect(fact("Last updated")).toBe("1 Mar 2026");
    expect(detailRequests).toEqual(["MAT-004242"]);
  });

  it("opens a material from the list and returns to the same list view", async () => {
    serveApi();
    const user = userEvent.setup();
    const { router } = renderAt("/?q=hose&status=PENDING_REVIEW");
    const row = (await screen.findByRole("cell", { name: "MAT-004242" })).closest("tr");
    if (!row) throw new Error("no row");

    await user.click(within(row).getByRole("link", { name: "MAT-004242" }));

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Hose, hydraulic, 1/2in, 2-wire braid",
      }),
    ).toBeVisible();
    expect(router.state.location.pathname).toBe("/materials/MAT-004242");

    await user.click(screen.getByRole("link", { name: "Back to the register" }));

    expect(await screen.findByRole("cell", { name: "MAT-004242" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
    expect(router.state.location.search).toBe("?q=hose&status=PENDING_REVIEW");
  });

  it("explains when no material has the number in the URL", async () => {
    serveApi();

    renderAt("/materials/MAT-999999");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Material not found" }),
    ).toBeVisible();
    expect(screen.getByText("Material MAT-999999 not found.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the register" })).toHaveAttribute("href", "/");
  });

  it("shows a failed detail request with Retry, which recovers once the API is back", async () => {
    let failing = true;
    server.use(
      http.get("/api/materials/:materialNumber", () =>
        failing
          ? HttpResponse.json(
              {
                error: {
                  code: "INTERNAL_ERROR",
                  message: "Something went wrong. Please try again.",
                },
              },
              { status: 500 },
            )
          : HttpResponse.json(hose),
      ),
    );
    const user = userEvent.setup();
    renderAt("/materials/MAT-004242");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Couldn't load this material");
    failing = false;
    await user.click(within(alert).getByRole("button", { name: "Retry" }));

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Hose, hydraulic, 1/2in, 2-wire braid",
      }),
    ).toBeVisible();
  });
});
