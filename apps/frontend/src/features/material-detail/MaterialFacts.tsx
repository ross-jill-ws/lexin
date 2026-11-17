import type { Material } from "@material-register/shared";
import type { ReactNode } from "react";
import {
  formatDate,
  formatPlant,
  formatPrice,
  formatQuantity,
  formatStockValue,
  materialTypeLabels,
} from "../materials/format";
import { StatusBadge } from "../materials/StatusBadge";
import classes from "./MaterialDetailPage.module.css";

type FactProps = { label: string; children: ReactNode; mono?: boolean; hero?: boolean };

/** A label/value pair in a description list. */
function Fact({ label, children, mono }: FactProps) {
  return (
    <div className={classes.fact}>
      <dt>{label}</dt>
      <dd className={mono ? classes.mono : undefined}>{children}</dd>
    </div>
  );
}

function StockFact({ label, children, hero }: FactProps) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={hero ? classes.hero : undefined}>{children}</dd>
    </div>
  );
}

/** The material's specification and stock position. */
export function MaterialFacts({ material }: { material: Material }) {
  return (
    <section aria-label="Material details" className={classes.body}>
      <dl className={classes.facts}>
        <Fact label="Type">{materialTypeLabels[material.materialType]}</Fact>
        <Fact label="Status">
          <StatusBadge status={material.status} />
        </Fact>
        <Fact label="Manufacturer">{material.manufacturer.name}</Fact>
        <Fact label="Manufacturer part number" mono>
          {material.manufacturerPartNumber}
        </Fact>
        <Fact label="Plant">{formatPlant(material.plant)}</Fact>
        <Fact label="Unit of measure" mono>
          {material.unitOfMeasure}
        </Fact>
        <Fact label="Last updated">{formatDate(material.updatedAt)}</Fact>
        <Fact label="Material number" mono>
          {material.materialNumber}
        </Fact>
      </dl>
      <dl className={classes.stock}>
        <StockFact label="Quantity on hand" hero>
          {formatQuantity(material.quantityOnHand)}
        </StockFact>
        <div className={classes.stockRule} />
        <StockFact label="Unit price">{formatPrice(material.unitPrice)}</StockFact>
        <StockFact label="Stock value">
          {formatStockValue(material.unitPrice, material.quantityOnHand)}
        </StockFact>
      </dl>
    </section>
  );
}
