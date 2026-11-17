import type { MaterialStatus } from "@material-register/shared";
import { materialStatusLabels } from "./format";
import classes from "./StatusBadge.module.css";

/** A status lamp: a coloured indicator plus the label, never truncated. */
export function StatusBadge({ status }: { status: MaterialStatus }) {
  return (
    <span className={classes.status} data-status={status}>
      {materialStatusLabels[status]}
    </span>
  );
}
