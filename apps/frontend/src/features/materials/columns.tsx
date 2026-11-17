import type { Material } from "@material-register/shared";
import { createColumnHelper } from "@tanstack/react-table";
import { formatDate, formatPlant, formatPrice, formatQuantity, materialTypeLabels } from "./format";
import { MaterialLink } from "./MaterialLink";
import classes from "./MaterialsTable.module.css";
import { StatusBadge } from "./StatusBadge";

const column = createColumnHelper<Material>();

/**
 * Column ids double as the API's sort fields; columns the API can't sort opt out. Widths are
 * fixed (description takes the rest) so every row stays one line high.
 */
export const materialColumns = [
  column.accessor("materialNumber", {
    header: "Material #",
    cell: (info) => <MaterialLink materialNumber={info.getValue()} />,
    meta: { width: 118 },
  }),
  column.accessor("description", {
    header: "Description",
    cell: (info) => <span title={info.getValue()}>{info.getValue()}</span>,
  }),
  column.accessor("materialType", {
    header: "Type",
    cell: (info) => materialTypeLabels[info.getValue()],
    meta: { width: 112 },
  }),
  column.accessor("manufacturer.name", {
    id: "manufacturer",
    header: "Manufacturer",
    meta: { width: 128 },
  }),
  column.accessor("manufacturerPartNumber", {
    header: "MPN",
    enableSorting: false,
    cell: (info) => <span className={classes.mono}>{info.getValue()}</span>,
    meta: { width: 132 },
  }),
  column.accessor("plant", {
    header: "Plant",
    cell: (info) => formatPlant(info.getValue()),
    meta: { width: 148 },
  }),
  column.accessor("status", {
    header: "Status",
    cell: (info) => <StatusBadge status={info.getValue()} />,
    meta: { width: 140 },
  }),
  column.accessor("unitOfMeasure", {
    header: "UoM",
    enableSorting: false,
    cell: (info) => <span className={classes.mono}>{info.getValue()}</span>,
    meta: { width: 64 },
  }),
  column.accessor("unitPrice", {
    header: "Unit price",
    cell: (info) => <span className={classes.mono}>{formatPrice(info.getValue())}</span>,
    meta: { align: "right", width: 108 },
  }),
  column.accessor("quantityOnHand", {
    header: "Qty on hand",
    cell: (info) => <span className={classes.mono}>{formatQuantity(info.getValue())}</span>,
    meta: { align: "right", width: 92 },
  }),
  column.accessor("updatedAt", {
    header: "Last updated",
    cell: (info) => <span className={classes.dim}>{formatDate(info.getValue())}</span>,
    meta: { width: 112 },
  }),
];
