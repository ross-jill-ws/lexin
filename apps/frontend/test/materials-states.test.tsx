import type { ApiError, Material, MaterialsResponse } from "@material-register/shared";
import { screen, within } from "@testing-library/react";
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

/** A page of the API's response over `total` materials. */
function pageOf(total: number, page = 1, pageSize = 10): MaterialsResponse {
  const all = Array.from({ length: total }, (_, i) => material(i + 1));
  return {
    data: all.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

/** A response the test releases by hand, to observe the page while the request is in flight. */
function deferred() {
  let release: (response: Response) => void = () => {};
  const response = new Promise<Response>((resolve) => {
    release = resolve;
  });
  return { response, release };
}

const serverError: ApiError = {
  error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
};

const pageParam = (request: Request) => Number(new URL(request.url).searchParams.get("page") ?? 1);

describe("Materials page loading, empty and error states", () => {
  it("shows a skeleton table until the first page arrives", async () => {
    const pending = deferred();
    server.use(http.get("/api/materials", () => pending.response));

    renderAt("/");

    expect(await screen.findByRole("table", { name: "Loading materials" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Search materials" })).toBeEnabled();

    pending.release(HttpResponse.json(pageOf(3)));

    expect(await screen.findByRole("cell", { name: "MAT-000001" })).toBeInTheDocument();
    expect(screen.queryByRole("table", { name: "Loading materials" })).not.toBeInTheDocument();
  });

  it("keeps the current rows under a loading overlay while the next page loads", async () => {
    const nextPage = deferred();
    server.use(
      http.get("/api/materials", ({ request }) =>
        pageParam(request) === 1 ? HttpResponse.json(pageOf(60)) : nextPage.response,
      ),
    );
    const user = userEvent.setup();
    renderAt("/");
    await screen.findByRole("cell", { name: "MAT-000001" });
    expect(screen.queryByRole("status", { name: "Loading materials" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(await screen.findByRole("status", { name: "Loading materials" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "MAT-000001" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Search materials" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeEnabled();

    nextPage.release(HttpResponse.json(pageOf(60, 2)));

    expect(await screen.findByRole("cell", { name: "MAT-000011" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "MAT-000001" })).not.toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading materials" })).not.toBeInTheDocument();
  });

  it("shows an empty state whose Clear all brings back every material", async () => {
    server.use(
      http.get("/api/materials", ({ request }) =>
        HttpResponse.json(pageOf(new URL(request.url).searchParams.has("q") ? 0 : 3)),
      ),
    );
    const user = userEvent.setup();
    const { router } = renderAt("/?q=unobtainium&status=OBSOLETE&sort=description");

    expect(await screen.findByText("No materials match")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    const emptyState = screen.getByRole("region", { name: "No materials match" });
    await user.click(within(emptyState).getByRole("button", { name: "Clear all" }));

    expect(await screen.findByRole("cell", { name: "MAT-000001" })).toBeInTheDocument();
    expect(router.state.location.search).toBe("?sort=description");
  });

  it("shows the server's error message, and Retry recovers once the API is back", async () => {
    let failing = true;
    server.use(
      http.get("/api/materials", () =>
        failing ? HttpResponse.json(serverError, { status: 500 }) : HttpResponse.json(pageOf(3)),
      ),
    );
    const user = userEvent.setup();
    renderAt("/?status=ACTIVE");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Couldn't load materials");
    expect(alert).toHaveTextContent("Something went wrong. Please try again.");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Search materials" })).toBeEnabled();
    expect(screen.getByRole("combobox", { name: "Status" })).toBeEnabled();

    failing = false;
    await user.click(within(alert).getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("cell", { name: "MAT-000001" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("Retry also reloads the plant options when they failed during the same outage", async () => {
    let failing = true;
    server.use(
      http.get("/api/materials", () =>
        failing ? HttpResponse.json(serverError, { status: 502 }) : HttpResponse.json(pageOf(3)),
      ),
      http.get("/api/plants", () =>
        failing
          ? HttpResponse.json(serverError, { status: 502 })
          : HttpResponse.json([{ id: 1, code: "1000", name: "Brisbane" }]),
      ),
    );
    const user = userEvent.setup();
    renderAt("/");

    const alert = await screen.findByRole("alert");
    failing = false;
    await user.click(within(alert).getByRole("button", { name: "Retry" }));
    await screen.findByRole("cell", { name: "MAT-000001" });

    await user.click(screen.getByRole("combobox", { name: "Plant" }));
    const listbox = await screen.findByRole("listbox");
    expect(
      await within(listbox).findByRole("option", { name: "1000 · Brisbane" }),
    ).toBeInTheDocument();
  });

  it("explains validation errors field by field, in the planner's words", async () => {
    const validationError: ApiError = {
      error: {
        code: "VALIDATION_ERROR",
        message: "The request has invalid parameters.",
        issues: [
          { path: "pageSize", message: "Must be one of 10, 25, 50 or 100" },
          { path: "q", message: "Too long" },
        ],
      },
    };
    server.use(
      http.get("/api/materials", () => HttpResponse.json(validationError, { status: 400 })),
    );

    renderAt("/");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("The request has invalid parameters.");
    expect(
      within(alert).getByText("Rows per page: Must be one of 10, 25, 50 or 100"),
    ).toBeVisible();
    expect(within(alert).getByText("Search: Too long")).toBeVisible();
  });

  it("says the server can't be reached when the backend is down", async () => {
    server.use(http.get("/api/materials", () => HttpResponse.error()));

    renderAt("/");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Can't reach the server. Check that it's running, then retry.",
    );
  });

  it("shows a failed request's error straight away instead of retrying it", async () => {
    let requests = 0;
    server.use(
      http.get("/api/materials", () => {
        requests += 1;
        return HttpResponse.json(serverError, { status: 500 });
      }),
    );

    renderAt("/");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
    expect(requests).toBe(1);
  });

  it("says the server can't be reached when a proxy answers with a non-API error", async () => {
    server.use(http.get("/api/materials", () => new HttpResponse("Bad Gateway", { status: 502 })));

    renderAt("/");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Can't reach the server (HTTP 502). Check that it's running, then retry.",
    );
  });

  it("reports a response it can't understand rather than crashing", async () => {
    server.use(http.get("/api/materials", () => HttpResponse.json({ rows: [] })));

    renderAt("/");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The server sent a response the app couldn't read.",
    );
  });

  it("keeps pagination usable when a page fails, so the planner can step back", async () => {
    server.use(
      http.get("/api/materials", ({ request }) =>
        pageParam(request) === 1
          ? HttpResponse.json(pageOf(60))
          : HttpResponse.json(serverError, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    const { router } = renderAt("/");
    await screen.findByRole("cell", { name: "MAT-000001" });

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous page" }));

    expect(await screen.findByRole("cell", { name: "MAT-000001" })).toBeInTheDocument();
    expect(router.state.location.search).toBe("");
  });
});
