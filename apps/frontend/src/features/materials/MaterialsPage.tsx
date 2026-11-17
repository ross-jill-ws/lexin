import { Button, Container, Group, Stack, Text, Title } from "@mantine/core";
import type { MaterialsResponse } from "@material-register/shared";
import { useLastDefined } from "../../lib/useLastDefined";
import { FilterBar } from "./FilterBar";
import { formatMaterialCount } from "./format";
import { MaterialsPagination } from "./MaterialsPagination";
import { isPastLastPage, MaterialsResults } from "./MaterialsResults";
import { PageSizePicker } from "./PageSizePicker";
import { SearchInput } from "./SearchInput";
import { useMaterials } from "./useMaterials";
import { useMaterialsUrlState } from "./useMaterialsUrlState";

/**
 * How many pages the pagination offers, or undefined to hide it. After a failed load it keeps
 * the last known count, so the planner can still step back to a page that worked.
 */
function paginationTotal(
  data: MaterialsResponse | undefined,
  error: Error | null,
  knownTotalPages: number | undefined,
) {
  if (data) return isPastLastPage(data) ? undefined : data.totalPages;
  return error ? knownTotalPages : undefined;
}

export function MaterialsPage() {
  const { query, isNarrowed, setSearch, setFilters, clearAll, setPage, setPageSize, setSort } =
    useMaterialsUrlState();
  const result = useMaterials(query);
  const { data, error } = result;
  const knownTotalPages = useLastDefined(data?.totalPages);
  const totalPages = paginationTotal(data, error, knownTotalPages);

  return (
    <Container size="xl" py="lg">
      <Stack>
        <Group justify="space-between" align="baseline">
          <Title order={1}>Material Register</Title>
          {data && <Text c="dimmed">{formatMaterialCount(data.total)}</Text>}
        </Group>
        <Group align="flex-end">
          <SearchInput value={query.q} onChange={setSearch} />
          <FilterBar filters={query} onChange={setFilters} />
          {isNarrowed && (
            <Button variant="subtle" onClick={clearAll}>
              Clear all
            </Button>
          )}
        </Group>
        <MaterialsResults
          result={result}
          sort={{ sort: query.sort, order: query.order }}
          onSortChange={setSort}
          onGoToPage={setPage}
          onClearAll={isNarrowed ? clearAll : undefined}
        />
        <Group justify="space-between" align="flex-end">
          <PageSizePicker value={query.pageSize} onChange={setPageSize} />
          {totalPages !== undefined && (
            <MaterialsPagination page={query.page} totalPages={totalPages} onChange={setPage} />
          )}
        </Group>
      </Stack>
    </Container>
  );
}
