import { DEFAULT_PAGE, type MaterialsQuery, materialsQuerySchema } from "@material-register/shared";
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { parseSearchParams, toQueryString } from "../../lib/search-params";
import type { Filters } from "./FilterBar";

const defaults = materialsQuerySchema.parse({});

/** Everything Clear all resets: the search and every filter. */
const cleared = { q: undefined, type: undefined, status: undefined, plant: undefined };

/**
 * The URL is the single source of truth for the table's view. Any change other than the
 * page itself returns to page 1; default values are kept out of the URL.
 */
export function useMaterialsUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useMemo(
    () => parseSearchParams(materialsQuerySchema, searchParams),
    [searchParams],
  );

  const update = useCallback(
    (patch: Partial<MaterialsQuery>) =>
      setSearchParams(toQueryString({ ...query, page: DEFAULT_PAGE, ...patch }, defaults)),
    [query, setSearchParams],
  );

  return {
    query,
    /** True when a search or any filter is applied. */
    isNarrowed: Object.keys(cleared).some((key) => query[key as keyof typeof cleared]),
    setSearch: (q: string | undefined) => update({ q }),
    setFilters: (patch: Partial<Filters>) => update(patch),
    clearAll: () => update(cleared),
    setPage: (page: number) => update({ page }),
    setPageSize: (pageSize: MaterialsQuery["pageSize"]) => update({ pageSize }),
    setSort: (sort: Pick<MaterialsQuery, "sort" | "order">) => update(sort),
  };
}
