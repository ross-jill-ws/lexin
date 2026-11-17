import { Link, useLocation } from "react-router";
import classes from "./MaterialsTable.module.css";

/** State the list hands to the detail page, so "Back to the register" restores the view. */
export type ListReturnState = { listSearch: string };

/** A material number that opens the material's page, remembering the list's search params. */
export function MaterialLink({ materialNumber }: { materialNumber: string }) {
  const { search } = useLocation();
  const state: ListReturnState = { listSearch: search };
  return (
    <Link
      to={`/materials/${encodeURIComponent(materialNumber)}`}
      state={state}
      className={classes.materialLink}
    >
      {materialNumber}
    </Link>
  );
}
