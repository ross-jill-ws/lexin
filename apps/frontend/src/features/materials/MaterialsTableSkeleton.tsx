import { Skeleton, Table } from "@mantine/core";
import { DEFAULT_PAGE_SIZE } from "@material-register/shared";
import { materialColumns } from "./columns";
import { TABLE_MIN_WIDTH } from "./MaterialsTable";
import classes from "./MaterialsTable.module.css";

const columns = materialColumns.map((column) => ({
  header: String(column.header),
  width: column.meta?.width,
}));

/** Placeholder for the first load: the real headers over shimmering rows. */
export function MaterialsTableSkeleton() {
  return (
    <Table.ScrollContainer minWidth={TABLE_MIN_WIDTH}>
      <Table
        className={classes.table}
        verticalSpacing={0}
        horizontalSpacing="sm"
        aria-label="Loading materials"
        aria-busy
      >
        <Table.Thead>
          <Table.Tr>
            {columns.map(({ header, width }) => (
              <Table.Th key={header} w={width}>
                {header}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {Array.from({ length: DEFAULT_PAGE_SIZE }, (_, row) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
            <Table.Tr key={row}>
              {columns.map(({ header }) => (
                <Table.Td key={header}>
                  <Skeleton height={10} radius={0} width="80%" />
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
