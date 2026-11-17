# 03 — Server-side pagination with URL state

**What to build:** A planner can page through materials and choose a page size, and the current page and size always live in the URL. Refreshing, sharing the link, or using back/forward reproduces the view. Hand-edited or malformed URLs fall back to sensible defaults, and the API rejects invalid pagination input with a clear, structured 400.

**Blocked by:** 01 — Walking skeleton

**Status:** done

- [x] Shared materials query schema defines `page` (positive integer, default 1) and `pageSize` (one of 10, 25, 50, 100, default 25), with coercion from query strings
- [x] API validates these via the Zod validator; invalid values return 400 `VALIDATION_ERROR` with field-level issues in the shared error shape
- [x] Pagination happens in the database (LIMIT/OFFSET plus a total count); `total` and `totalPages` are correct
- [x] A page past the end returns empty data with the correct total and totalPages (not an error)
- [x] Frontend URL-state hook parses search params with the shared schema, falls back to defaults for invalid values, exposes typed state and updaters, and leaves default values out of the URL
- [x] Changing page size resets to page 1
- [x] Pagination control and page-size picker are separate, small components; total count is displayed
- [x] Browser refresh, shared URL and back/forward all restore the same view
- [x] A URL past the last page shows a helpful message with a way back to the last valid page
- [x] HTTP-seam and page-seam tests cover the above, written test-first

## Comments

**Implemented (TDD at the HTTP seam and the Materials page seam).**

- **Shared:** `pagination.ts` now exports `PAGE_SIZES`, `DEFAULT_PAGE`, `PageSize` and `paginationQueryShape` (`page` is a coerced positive integer that defaults to 1; `pageSize` is a coerced literal of 10/25/50/100 that defaults to 25, with readable messages). `material.ts` exports `materialsQuerySchema` / `MaterialsQuery`, built by spreading that shape so tickets 04–06 can add sort, search and filter fields to it.
- **Backend:** `src/validation.ts` has a `validate(target, schema)` wrapper around `zValidator`. Its hook maps every Zod issue to the shared error shape: a 400 `VALIDATION_ERROR` with `issues: [{ path, message }]`, and all invalid fields are reported together. The route validates the query and passes it to the repository. The repository now takes `MaterialsQuery` and already paged in SQL with LIMIT/OFFSET plus `count()`, so the old `DEFAULT_LIST_QUERY` and `ListMaterialsQuery` were removed. Tests cover page and page-size slicing, a partial last page, a page past the end (empty data with correct totals), an empty table (`totalPages: 0`), and each invalid input.
- **Frontend:**
  - `lib/search-params.ts` has a generic `parseSearchParams(schema, params)`. It parses **field by field**, so one bad value falls back to its own default without discarding the rest of the URL. `toSearchParams(values, omit)` drops values equal to the defaults.
  - `useMaterialsUrlState` exposes `query`, `setPage` and `setPageSize`. Any change other than the page resets to page 1.
  - `useMaterials(query)` is keyed on the parsed query and uses `keepPreviousData`. `api.listMaterials(query)` always sends explicit params.
  - The small components are `MaterialsPagination` (Mantine Pagination with labelled first/prev/next/last controls), `PageSizePicker` ("Rows per page", NativeSelect) and `PageOutOfRange` (an alert with a "Go to page N" button that leads to the last valid page, or to page 1 when there are no results). The out-of-range check uses the *response's* page, so placeholder data can't make it flash. The total count display comes from ticket 01.
  - Page tests (`test/materials-pagination.test.tsx`) use an MSW fake that pages like the real API. They cover URL → request, next/numbered/previous navigation and the URL updates it causes, page 1 being left out of the URL, page size resetting to page 1, the page-size options, malformed URLs, back/forward, aria-current, and both out-of-range cases.

**Deviations / notes:** Restoring after a refresh or from a shared URL is covered by the "loads the page and page size named in the URL" test. A memory-router render at a URL is equivalent to a cold load, and the real-browser check is left to ticket 09. Several malformed-URL and back/forward tests passed on their first run because the URL-state hook from the earlier slice already handled them. They are kept as specification. The page-size picker is a `NativeSelect` rather than a Mantine combobox `Select`, for accessibility and simplicity.
