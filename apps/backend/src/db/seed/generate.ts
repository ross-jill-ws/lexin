import { en, Faker } from "@faker-js/faker";
import type { MaterialStatus, MaterialType, UnitOfMeasure } from "@material-register/shared";
import { CATEGORY_TEMPLATES, MANUFACTURERS, type ManufacturerName, PLANTS } from "./catalogue";

export type SeedOptions = {
  /** Number of materials to generate. */
  count?: number;
  /** Faker seed; the same seed always produces the same data. */
  seed?: number;
  /** "Now" for the generated data. Fixed by default so runs are identical. */
  referenceDate?: Date;
};

/** A material as generated: plant and manufacturer by natural key, resolved to ids on insert. */
export type SeedMaterial = {
  materialNumber: string;
  description: string;
  materialType: MaterialType;
  manufacturerName: ManufacturerName;
  manufacturerPartNumber: string;
  plantCode: string;
  status: MaterialStatus;
  unitOfMeasure: UnitOfMeasure;
  unitPrice: string;
  quantityOnHand: number;
  updatedAt: Date;
};

export const DEFAULT_SEED_OPTIONS = {
  count: 5000,
  seed: 20_240_601,
  referenceDate: new Date("2026-11-01T00:00:00Z"),
} as const satisfies Required<SeedOptions>;

const MAX_QUANTITY = 500;

const STATUS_WEIGHTS = [
  { weight: 75, value: "ACTIVE" },
  { weight: 15, value: "OBSOLETE" },
  { weight: 10, value: "PENDING_REVIEW" },
] as const satisfies readonly { weight: number; value: MaterialStatus }[];

export function generateSeed(options: SeedOptions = {}) {
  const count = options.count ?? DEFAULT_SEED_OPTIONS.count;
  const seed = options.seed ?? DEFAULT_SEED_OPTIONS.seed;
  const referenceDate = options.referenceDate ?? DEFAULT_SEED_OPTIONS.referenceDate;
  const f = new Faker({ locale: [en] });
  f.seed(seed);

  const threeYearsBefore = new Date(referenceDate);
  threeYearsBefore.setUTCFullYear(referenceDate.getUTCFullYear() - 3);
  const templates = CATEGORY_TEMPLATES.map((t) => ({ weight: t.weight, value: t }));

  const materials = Array.from({ length: count }, (_, i): SeedMaterial => {
    const template = f.helpers.weightedArrayElement(templates);
    const item = template.make(f);
    return {
      materialNumber: `MAT-${String(i + 1).padStart(6, "0")}`,
      description: item.description,
      materialType: template.materialType,
      manufacturerName: item.manufacturer,
      manufacturerPartNumber: item.manufacturerPartNumber,
      plantCode: f.helpers.arrayElement(PLANTS).code,
      status: f.helpers.weightedArrayElement(STATUS_WEIGHTS),
      unitOfMeasure: template.unitOfMeasure,
      unitPrice: f.number.float({ ...template.price, fractionDigits: 2 }).toFixed(2),
      // u^4 piles most stock near zero, with a long tail of well-stocked items.
      quantityOnHand: Math.floor(MAX_QUANTITY * f.number.float() ** 4),
      updatedAt: f.date.between({ from: threeYearsBefore, to: referenceDate }),
    };
  });

  return {
    plants: PLANTS.map(({ code, name }): { code: string; name: string } => ({ code, name })),
    manufacturers: MANUFACTURERS.map((name) => ({ name })),
    materials,
  };
}
