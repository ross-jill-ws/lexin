import type { Material } from "@material-register/shared";
import { createColumnHelper } from "@tanstack/react-table";
import { formatDate, formatPlant, formatPrice, formatQuantity, materialTypeLabels } from "./format";
import { StatusBadge } from "./StatusBadge";

const column = createColumnHelper<Material>();

/** Column ids double as the API's sort fields; columns the API can't sort opt out. */
export const materialColumns = [
  column.accessor("materialNumber", { header: "Material #" }),
  column.accessor("description", { header: "Description" }),
  column.accessor("materialType", {
    header: "Type",
    cell: (info) => materialTypeLabels[info.getValue()],
  }),
  column.accessor("manufacturer.name", { id: "manufacturer", header: "Manufacturer" }),
  column.accessor("manufacturerPartNumber", { header: "MPN", enableSorting: false }),
  column.accessor("plant", { header: "Plant", cell: (info) => formatPlant(info.getValue()) }),
  column.accessor("status", {
    header: "Status",
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  column.accessor("unitOfMeasure", { header: "UoM", enableSorting: false }),
  column.accessor("unitPrice", {
    header: "Unit price",
    cell: (info) => formatPrice(info.getValue()),
    meta: { align: "right" },
  }),
  column.accessor("quantityOnHand", {
    header: "Qty on hand",
    cell: (info) => formatQuantity(info.getValue()),
    meta: { align: "right" },
  }),
  column.accessor("updatedAt", {
    header: "Last updated",
    cell: (info) => formatDate(info.getValue()),
  }),
];
