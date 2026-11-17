# E2E acceptance brief (ticket 09)

You are an independent QA tester. Use the **ego-browser** skill (invoke it via the Skill tool first) to drive the running Material Register app in a real browser.

- App: http://localhost:5180 (Vite dev, proxies /api to the Hono backend on http://localhost:3001)
- The DB is freshly seeded with 5,000 materials, 8 plants and 25 manufacturers (MAT-000001…MAT-005000).
- Background: read `.scratch/material-register/spec.md` and `.scratch/material-register/issues/09-e2e-acceptance.md`.
- **Do NOT edit any source code.** Only test and report.

## Scenarios (record PASS/FAIL for each, with evidence)
1. Initial load: table renders 25 rows, total count, newest updated first, all columns formatted.
2. Search: by material number fragment (e.g. `00123`), description word (e.g. `bearing`, also `BEARING` to check case-insensitivity), and MPN fragment (e.g. `6205`).
3. Debounce: type a word quickly; watch network requests (ego-browser network/console or performance entries) to confirm there's one request per burst, not one per keystroke.
4. Each filter alone (Type, Status, Plant), multiple values within a filter, and filters combined with search.
5. Clear a single filter; Clear all resets search and filters.
6. Sorting: toggle asc/desc on several columns (material number, unit price, qty on hand, updated). Check the indicator and the order.
7. Paging: next/prev/specific page; change page size to 10/50/100; changing a filter or search resets to page 1.
8. Refresh the page with filters, sort and page in the URL; open the same URL in a new tab and confirm the state is restored.
9. Browser back/forward steps through the state changes.
10. Malformed URL params (e.g. `?page=abc&pageSize=7&sort=nope&type=FOO`) fall back to defaults or show a clear message, and never crash.
11. Empty state: search `zzzzqqq`, expect "No materials match" with Clear all.
12. Error state: stop the backend with `kill $(lsof -ti tcp:3001 -sTCP:LISTEN)` and reload or trigger a fetch. Expect a sensible error message and a Retry button. Then restart the backend in the background with `cd apps/backend && nohup pnpm dev > /tmp/lexin-backend.log 2>&1 &`, wait until `curl -s localhost:3001/api/plants` responds, click Retry and confirm recovery. Make sure the backend is running again before you finish.

## Output
- Save screenshots of the key states to `.scratch/material-register/e2e/screenshots/` (e.g. `01-initial.png`).
- Write the report to `.scratch/material-register/e2e/report.md`: a summary line, then a table of scenario | PASS/FAIL | notes, then a **Defects** section with steps to reproduce, expected vs actual, and severity for each.
- When done, reply with just: `E2E DONE: <n> pass, <m> fail`.
