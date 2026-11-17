# E2E report: ticket 09 re-run, 2026-11-18

**Summary: 19 PASS, 0 FAIL after the scenario 19 fixes were re-verified (initial run: 18 PASS, 1 FAIL on scenario 19, low severity visual issues). No high or medium defects.** Tested with ego-browser at 1440×900 (and 1024×900 for scenario 19) against http://localhost:5180. The backend was stopped for scenarios 12 and 18 and is running again (`curl localhost:3001/api/plants` returns the plants).

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 1 | Initial load | PASS | 10 rows, "Showing 1–10 of 5,000", "5,000 materials" badge, newest first (1 Nov 2026 down), AUD money, "4000 · Perth" plants, status badges. Page height equals the 900px viewport, so there is no page-level scrollbar. `01-initial.png` |
| 2 | Search | PASS | `00123` gives 11 (MAT-0012xx). `bearing` and `BEARING` both give 1,205. `6205` gives 91. Literal `%`, `_` and `100%` each give 0 results, so they are not wildcards. `02-search-number.png`, `02-search-bearing-upper.png`, `02-search-underscore.png` |
| 3 | Debounce | PASS | Typing "hydraulic" at 60ms per key produced exactly one `/api/materials?q=hydraulic…` request. |
| 4 | Filters | PASS | Type alone (996), Status alone (732 Obsolete), Plant alone (589 Newcastle, all rows 2100). Multi-value: Consumable+Tool 1,107, plants 1000+4000. Combined with search: 48. Toolbar height stays constant, and pills do not wrap (see defect 1 for truncation). `04-*.png` |
| 5 | Clearing | PASS | The per-filter "Clear Status filter" button removed only Status (URL kept q and plant). Clear all reset the search box, filters and URL to `/`. `05-*.png`, `06-after-clear-all.png` |
| 6 | Sorting | PASS | Material #, Unit price, Qty on hand and Last updated each toggle asc/desc. The ↑/↓ and `aria-sort` match the data order (e.g. MAT-000001 first ascending, MAT-005000 first descending; $4.02 ascending, $9,658.44 descending). `06-sort-*.png` |
| 7 | Paging | PASS | Next, previous and a specific page work. Page sizes 25/50/100 show 25/50/100 rows. Changing the page size, the search or a filter drops `page` (back to page 1). `07-*.png` |
| 8 | Refresh and shared URL | PASS | The reload and the new tab both restored the same search, filters, sort, page and page size, with an identical state snapshot. `08-restored.png` |
| 9 | Back and forward | PASS | Search, then sort, then next page. Back twice and forward once step through the earlier states correctly. |
| 10 | Malformed params | PASS | `?page=abc&pageSize=7&sort=nope&type=FOO` falls back to defaults (10 rows of 5,000). `?page=99999` shows a clear "Page 99999 doesn't exist… Go to page 500" notice. `?page=-1&order=sideways&status=X,ACTIVE` falls back to defaults. No crashes. `10-*.png` |
| 11 | Empty state | PASS | `zzzzqqq` shows "No materials match" with Clear all, and the heading badge reads "0 materials". Clear all restores the list. `11-empty-state.png` |
| 12 | Error state | PASS | With the backend down the list shows "Couldn't load materials / Can't reach the server (HTTP 502)…" and a Retry button. After the restart, Retry restored the list, and the Plant options (8 plants) loaded again. `12-error-state.png`, `12-recovered.png` |
| 13 | Detail page | PASS | Clicking MAT-002744 on page 2 of a filtered, sorted list opens `/materials/MAT-002744`. All 12 facts are shown. MAT-000042: $116.91 × 61 = $7,131.51, matching the screen. The values match `curl /api/materials/<n>`. `13-detail.png` |
| 14 | Back to register | PASS | Both "Back to the register" and browser back restored exactly `?q=bearing&status=ACTIVE&sort=unitPrice&order=desc&page=2`, with the same rows and the search box filled. `14-back-to-register.png` |
| 15 | Detail by direct URL | PASS | `/materials/MAT-000042` loads in a new tab, and Back goes to `/`. Lowercase `/materials/mat-000042` also loads (see defect 3). `15-*.png` |
| 16 | Unknown material | PASS | `/materials/MAT-999999` shows a styled "Material not found" notice with Back to the register. `/materials/abc` is handled the same way. `16-*.png` |
| 17 | Not-found page | PASS | `/foo`, `/materials`, `/materials/` and `/materials/MAT-000042/extra` all show the styled "Page not found" 404 notice with a button back to `/`. No raw React Router screen. `17-*.png` |
| 18 | Detail error state | PASS | With the backend stopped, the detail URL shows "Couldn't load this material" with Retry. After the restart, Retry showed the full material. `18-detail-error.png`, `18-detail-recovered.png` |
| 19 | Visual and UX review | FAIL (low) | See defects 1 and 2. Otherwise the layout is clean at 1440 with no overlap, and badges are not truncated. Focus is visible (amber 2px outline on header buttons and links, amber border on inputs and comboboxes). `19-*.png` |

