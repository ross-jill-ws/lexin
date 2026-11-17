import type { MaterialStatus, MaterialType } from "@material-register/shared";

const currency = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
const integer = new Intl.NumberFormat("en-AU");
const date = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" });

/** Prices arrive as exact decimal strings; Number is fine for display only. */
export const formatPrice = (decimal: string) => currency.format(Number(decimal));
export const formatQuantity = (value: number) => integer.format(value);
export const formatMaterialCount = (total: number) =>
  `${integer.format(total)} ${total === 1 ? "material" : "materials"}`;
export const formatDate = (iso: string) => date.format(new Date(iso));
export const formatPlant = (plant: { code: string; name: string }) =>
  `${plant.code} · ${plant.name}`;

export const materialTypeLabels: Record<MaterialType, string> = {
  SPARE_PART: "Spare Part",
  CONSUMABLE: "Consumable",
  RAW_MATERIAL: "Raw Material",
  TOOL: "Tool",
};

export const materialStatusLabels: Record<MaterialStatus, string> = {
  ACTIVE: "Active",
  OBSOLETE: "Obsolete",
  PENDING_REVIEW: "Pending Review",
};
