import { db } from "../src/db/client";
import { manufacturers, materials, plants } from "../src/db/schema";

type NewMaterial = typeof materials.$inferInsert;

export async function insertPlant(code = "1000", name = "Brisbane") {
  const [plant] = await db.insert(plants).values({ code, name }).returning();
  if (!plant) throw new Error("plant insert failed");
  return plant;
}

export async function insertManufacturer(name = "SKF") {
  const [manufacturer] = await db.insert(manufacturers).values({ name }).returning();
  if (!manufacturer) throw new Error("manufacturer insert failed");
  return manufacturer;
}

let sequence = 0;

/** Inserts one material; ids for plant and manufacturer are required, everything else defaults. */
export async function insertMaterial(
  overrides: Partial<NewMaterial> & Pick<NewMaterial, "plantId" | "manufacturerId">,
) {
  sequence += 1;
  const [material] = await db
    .insert(materials)
    .values({
      materialNumber: `MAT-${String(sequence).padStart(6, "0")}`,
      description: `Test material ${sequence}`,
      materialType: "SPARE_PART",
      manufacturerPartNumber: `MPN-${sequence}`,
      unitOfMeasure: "EA",
      unitPrice: "10.00",
      quantityOnHand: 1,
      ...overrides,
    })
    .returning();
  if (!material) throw new Error("material insert failed");
  return material;
}
