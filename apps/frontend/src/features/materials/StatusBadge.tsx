import { Badge } from "@mantine/core";
import type { MaterialStatus } from "@material-register/shared";
import { materialStatusLabels } from "./format";

const colors: Record<MaterialStatus, string> = {
  ACTIVE: "green",
  OBSOLETE: "red",
  PENDING_REVIEW: "yellow",
};

export function StatusBadge({ status }: { status: MaterialStatus }) {
  return (
    <Badge color={colors[status]} variant="light">
      {materialStatusLabels[status]}
    </Badge>
  );
}
