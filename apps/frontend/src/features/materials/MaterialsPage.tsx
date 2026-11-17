import { Button, Group, Text, Title } from "@mantine/core";
import type { MaterialsResponse } from "@material-register/shared";
import { useLastDefined } from "../../lib/useLastDefined";
import { FilterBar } from "./FilterBar";
import { formatMaterialCount, formatQuantity } from "./format";
import classes from "./MaterialsPage.module.css";
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

/** "Showing 11–20 of 5,000", or nothing when the page holds no rows. */
function rangeLabel({ page, pageSize, total, data }: MaterialsResponse) {
  if (data.length === 0) return undefined;
  const first = (page - 1) * pageSize + 1;
  return `Showing ${formatQuantity(first)}–${formatQuantity(first + data.length - 1)} of ${formatQuantity(total)}`;
}

export function MaterialsPage() {
  const { query, isNarrowed, setSearch, setFilters, clearAll, setPage, setPageSize, setSort } =
    useMaterialsUrlState();
  const result = useMaterials(query);
  const { data, error } = result;
  const knownTotalPages = useLastDefined(data?.totalPages);
  const totalPages = paginationTotal(data, error, knownTotalPages);

  return (
    <>
      <div className={classes.heading}>
        <div>
          <Text className={classes.eyebrow}>Stores register · All plants</Text>
          <Title order={1} className={classes.title}>
            Materials
          </Title>
        </div>
        {data && <Text className={classes.count}>{formatMaterialCount(data.total)}</Text>}
      </div>

      <section className={classes.sheet} aria-label="Materials register">
        <div className={classes.toolbar}>
          <SearchInput value={query.q} onChange={setSearch} />
          <FilterBar filters={query} onChange={setFilters} />
          {isNarrowed && (
            <Button variant="subtle" color="graphite.7" onClick={clearAll}>
              Clear all
            </Button>
          )}
        </div>

        <div className={classes.results}>
          <MaterialsResults
            result={result}
            sort={{ sort: query.sort, order: query.order }}
            onSortChange={setSort}
            onGoToPage={setPage}
            onClearAll={isNarrowed ? clearAll : undefined}
          />
        </div>

        <div className={classes.footer}>
          <Group gap="md">
            <PageSizePicker value={query.pageSize} onChange={setPageSize} />
            {data && <Text className={classes.range}>{rangeLabel(data)}</Text>}
          </Group>
          {totalPages !== undefined && (
            <MaterialsPagination page={query.page} totalPages={totalPages} onChange={setPage} />
          )}
        </div>
      </section>
    </>
  );
}