## Defects

1. **Selected-value pills are truncated in the filter comboboxes (low).**
   - Steps: open `/?type=SPARE_PART,CONSUMABLE,RAW_MATERIAL,TOOL&status=ACTIVE,OBSOLETE,PENDING_REVIEW&plant=1000,1100,1200,2000,2100,3000,4000,4100` at 1024 or 1440 (`19-pills-1024.png`).
   - Expected: every selection is readable, or a "+N" count is shown.
   - Actual: the fixed-width control clips the later pills (e.g. "Consumab", "1100 ·") and drops the rest, so the user cannot see all the active selections without opening the dropdown.
2. **At 1024px the table is cut off with no scroll hint (low).**
   - Steps: open `/` at 1024×900 (`19-default-1024.png`).
   - Expected: either the whole table fits, or it is obvious that it scrolls.
   - Actual: Unit price, Qty and Last updated are clipped at the right edge. The table does scroll horizontally inside its container, but no scrollbar or fade indicates this. Descriptions are also cut to about 12 characters ("Bearing,…"), and Material # links are the only way in.
3. **Lowercase detail URLs are not normalised (cosmetic).**
   - Steps: open `/materials/mat-000042`.
   - Expected: the breadcrumb and badge show `MAT-000042`.
   - Actual: they show `mat-000042` (the data loads correctly).
4. **Out-of-range page uses the heading "Page not found" (cosmetic).**
   - Steps: open `/?page=99999`.
   - Expected: wording that is distinct from the 404 route.
   - Actual: the in-list notice says "Page not found", which could be confused with the 404 page (the body text and "Go to page 500" link make it clear).

## Re-verification (fixes for scenario 19)

Re-run with ego-browser at 1440×900 and 1024×900. Screenshots are `screenshots/19-fix-*.png`.

| Defect | Result | Notes |
|--------|--------|-------|
| 1. Filter pills | PASS | At 1440 and 1024 each filter shows its first value plus a `+N` pill (Type "Spare Part +3", Status "Active +2", Plant "1000 · Brisbane +7"). The `+N` pill's tooltip (native `title`) lists the rest, e.g. "Also selected: 1100 · Gladstone, 1200 · Mackay, …, 4100 · Kalgoorlie". The filter row stays one line at the same height (62px). The dropdown still shows all 8 plants selected. At 1024 the search box sits above the filter row, as before. `19-fix-pills-1440.png`, `19-fix-pills-1024.png`, `19-fix-tooltip.png`, `19-fix-dropdown.png` |
| 2. Table scroll affordance | PASS | At 1024 a visible horizontal scrollbar (990px wide, 12px tall) sits under the table. At 1440 there is no scrollbar, and the page height equals the viewport (900), so no page-level vertical scroll. No page-level horizontal scroll at either width. `19-fix-default-1024.png`, `19-fix-default-1440.png` |
| 3. Lowercase detail URL | PASS | `/materials/mat-000042` redirects to `/materials/MAT-000042`, and the breadcrumb and badge show upper-case `MAT-000042`. Back to the register returns to `/`. `19-fix-detail-redirect.png` |
| 4. Past-last-page wording | PASS | `/?page=99999` is titled "Past the last page" (body: "Page 99999 doesn't exist. These results only go up to page 500." with a "Go to page 500" link). `19-fix-past-last-page.png` |
| Full visual pass at 1440 and 1024 | PASS | No new overlap, clipping or contrast problems found. Description text is still ellipsised at 1024 (the table scrolls, so nothing is lost). |
