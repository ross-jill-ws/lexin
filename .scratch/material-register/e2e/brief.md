# E2E acceptance brief: ticket 09, re-run on 2026-11-18

You are an independent QA tester. Use the **ego-browser** skill (load it with the Skill tool first) to drive the running Material Register app in a real browser.

**Setup**
- App: http://localhost:5180. It is the Vite dev server, and it proxies `/api` to the Hono backend on http://localhost:3001.
- Database: a single one, `lexin`, freshly seeded with 5,000 materials (MAT-000001…MAT-005000), 8 plants and 25 manufacturers. There is no test database.
- Use a browser viewport of about **1440×900**.
- Background reading:
  - `.scratch/material-register/spec.md` (see the 2026-11-18 amendment at the top);
  - `.scratch/material-register/issues/09-e2e-acceptance.md`;
  - `.scratch/material-register/issues/10-redesign-detail-route-not-found.md`.
- What changed since the first run:
  - the UI was redesigned (the "stores ledger" look);
  - the default page size is **10**;
  - material numbers link to a **detail page** at `/materials/:materialNumber`;
  - unknown URLs show a styled **not-found page**.
- **Do NOT edit any source code.** Only test and report.

## Scenarios

Record PASS or FAIL for each scenario, with evidence.

**List view: same as the first run, against the new UI**

1. **Initial load.**
   - The table shows **10 rows**, "Showing 1–10 of 5,000" and the total count.
   - Rows are newest updated first.
   - All columns are formatted: AUD money, readable dates, the plant as "code · name", and status badges.
   - Without scrolling, the layout fits the window with **no page-level vertical scrollbar**.
2. **Search.** Try each kind of match:
   - a material number fragment, e.g. `00123`;
   - a description word, e.g. `bearing`, and `BEARING` to check case-insensitivity;
   - an MPN fragment, e.g. `6205`;
   - literal `%` and `_`, which must not act as wildcards.
3. **Debounce.** Type a word quickly while watching the network requests. There should be one `/api/materials` request per burst of typing, not one per keystroke.
4. **Filters.**
   - Use each filter on its own: Type, Status and Plant.
   - Pick several values within one filter.
   - Combine filters with a search.
   - The filter pills must not wrap or grow the toolbar badly.
5. **Clearing.** Clear a single filter, then use Clear all to reset the search and every filter.
6. **Sorting.**
   - Toggle ascending and descending on Material #, Unit price, Qty on hand and Last updated.
   - Check that the ↑/↓ indicator matches the order shown.
7. **Paging.**
   - Use next, previous and a specific page.
   - Change the page size to 25, 50 and 100.
   - Changing a filter or the search returns to page 1.
8. **Refresh and shared URL.** With filters, sort and page in the URL, reload. Then open the same URL in a new tab. Both must restore the same state.
9. **Back and forward.** The browser buttons step through the earlier view changes.
10. **Malformed URL params.** Open `?page=abc&pageSize=7&sort=nope&type=FOO`, then `?page=99999`. The app falls back to defaults or shows a clear message, and never crashes.
11. **Empty state.** Search `zzzzqqq`. Expect "No materials match" with Clear all.
12. **Error state.**
    - Stop the backend with `kill $(lsof -ti tcp:3001 -sTCP:LISTEN)`, then reload or trigger a fetch.
    - Expect a sensible error message and a Retry button.
    - Restart the backend in the background with `cd /Users/rossz/workspace/projects/interviews/lexin/apps/backend && nohup pnpm dev > /tmp/lexin-backend.log 2>&1 &`.
    - Wait until `curl -s localhost:3001/api/plants` responds, click Retry, and confirm the app recovers. The Plant filter options must load again too.
    - The backend must be running again before you finish.

**New since the first run**

13. **Detail page.**
    - From a filtered, sorted page 2 of the list, click a material number.
    - The URL becomes `/materials/MAT-…`.
    - The page shows every fact: number, description, type, status, manufacturer, MPN, plant, unit of measure, unit price, quantity on hand, last updated and stock value.
    - Check that stock value equals unit price × quantity, to the cent.
    - Cross-check a few values against `curl -s localhost:3001/api/materials/<number>`.
14. **Back to register.** "Back to register", and the browser back button, both return to exactly the list view you came from: the search, filters, sort and page.
15. **Detail by direct URL.**
    - Open `/materials/MAT-000042` in a new tab: it loads, and Back to register falls back to `/`.
    - The lowercase `/materials/mat-000042` works too.
16. **Unknown material.** `/materials/MAT-999999` shows a styled "Material not found" notice with a way back, not a raw error.
17. **Not-found page.** `/foo` and `/materials` show a styled "Page not found" notice with a way back to the register. React Router's raw error screen must never appear.
18. **Detail error state.**
    - With the backend stopped, opening a detail URL shows an error notice with Retry.
    - After you restart the backend, Retry recovers.
    - You can combine this with scenario 12.
19. **Visual and UX review.** Look critically at the redesign at 1440×900, and at a narrow width of about 1024. Report:
    - broken layout, overlap or clipping;
    - truncated badges;
    - unreadable contrast;
    - focus visibility when tabbing;
    - anything that looks unfinished.

## Output

- Save screenshots of the key states to `.scratch/material-register/e2e/screenshots/`, numbered by scenario, e.g. `01-initial.png`, `13-detail.png` and `17-not-found.png`. At least one screenshot per scenario, except 3 and 9.
- Write the report to `.scratch/material-register/e2e/report.md`. It has three parts:
  - a summary line;
  - a table of scenario | PASS/FAIL | notes;
  - a **Defects** section giving, for each defect, the steps to reproduce, expected vs actual, and severity (high, medium, low or cosmetic).
- When you are done, reply with just: `E2E DONE: <n> pass, <m> fail`.
