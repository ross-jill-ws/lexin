# 06 — Filters (type, status, plant) + Clear all

**What to build:** A planner can narrow materials with multi-select filters for material type, status and plant, combined with search (e.g. "active SKF bearings at Brisbane"). Each filter can be cleared on its own, and Clear all resets search and every filter at once. All filter state lives in the URL, with plants identified by code.

**Blocked by:** 03 — Server-side pagination with URL state; 05 — Debounced search

**Status:** done

- [x] `GET /api/plants` returns all plants (id, code, name) ordered by code
- [x] Shared query schema adds `type`, `status` (enum values) and `plant` (plant codes) as optional comma-separated multi-value lists; unknown values return 400 with issues
- [x] API filters in the database: AND across filters, IN within a filter, combined with search
- [x] One reusable multi-select filter component, used three times inside a filter bar component; plant options come from the plants endpoint (cached with infinite stale time); type and status options come from the shared enums with human labels
- [x] Each filter is clearable individually; Clear all resets search and all filters and only shows when something is applied
- [x] Changing any filter resets to page 1
- [x] Manufacturer filter deliberately NOT included (held back for the live interview demo), though the API, schema and indexes make it easy to add
- [x] HTTP-seam tests: each filter alone, multiple values, filters combined with each other and with search, plants endpoint. Page-seam tests: selecting filters updates URL and request, URL restores selections, individual clear, Clear all. Written test-first

## Comments

**Implemented (TDD, red → green at the HTTP and page seams).**

- Shared: `packages/shared/src/filters.ts` adds `filtersQueryShape` (`type`, `status`, `plant`) built from one `commaList(item)` helper: values are split on commas, trimmed, de-duplicated, blanks dropped, and an empty list means no filter. Type/status validate against the shared enums. `materialsQuerySchema` spreads it in. `packages/shared/src/plant.ts` adds `plantSchema` / `plantsResponseSchema`.
- Backend: `GET /api/plants` (`routes/plants.ts` + `repositories/plants-repository.ts`) returns `{id, code, name}` ordered by code. `materials-repository.ts` builds one `whereCondition` = `and(search, type IN, status IN, plants.code IN)`; the count query now joins plants so the plant-code filter applies to totals.
- Frontend: `MultiSelectFilter` (generic, clearable Mantine MultiSelect; empty selection reports `undefined`) used three times in `FilterBar` (role `group` labelled "Filters"). Plant options come from `usePlants` (`staleTime: Infinity`), labelled "1000 · Brisbane" and keyed by code. `useMaterialsUrlState` gains `setFilters`, `clearAll` (resets `q` and every filter, keeps sort and page size) and `isNarrowed`; every change returns to page 1. The page shows "Clear all" only when `isNarrowed`. URLs keep list commas readable (`?type=TOOL,SPARE_PART`) via a new `toQueryString` helper, also used by the API client.
- Tests: `apps/backend/test/plants.test.ts`, `apps/backend/test/materials-filters.test.ts` (each filter alone, several values, AND across filters, with search, totals, unknown plant code, blank/padded/repeated values, 400 issues); `apps/frontend/test/materials-filters.test.tsx` (select updates URL and request and resets page, combined filters, readable options, URL restores selections, individual clear, Clear all, Clear all visibility, plants fetched once). Full suite: 85 backend + 41 frontend passing; typecheck and lint clean.
- Manufacturer filter deliberately not added. Adding it is one `commaList` entry in `filtersQueryShape`, one `inArray(manufacturers.name, …)` in `whereCondition` (the count query would need the manufacturers join), and one more `MultiSelectFilter` in `FilterBar`.

**Deviations / notes**

- "Unknown values return 400" holds for type and status (enum check). Plant codes are only checked for format (1–4 letters or digits). A well-formed but non-existent code (e.g. `plant=9999`) returns 200 with no rows rather than 400, because checking it would mean a database lookup during validation.
- Issue paths for a bad list item include its index (e.g. `type.1`), which points at the exact bad value.
- Mantine's MultiSelect clear button is `aria-hidden` with `tabindex=-1` by default. It is overridden so each per-filter clear ("Clear Type filter") is reachable by keyboard and screen readers.
- `Providers` takes an optional Mantine `env`; the test renderer passes `env="test"` (Mantine's recommended jsdom setting: no transitions or portals). The MSW server now serves an empty plant list by default so the other page tests don't make unhandled requests.
