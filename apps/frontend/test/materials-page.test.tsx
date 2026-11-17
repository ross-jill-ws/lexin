import type { Material, MaterialsResponse } from "@material-register/shared";
import { screen, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { renderAt } from "./render";
import { server } from "./server";

const bearing: Material = {
  id: 1,
  materialNumber: "MAT-000123",
  description: "Bearing, deep groove ball, 25mm bore",
  materialType: "SPARE_PART",
  manufacturer: { name: "SKF" },
  manufacturerPartNumber: "6205-2RS1",
  plant: { code: "1000", name: "Brisbane" },
  status: "OBSOLETE",
  unitOfMeasure: "EA",
  unitPrice: "1234.50",
  quantityOnHand: 7,
  updatedAt: "2025-03-14T02:00:00.000Z",
};

const grease: Material = {
  ...bearing,
  id: 2,
  materialNumber: "MAT-000124",
  description: "Bearing grease, lithium complex, 400g",
  materialType: "CONSUMABLE",
  status: "ACTIVE",
};

function mockMaterials(data: Material[]) {
  const body: MaterialsResponse = {
    data,
    page: 1,
    pageSize: 25,
    total: data.length,
    totalPages: 1,
  };
  server.use(http.get("/api/materials", () => HttpResponse.json(body)));
}

describe("Materials page", () => {
  it("shows a row per material from the API", async () => {
    mockMaterials([bearing, grease]);

    renderAt("/");

    expect(await screen.findByRole("cell", { name: "MAT-000123" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "MAT-000124" })).toBeInTheDocument();
    // header row + 2 data rows
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it("formats each column the way a planner reads it", async () => {
    mockMaterials([bearing]);

    renderAt("/");

    const row = (await screen.findByRole("cell", { name: "MAT-000123" })).closest("tr");
    if (!row) throw new Error("row not found");
    const cells = within(row);
    expect(cells.getByText("Bearing, deep groove ball, 25mm bore")).toBeInTheDocument();
    expect(cells.getByText("Spare Part")).toBeInTheDocument();
    expect(cells.getByText("SKF")).toBeInTheDocument();
    expect(cells.getByText("6205-2RS1")).toBeInTheDocument();
    expect(cells.getByText("1000 · Brisbane")).toBeInTheDocument();
    expect(cells.getByText("Obsolete")).toBeInTheDocument();
    expect(cells.getByText("EA")).toBeInTheDocument();
    expect(cells.getByText("$1,234.50")).toBeInTheDocument();
    expect(cells.getByText("7")).toBeInTheDocument();
    expect(cells.getByText("14 Mar 2025")).toBeInTheDocument();
  });

  it("shows the total number of matching materials", async () => {
    mockMaterials([bearing, grease]);

    renderAt("/");

    expect(await screen.findByText("2 materials")).toBeInTheDocument();
  });

  it("uses the singular for a single material", async () => {
    mockMaterials([bearing]);

    renderAt("/");

    expect(await screen.findByText("1 material")).toBeInTheDocument();
  });
});
