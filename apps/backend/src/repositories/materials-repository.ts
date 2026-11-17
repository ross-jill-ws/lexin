import type {
  Material,
  MaterialsQuery,
  MaterialsResponse,
  SortField,
} from "@material-register/shared";
import {
  type AnyColumn,
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { Db } from "../db/client";
import { manufacturers, materials, plants } from "../db/schema";

/**
 * The database expression behind each sortable field. Plant sorts by code, manufacturer by
 * name, and the enums by their text so types and statuses read alphabetically.
 */
const sortColumns: Record<SortField, AnyColumn | SQL> = {
  materialNumber: materials.materialNumber,
  description: materials.description,
  materialType: sql`${materials.materialType}::text`,
  status: sql`${materials.status}::text`,
  plant: plants.code,
  manufacturer: manufacturers.name,
  unitPrice: materials.unitPrice,
  quantityOnHand: materials.quantityOnHand,
  updatedAt: materials.updatedAt,
};

/** Escapes LIKE's wildcards (% and _) and its escape character (backslash) so they match literally. */
const escapeLike = (term: string) => term.replace(/[\\%_]/g, "\\$&");

/** Case-insensitive substring match on the searchable fields; undefined means no search. */
function searchCondition(q: string | undefined): SQL | undefined {
  if (q === undefined) return undefined;
  const pattern = `%${escapeLike(q)}%`;
  return or(
    ilike(materials.materialNumber, pattern),
    ilike(materials.description, pattern),
    ilike(materials.manufacturerPartNumber, pattern),
  );
}

/** Each filter is an IN over its values; filters and search are ANDed. Plants match by code. */
function whereCondition({ q, type, status, plant }: MaterialsQuery): SQL | undefined {
  return and(
    searchCondition(q),
    type && inArray(materials.materialType, type),
    status && inArray(materials.status, status),
    plant && inArray(plants.code, plant),
  );
}

/** The columns of a Material as the API returns it, with plant and manufacturer nested. */
const materialColumns = {
  id: materials.id,
  materialNumber: materials.materialNumber,
  description: materials.description,
  materialType: materials.materialType,
  manufacturer: { name: manufacturers.name },
  manufacturerPartNumber: materials.manufacturerPartNumber,
  plant: { code: plants.code, name: plants.name },
  status: materials.status,
  unitOfMeasure: materials.unitOfMeasure,
  unitPrice: materials.unitPrice,
  quantityOnHand: materials.quantityOnHand,
  updatedAt: materials.updatedAt,
};

type MaterialRow = Omit<Material, "updatedAt"> & { updatedAt: Date };
const toMaterial = (row: MaterialRow): Material => ({
  ...row,
  updatedAt: row.updatedAt.toISOString(),
});

/** Reads materials for the API. All materials SQL lives here. */
export function createMaterialsRepository(db: Db) {
  return {
    /** One material by number. Numbers are stored upper-case, so the unique index still serves. */
    async findByNumber(materialNumber: string): Promise<Material | undefined> {
      const [row] = await db
        .select(materialColumns)
        .from(materials)
        .innerJoin(plants, eq(materials.plantId, plants.id))
        .innerJoin(manufacturers, eq(materials.manufacturerId, manufacturers.id))
        .where(eq(materials.materialNumber, materialNumber.trim().toUpperCase()))
        .limit(1);
      return row && toMaterial(row);
    },

    async list(query: MaterialsQuery): Promise<MaterialsResponse> {
      const { sort, order, page, pageSize } = query;
      const direction = order === "asc" ? asc : desc;
      const where = whereCondition(query);
      const [rows, [totals]] = await Promise.all([
        db
          .select(materialColumns)
          .from(materials)
          .innerJoin(plants, eq(materials.plantId, plants.id))
          .innerJoin(manufacturers, eq(materials.manufacturerId, manufacturers.id))
          .where(where)
          // id breaks ties so equal sort values page deterministically.
          .orderBy(direction(sortColumns[sort]), direction(materials.id))
          .limit(pageSize)
          .offset((page - 1) * pageSize),
        // The plant filter matches on plant code, so the count joins plants too.
        db
          .select({ total: count() })
          .from(materials)
          .innerJoin(plants, eq(materials.plantId, plants.id))
          .where(where),
      ]);

      const total = totals?.total ?? 0;
      return {
        data: rows.map(toMaterial),
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      };
    },
  };
}

export type MaterialsRepository = ReturnType<typeof createMaterialsRepository>;
