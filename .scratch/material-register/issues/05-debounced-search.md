# 05 — Debounced search

**What to build:** A planner can type into one search box to find materials whose material number, description or manufacturer part number contains the text, case-insensitively. The request goes out only after a short pause in typing. The search term lives in the URL and can be cleared in one click.

**Blocked by:** 03 — Server-side pagination with URL state

**Status:** done

- [x] Shared query schema adds `q`: optional, trimmed, 1–100 characters (empty after trimming means no search); over 100 returns 400 with issues
- [x] API matches with case-insensitive substring (ILIKE), OR'd across material number, description and MPN, served by the trigram indexes
- [x] `%`, `_` and `\` in the term are escaped and matched literally
- [x] Search input is a small component holding local text and writing to the URL after a 300ms debounce; it syncs from the URL on navigation (back/forward, shared link)
- [x] Clear (×) control empties the search
- [x] Changing the search resets to page 1
- [x] HTTP-seam tests: each searchable field, case-insensitivity, partial match, literal `%`/`_`, trimming, too-long rejection. Page-seam tests: only one request after a typing burst, URL updated, clear works. Written test-first

## Comments

**Implemented (TDD at the HTTP seam and the Materials page seam).**

- **Shared:** a new `search.ts` exports `SEARCH_MAX_LENGTH` and `searchQueryShape`. `q` is an optional string that is trimmed, capped at 100 characters (message: "Search must be 100 characters or fewer.") and turned into `undefined` when blank. `materialsQuerySchema` spreads it first, so a search term leads the query string.
- **Backend:** the repository has a `searchCondition(q)` that ORs `ILIKE '%term%'` across material number, description and MPN. `escapeLike` backslash-escapes `\`, `%` and `_` first, so they match literally (Postgres's default LIKE escape is `\`). The same `WHERE` applies to the data query and the count, so totals count matches only. I checked the plan on the dev DB with `EXPLAIN`: it is a `BitmapOr` of the three `*_trgm_idx` GIN indexes. That check forced the plan with `enable_seqscan=off`, because at 5,000 rows a seq scan can win. Ticket 08 owns the measured benchmark. `test/materials-search.test.ts` has 23 tests: each field, OR across fields, case-insensitivity, nine literal-wildcard/backslash cases, trimming, blank means no search, an empty result, totals with paging, 100 characters accepted after trimming, and 101 rejected with a 400 issue on `q`.
- **Frontend:** `SearchInput` is a small component that holds the typed text locally. Through Mantine `useDebouncedCallback` it writes the trimmed term to the URL 300ms after typing stops. It skips the write (and cancels any pending one) when the term would not change, so a trailing space does not reset the page. When the URL changes from elsewhere (back/forward, a shared link, Clear all later on) it syncs its text during render and cancels any pending write. The × `CloseButton` ("Clear search") clears the box and the URL at once. A term over 100 characters shows the shared schema's message inline and is never sent. `useMaterialsUrlState` gained `setSearch`, and like every non-page change it resets to page 1. `test/materials-search.test.tsx` has 8 tests: one request after a typing burst (none during the pause), the URL updated, trimming, reset to page 1, no reset for a no-op edit, loading from the URL, clear, back/forward, and the over-long term.

**Deviations / notes:** The schema already trimmed and capped in the first slice, so the trimming and length tests passed on their first run. I mutation-checked them: removing `.trim()` and the blank transform makes 3 of them fail. I also mutation-checked the no-op-edit guard. Showing the over-long message inline in the UI goes slightly beyond the ticket; it serves user story 17. One test-isolation quirk: TanStack Query can let a background refetch from the previous test land after `cleanup`. So the over-long test asserts that no request carried the long term, rather than an exact request list.
