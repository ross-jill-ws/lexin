# 10 — Redesign, material detail route and not-found page

**What to build:** A planner gets a register that looks deliberate rather than default, and it fits one screen: 10 rows by default, with no page scrollbar at a normal laptop size. Clicking a material number opens that material on its own page at `/materials/:materialNumber`. The page shows every fact plus the stock value, and "Back to register" returns to the exact list view the planner came from. An unknown URL, or a material number that doesn't exist, shows a styled notice with a way back instead of React Router's raw error screen. This read-only detail view is the single optional extra from the brief. It replaces "faster search", which was dropped along with the test database.

**Blocked by:** 07 — Loading, empty & error states; 08 — Docs

**Status:** done

- [x] Design system "stores ledger":
  - colours: graphite, safety amber and paper;
  - fonts: Big Shoulders Display, Archivo and IBM Plex Mono;
  - defined once as a Mantine theme (`amber` and `graphite` scales) plus `--mr-*` CSS variables;
  - the page, table, filters, pagination and states are all restyled with it.
- [x] Default page size is 10 (shared `DEFAULT_PAGE_SIZE`), and 10 rows plus the controls fit without a page scrollbar at about 1440×900.
- [x] Routes: a layout route with the masthead; `/` is the list; `/materials/:materialNumber` is the detail page; `*` is the not-found page; the root `errorElement` is a styled error notice.
- [x] `GET /api/materials/:materialNumber` matches case-insensitively and returns 404 `NOT_FOUND` "Material X not found." for an unknown number.
- [x] The detail page shows:
  - number, description, type, status, manufacturer, MPN, plant, UoM, unit price, quantity on hand, stock value and last updated;
  - stock value computed exactly, as BigInt cents.
- [x] "Back to register" restores the list's search, filters, sort and page (passed in router state), and falls back to `/` on a direct visit.
- [x] Detail states: a skeleton while loading, a not-found notice for a 404, and an error notice with Retry for other failures.
- [x] Frontend routing tests, `test/routing.test.tsx`, cover:
  - the not-found page;
  - the detail facts;
  - list → detail → back preserving the search;
  - the material 404;
  - Retry.
- [x] Typecheck, lint and tests are green; `curl` checks the detail 200 and 404 against the seeded DB.

## Comments

**2026-11-18. Implemented** in the main session with the frontend-design skill. Removed in the same change set:
- the "faster search" extra: `pg_trgm`, the trigram GIN indexes, `db:bench` and the README benchmark section, with the init migration regenerated;
- the test database: `lexin_test`, `docker/init-db.sql`, `TEST_DATABASE_URL`, and 11 DB-backed backend test files.

After this change, `pnpm test` runs 57 frontend tests and 8 backend (seed-generator) tests, with no database needed. Ticket 09's e2e pass was re-run against this UI.
