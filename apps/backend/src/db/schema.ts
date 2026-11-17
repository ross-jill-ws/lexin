import { MATERIAL_STATUSES, MATERIAL_TYPES, UNITS_OF_MEASURE } from "@material-register/shared";
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const materialTypeEnum = pgEnum("material_type", MATERIAL_TYPES);
export const materialStatusEnum = pgEnum("material_status", MATERIAL_STATUSES);
export const unitOfMeasureEnum = pgEnum("unit_of_measure", UNITS_OF_MEASURE);

export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 4 }).notNull().unique(),
  name: text("name").notNull(),
});

export const manufacturers = pgTable("manufacturers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const materials = pgTable(
  "materials",
  {
    id: serial("id").primaryKey(),
    materialNumber: varchar("material_number", { length: 20 }).notNull().unique(),
    description: text("description").notNull(),
    materialType: materialTypeEnum("material_type").notNull(),
    manufacturerId: integer("manufacturer_id")
      .notNull()
      .references(() => manufacturers.id, { onDelete: "restrict" }),
    manufacturerPartNumber: text("manufacturer_part_number").notNull(),
    plantId: integer("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "restrict" }),
    status: materialStatusEnum("status").notNull().default("ACTIVE"),
    unitOfMeasure: unitOfMeasureEnum("unit_of_measure").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    quantityOnHand: integer("quantity_on_hand").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("materials_quantity_on_hand_non_negative", sql`${t.quantityOnHand} >= 0`),
    // Search: trigram GIN indexes make ILIKE '%term%' index-assisted.
    index("materials_material_number_trgm_idx").using("gin", t.materialNumber.op("gin_trgm_ops")),
    index("materials_description_trgm_idx").using("gin", t.description.op("gin_trgm_ops")),
    index("materials_mpn_trgm_idx").using("gin", t.manufacturerPartNumber.op("gin_trgm_ops")),
    // Postgres does not index foreign keys automatically.
    index("materials_plant_id_idx").on(t.plantId),
    index("materials_manufacturer_id_idx").on(t.manufacturerId),
    // Filters.
    index("materials_material_type_idx").on(t.materialType),
    index("materials_status_idx").on(t.status),
    // Sorts, with id as the tiebreaker so pages are deterministic. NULLS FIRST matches
    // the default ORDER BY ... DESC so the planner can use the index directly.
    index("materials_updated_at_id_idx").on(
      t.updatedAt.desc().nullsFirst(),
      t.id.desc().nullsFirst(),
    ),
    index("materials_unit_price_id_idx").on(t.unitPrice, t.id),
    index("materials_quantity_on_hand_id_idx").on(t.quantityOnHand, t.id),
  ],
);
