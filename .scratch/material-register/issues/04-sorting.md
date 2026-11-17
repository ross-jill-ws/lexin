# 04 — Sorting by column header

**What to build:** A planner can click any sortable column header to sort the whole result set on the server, and click it again to reverse the direction. The sort shows on the column header and lives in the URL. Paging stays stable when rows have equal sort values.

**Blocked by:** 03 — Server-side pagination with URL state

**Status:** done

- [x] Shared query schema adds `sort` (materialNumber, description, materialType, status, plant, manufacturer, unitPrice, quantityOnHand, updatedAt; default updatedAt) and `order` (asc/desc; default desc)
- [x] API orders in the database by the chosen column (plant sorts by plant code, manufacturer by manufacturer name), always appending id as a tiebreaker
- [x] Invalid sort or order returns 400 with issues
- [x] TanStack Table runs in manual-sorting mode; clicking a header sets the sort, and clicking again toggles direction
- [x] The sorted column shows a direction indicator; non-sortable columns aren't clickable
- [x] Sort lives in the URL and changing it resets to page 1
- [x] HTTP-seam tests cover every sort column in both directions and the stable tiebreak across pages; page-seam tests cover header toggling and URL updates; written test-first

## Comments

**Implemented (TDD, red → green at both agreed seams).**

- `packages/shared/src/sorting.ts`: `SORT_FIELDS`, `SORT_ORDERS`, defaults and `sortingQueryShape` (`sort` default `updatedAt`, `order` default `desc`, readable error messages). `materialsQuerySchema` now spreads it alongside the pagination shape.
- `apps/backend/src/repositories/materials-repository.ts`: a `sortColumns` map from each sort field to its DB expression (plant → `plants.code`, manufacturer → `manufacturers.name`), ordered `direction(column), direction(id)` so ties page deterministically. Invalid `sort`/`order` produce 400 VALIDATION_ERROR through the existing validator hook.
- Frontend: `SortableHeader` (button + aria-hidden ▲/▼ arrow), `MaterialsTable` runs TanStack Table with `manualSorting`, controlled `state.sorting`, `sortDescFirst: false` and `enableSortingRemoval: false`; header cells carry `aria-sort`. MPN and UoM columns set `enableSorting: false` and render as plain text. `useMaterialsUrlState` gained `setSort`, which (like every non-page update) resets to page 1 and drops default values from the URL.
- Tests: `apps/backend/test/materials-sorting.test.ts` (all 9 columns × both directions against literal expected orders, default direction, stable id tiebreak across 3 pages in both directions, 400s for bad sort/order); `apps/frontend/test/materials-sorting.test.tsx` (default indicator, sortable vs plain headers, click → asc then toggle, toggling the default column, reset to page 1, URL → initial sort, malformed sort fallback, back button).

**Decisions / deviations.**

- Material type and status sort by their enum *text* (`::text`), so they read alphabetically (Consumable, Raw Material, Spare Part, Tool) rather than in Postgres enum declaration order.
- A click on a new column always starts ascending (including numeric/date columns); clicking again flips direction. The sort is never cleared, since there is always a server sort.
- The API client still sends every query field explicitly, so request query strings now include `sort` and `order`; two existing pagination test expectations were updated accordingly.
