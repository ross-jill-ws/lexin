import { Pagination } from "@mantine/core";

const controlLabels = {
  first: "First page",
  previous: "Previous page",
  next: "Next page",
  last: "Last page",
} as const;

type Props = { page: number; totalPages: number; onChange: (page: number) => void };

export function MaterialsPagination({ page, totalPages, onChange }: Props) {
  return (
    <Pagination
      value={page}
      total={totalPages}
      onChange={onChange}
      withEdges
      getControlProps={(control) => ({ "aria-label": controlLabels[control] })}
    />
  );
}
