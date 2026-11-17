import { Group, UnstyledButton } from "@mantine/core";
import type { SortDirection } from "@tanstack/react-table";
import type { ReactNode } from "react";

const arrows: Record<SortDirection, string> = { asc: "▲", desc: "▼" };

type Props = { label: ReactNode; direction: SortDirection | false; onToggle: () => void };

/** A header label that toggles the sort, with an arrow on the sorted column. */
export function SortableHeader({ label, direction, onToggle }: Props) {
  return (
    <UnstyledButton onClick={onToggle} fw="inherit" fz="inherit">
      <Group gap={4} wrap="nowrap" component="span">
        {label}
        {direction && (
          <span aria-hidden="true" style={{ fontSize: "0.7em" }}>
            {arrows[direction]}
          </span>
        )}
      </Group>
    </UnstyledButton>
  );
}
