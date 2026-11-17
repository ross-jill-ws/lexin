import { Table } from "@mantine/core";
import { type Material, type MaterialsQuery, sortingQueryShape } from "@material-register/shared";
import {
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  type Header,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { materialColumns } from "./columns";
import { SortableHeader } from "./SortableHeader";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    align?: "left" | "right";
  }
}

type Sort = Pick<MaterialsQuery, "sort" | "order">;

type Props = { materials: Material[]; sort: Sort; onSortChange: (sort: Sort) => void };

const ariaSort = { asc: "ascending", desc: "descending" } as const;

/**
 * Headless TanStack Table for column definitions; Mantine renders the markup. Sorting is
 * manual: the table only reports header clicks, and the server orders the rows.
 */
export function MaterialsTable({ materials, sort, onSortChange }: Props) {
  const sorting: SortingState = [{ id: sort.sort, desc: sort.order === "desc" }];
  const table = useReactTable({
    data: materials,
    columns: materialColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
    manualPagination: true,
    manualSorting: true,
    state: { sorting },
    onSortingChange: (updater) => {
      const [next] = functionalUpdate(updater, sorting);
      if (next) {
        onSortChange({
          sort: sortingQueryShape.sort.parse(next.id),
          order: next.desc ? "desc" : "asc",
        });
      }
    },
    // A new column starts ascending; clicking it again only flips direction, never clears it.
    sortDescFirst: false,
    enableSortingRemoval: false,
  });

  return (
    <Table.ScrollContainer minWidth={1100}>
      <Table striped highlightOnHover>
        <Table.Thead>
          {table.getHeaderGroups().map((group) => (
            <Table.Tr key={group.id}>
              {group.headers.map((header) => (
                <HeaderCell key={header.id} header={header} />
              ))}
            </Table.Tr>
          ))}
        </Table.Thead>
        <Table.Tbody>
          {table.getRowModel().rows.map((row) => (
            <Table.Tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <Table.Td key={cell.id} ta={cell.column.columnDef.meta?.align}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

function HeaderCell({ header }: { header: Header<Material, unknown> }) {
  const { column } = header;
  const label = flexRender(column.columnDef.header, header.getContext());
  const direction = column.getIsSorted();
  return (
    <Table.Th
      ta={column.columnDef.meta?.align}
      aria-sort={column.getCanSort() ? (direction ? ariaSort[direction] : "none") : undefined}
    >
      {column.getCanSort() ? (
        <SortableHeader
          label={label}
          direction={direction}
          onToggle={() => column.toggleSorting(undefined, false)}
        />
      ) : (
        label
      )}
    </Table.Th>
  );
}
