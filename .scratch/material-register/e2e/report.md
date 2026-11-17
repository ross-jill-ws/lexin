# E2E acceptance report (ticket 09)

**Summary: 11 pass, 1 fail** (12 scenarios; 3 defects found: 1 medium, 2 low). Driven in a real browser via ego-browser against http://localhost:5180 with the 5,000-row seed. No source code was edited. Backend was stopped for scenario 12 and restarted (`localhost:3001/api/plants` responds).

| # | Scenario | Result | Notes |
|---|---|---|---|
| 1 | Initial load | PASS | 25 rows, "5,000 materials", Last updated ▼ (newest first, 1 Nov 2026 top), money as `$18.51`, dates `1 Nov 2026`, plant as `4000 · Perth`, status badges. `01-initial.png` |
| 2 | Search | PASS | `00123` → 11 (MAT-001230..39 + MAT-000123); `bearing` and `BEARING` both → 1,205 with identical rows; `6205` → 91 (MPNs 6205-2Z, 6205ZZ…). `02-search-bearing.png` |
| 3 | Debounce | PASS | Typing "hydraulic" at 60 ms/key produced exactly one `/api/materials` request (`q=hydraulic`). |
| 4 | Filters | PASS | Type=Consumable 996; +Tool 1,107; Status=Obsolete 732; Plant=Sydney 615; Sydney+Perth 1,295; with search `bearing` 314; +Status Active 229. URL and pills in sync. `03`, `04` |
| 5 | Clear one / Clear all | PASS | Pill clear removed only Status (309 left); Clear all reset to `/`, 5,000, search box emptied. `05`, `06` |
| 6 | Sorting | PASS | Material #, Description, Status, Unit price, Qty, Last updated all ordered correctly; ▲/▼ plus `aria-sort` correct. Text/number columns start asc, toggle asc↔desc; Last updated starts desc. `07` |
| 7 | Paging | PASS | Next/prev/specific/first/last (page 200 has 25 rows). Page size 10/50/100 → 500/100/50 pages. Changing filter, search, sort or page size resets to page 1. `08`, `09` |
| 8 | Refresh / shared URL | PASS | Deep URL (q, type, plant×2, sort, order, page 2, size 10) restored identically after reload and in a new tab (search box, pills, sort indicator, page, rows). `10` |
| 9 | Back / forward | PASS | 4 steps back and 4 forward each restore URL, search box, pills, page, count. `11` |
| 10 | Malformed params | PASS (with defects 2, 3) | `page=abc&pageSize=7&sort=nope&type=FOO`, `page=0`, `page=-3&pageSize=-1`, `order=sideways`, `pageSize=100000` all fall back to defaults. `page=99999` shows "Page not found … Go to page 200". No crashes. `12-*` |
| 11 | Empty state | PASS | `zzzzqqq` → "No materials match / Try a different search, or remove some filters." with Clear all, which restores the full list. `13` |
| 12 | Error state | FAIL | Backend stopped → "Couldn't load materials / Can't reach the server (HTTP 502). Check that it's running, then retry." + Retry; Retry while down keeps the error. After restart, Retry restored the table. **But the Plant filter stays empty** (defect 1). `14`, `15`, `16` |

## Defects

### 1. Plant filter options stay empty after recovering from a backend outage (medium)
- **Steps:** load the app; stop the backend; reload (error state); restart the backend; click Retry; open the Plant filter.
- **Expected:** the plant list is refetched on Retry and shows the 8 plants.
- **Actual:** the materials table recovers, but the Plant dropdown is empty (Type and Status fine) until a full page reload. Planners cannot filter by plant after a transient outage. Likely the failed `usePlants` query isn't retried/refetched by Retry (`staleTime: Infinity`, no retry on Retry). Screenshot `16-plant-empty-after-recovery.png`.

### 2. NUL byte in `q` returns HTTP 500 (low)
- **Steps:** `curl "localhost:3001/api/materials?q=%00abc"` or open `/?q=%00abc`.
- **Expected:** 400 `VALIDATION_ERROR` (or the character stripped).
- **Actual:** 500 `INTERNAL_ERROR`; UI shows "Couldn't load materials … Retry", and Retry can never succeed. Not reachable by typing, only via crafted URLs.

### 3. Over-long `q` or one invalid list value is silently dropped (low)
- **Steps:** open `/?q=` + 300 `x`, or `/?status=ACTIVE,BOGUS&plant=9999`.
- **Expected:** a clear message, or at least a consistent fallback.
- **Actual:** the 300-char `q` is ignored (search box empty, URL keeps it, 5,000 shown). In the second URL the whole `status` field is dropped because one value is invalid (the valid `ACTIVE` is lost), while the unknown plant `9999` is accepted and shown as a raw "9999" pill with 0 results. Field-by-field fallback is by design, so this is cosmetic.

### Observations (not defects)
- Month abbreviations are inconsistent: "Sept" vs "Oct"/"Nov"/"July" (looks like the en-AU locale output).
- Error text exposes "HTTP 502", which is technical for planners.
- Duplicate `type=` params: only the first is honoured.

## Re-verification

Re-run after fixes to defects 1 and 2 (dev servers hot-reloaded).

| Check | Result | Notes |
|---|---|---|
| Scenario 12 as in the brief (stop backend → error + Retry → restart → Retry) | PASS | Error shown with Retry while down ("Can't reach the server (HTTP 502)…"); after restart Retry restored the table (5,000 materials, 25 rows). |
| Defect 1: Plant filter after Retry | PASS (fixed) | Opened the Plant filter without reloading: all 8 plants listed (1000 Brisbane … 4100 Kalgoorlie). `screenshots/17-plant-after-recovery.png` |
| Defect 2: `/?q=%00abc` in the UI | PASS (fixed) | Page loads normally, 5,000 materials and 25 rows, no error state. |
| Defect 2: `curl "localhost:3001/api/materials?q=%00abc"` | PASS (fixed) | HTTP 400 `VALIDATION_ERROR`, "Search can't contain control characters." |

Backend is running again (`localhost:3001/api/plants` responds). Defect 3 (low, cosmetic) was not part of this re-check.
