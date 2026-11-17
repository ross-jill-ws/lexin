# 09 — Browser e2e acceptance pass

**What to build:** Independent confirmation that the finished Material Register works end to end in a real browser for a planner. A Sonnet subagent drives the running app (with the 5,000-row seed loaded) through the ego-browser skill and reports defects. Defects are then fixed.

**Blocked by:** 02 — Realistic seed; 04 — Sorting; 06 — Filters + Clear all; 07 — Loading, empty & error states; 08 — Docs; 10 — Redesign, detail route and not-found page

**Status:** done (re-run 2026-11-18 against the redesigned UI)

> **Amended 2026-11-18.** The UI was redesigned and gained a detail route and a not-found page (ticket 10). The default page size is now 10, and there is no test DB or faster-search extra. The e2e pass is re-run with the updated brief (`.scratch/material-register/e2e/brief.md`). The first run's report and screenshots were replaced by the re-run (they remain in git history, e.g. commit `f4d5fff`).

- [x] Stack started from the README quickstart on a freshly set-up database
- [x] Subagent runs on the Sonnet model, launched in a new Herdr pane per the user's environment rules (HERDR_ENV=1), using the ego-browser skill
- [x] Scenarios checked: initial load; search by material number fragment, description word and MPN fragment (case-insensitive); debounce (no request per keystroke); each filter alone and combined with search; individual filter clear and Clear all; sort toggling on several columns; paging and page size; refresh and shared-URL restoration; back/forward; malformed URL params fall back to defaults; empty state; error state with backend stopped, then Retry after restart
- [x] Screenshots captured for key states
- [x] Findings written as a report (pass/fail per scenario, with defects) appended under this ticket's Comments
- [x] Defects fixed (with regression tests at the appropriate seam) and the failed scenarios re-verified
- [x] Re-run (2026-11-18): every earlier scenario against the new UI, with 10 rows by default; plus the detail page (facts, stock value, shared URL, case-insensitive number), back to the register restoring the list view, an unknown material, the not-found page for `/foo`, and the layout fitting without a page scrollbar
- [x] Fresh screenshots of the redesigned UI, and defects from the re-run fixed or recorded

## Comments

**2026-11-17. E2E pass by a Sonnet agent (Herdr pane `e2e`, ego-browser) against `pnpm dev` on a freshly set-up DB (`pnpm db:setup`).** Full report: `.scratch/material-register/e2e/report.md`; screenshots in `.scratch/material-register/e2e/screenshots/`.

- First run: 11/12 scenarios passed. 3 defects found:
  1. (medium) Plant filter options stayed empty after Retry once an outage was over. **Fixed:** Retry now refetches every failed query. Regression test in `apps/frontend/test/materials-states.test.tsx`.
  2. (low) `q` with a NUL byte returned 500. **Fixed:** the shared search schema rejects control characters with a 400. The regression test was in `apps/backend/test/materials-search.test.ts` (removed with the test DB on 2026-11-18).
  3. (low, cosmetic) Over-long `q` and lists with one invalid value fall back silently, field by field. Left as designed.
- Re-verification: scenario 12 and defects 1 and 2 now pass in the browser.
- Checks after fixes: typecheck, lint, and tests (backend 91, frontend 52) are all green.
- Not fixed, cosmetic: "Sept" month abbreviation (en-AU locale), the "HTTP 502" wording in the error text, and the Status badge truncated to "PENDING …" in narrow layouts.

**2026-11-18. E2E re-run.** A Sonnet agent ran it in Herdr pane `e2e2` with ego-browser, against `pnpm dev` and the single seeded `lexin` DB, using the updated brief. The full report is `.scratch/material-register/e2e/report.md`; there are 44 screenshots in `.scratch/material-register/e2e/screenshots/`.

- **18 of 19 scenarios passed.** All 12 list scenarios passed again on the new UI: 10 rows fit 1440×900 with no page scrollbar, and Retry recovers both the list and the plant options. Every new scenario (13–18) passed too:
  - the detail facts and stock value, cross-checked with `curl`;
  - back to the register restoring `q`, `status`, `sort`, `order` and `page`;
  - direct and lowercase URLs;
  - an unknown material;
  - the not-found page for `/foo`, `/materials` and `/materials/X/extra`;
  - the detail error and Retry.
- **Scenario 19 (visual review) failed at first**, all low or cosmetic. All four are now fixed (see the next bullet):
  1. Filter pills are clipped when many values are selected; a "+N" count would help.
  2. At 1024px the table scrolls sideways with no visible hint.
  3. `/materials/mat-000042` shows the lowercase number in the badge and breadcrumb.
  4. The out-of-range list notice is headed "Page not found", the same wording as the 404 page.
- **Fixes for scenario 19, test-first, re-verified in the browser by the same agent: 5 checks pass, 0 fail.** Scenario 19 now passes, making the run 19/19.
  1. Each filter shows its first value as a pill and collapses the rest into a "+N" pill (Mantine `renderPill`). The pill's title lists the other selections. Test in `materials-filters.test.tsx`.
  2. The table's horizontal scrollbar is visible whenever the table overflows (`scrollAreaProps={{ type: "auto" }}`). This is visual only and was checked in the browser at 1024 and 1440.
  3. `/materials/mat-000042` redirects (replace) to `/materials/MAT-000042`. Test in `routing.test.tsx`.
  4. The out-of-range list notice is now titled "Past the last page". Test in `materials-pagination.test.tsx`.

  After the fixes, tests pass (frontend 59, backend 8), and lint and typecheck are clean. Screenshots: `e2e/screenshots/19-fix-*.png`.

