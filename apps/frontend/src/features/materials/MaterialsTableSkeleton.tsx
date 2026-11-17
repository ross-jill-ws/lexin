import { Skeleton, Table } from "@mantine/core";
import { materialColumns } from "./columns";

const ROWS = 10;
const headers = materialColumns.map((column) => String(column.header));

/** Placeholder for the first load: the real headers over shimmering rows. */
export function MaterialsTableSkeleton() {
  return (
    <Table.ScrollContainer minWidth={1100}>
      <Table aria-label="Loading materials" aria-busy>
        <Table.Thead>
          <Table.Tr>
            {headers.map((header) => (
              <Table.Th key={header}>{header}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {Array.from({ length: ROWS }, (_, row) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
            <Table.Tr key={row}>
              {headers.map((header) => (
                <Table.Td key={header}>
                  <Skeleton height={12} radius="sm" />
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
