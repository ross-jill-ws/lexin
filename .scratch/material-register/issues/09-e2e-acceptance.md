# 09 — Browser e2e acceptance pass

**What to build:** Independent confirmation that the finished Material Register works end to end in a real browser for a planner. A Sonnet subagent drives the running app (with the 5,000-row seed loaded) through the ego-browser skill and reports defects. Defects are then fixed.

**Blocked by:** 02 — Realistic seed; 04 — Sorting; 06 — Filters + Clear all; 07 — Loading, empty & error states; 08 — Trigram benchmark + docs

**Status:** done

- [x] Stack started from the README quickstart on a freshly set-up database
- [x] Subagent runs on the Sonnet model, launched in a new Herdr pane per the user's environment rules (HERDR_ENV=1), using the ego-browser skill
- [x] Scenarios checked: initial load; search by material number fragment, description word and MPN fragment (case-insensitive); debounce (no request per keystroke); each filter alone and combined with search; individual filter clear and Clear all; sort toggling on several columns; paging and page size; refresh and shared-URL restoration; back/forward; malformed URL params fall back to defaults; empty state; error state with backend stopped, then Retry after restart
- [x] Screenshots captured for key states
- [x] Findings written as a report (pass/fail per scenario, with defects) appended under this ticket's Comments
- [x] Defects fixed (with regression tests at the appropriate seam) and the failed scenarios re-verified

## Comments

**2026-11-17. E2E pass by a Sonnet agent (Herdr pane `e2e`, ego-browser) against `pnpm dev` on a freshly set-up DB (`pnpm db:setup`).** Full report: `.scratch/material-register/e2e/report.md`; screenshots in `.scratch/material-register/e2e/screenshots/`.

- First run: 11/12 scenarios passed. 3 defects found:
  1. (medium) Plant filter options stayed empty after Retry once an outage was over. **Fixed:** Retry now refetches every failed query. Regression test in `apps/frontend/test/materials-states.test.tsx`.
  2. (low) `q` with a NUL byte returned 500. **Fixed:** the shared search schema rejects control characters with a 400. Regression test in `apps/backend/test/materials-search.test.ts`.
  3. (low, cosmetic) Over-long `q` and lists with one invalid value fall back silently, field by field. Left as designed.
- Re-verification: scenario 12 and defects 1 and 2 now pass in the browser.
- Checks after fixes: typecheck, lint, and tests (backend 91, frontend 52) are all green.
- Not fixed, cosmetic: "Sept" month abbreviation (en-AU locale), the "HTTP 502" wording in the error text, and the Status badge truncated to "PENDING …" in narrow layouts.
