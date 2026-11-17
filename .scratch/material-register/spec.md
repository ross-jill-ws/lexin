# Spec: Material Register

Status: ready-for-agent

> **Amended 2026-11-18.** The brief allows at most one optional extra. The chosen extra is now the **material detail view** (read-only), and "faster search" (trigram indexes + benchmark) was dropped. There is one database (`lexin`, 5,000 rows) and no test database, so backend tests are seed-generator unit tests only. The UI was redesigned ("stores ledger" design system), the default page size is 10, and unknown URLs get a styled not-found page. Sections below are updated to match.

## Problem Statement

Maintenance planners in industrial and maintenance teams work with large catalogues of materials (spare parts, consumables, raw materials and tools), often synced from SAP. When a job comes up, a planner needs to find the right part quickly, for example "all active bearings from SKF stocked at the Brisbane plant". Scrolling a flat export or spreadsheet with thousands of rows is slow, error-prone, and hard to share with a colleague ("look at this list").

## Solution

A **Material Register** web app. It shows material records in a clean table backed by a real Postgres database and a validated REST API. The planner can:

- type one search term that matches material number, description, or manufacturer part number;
- narrow results with filters for material type, status, and plant;
- sort by any visible column;
- page through results;
- open one material on its own page (`/materials/:materialNumber`) to see all its details.

The database does all of this work, not the browser. The current view (search, filters, sort, page) always lives in the URL, so refreshing or sharing the link reproduces exactly the same view. Loading, empty, and error states are clear and recoverable.

## User Stories

### Browsing

1. As a planner, I want to see materials in a table with material number, description, type, manufacturer, manufacturer part number, plant, status, unit of measure, unit price, quantity on hand and last updated, so that I can assess a part at a glance.
2. As a planner, I want each material's plant shown as code and name (e.g. "1000 · Brisbane"), so that I recognise plants the way SAP shows them.
3. As a planner, I want each material's manufacturer shown by name, so that I can recognise the brand.
4. As a planner, I want status shown as a coloured badge (Active, Obsolete, Pending Review), so that I can spot obsolete parts quickly.
5. As a planner, I want unit prices formatted as AUD currency, so that I can read costs correctly.
6. As a planner, I want quantity on hand shown as a number, so that I know whether stock is available.
7. As a planner, I want last-updated shown as a readable date, so that I can judge how fresh a record is.
8. As a planner, I want the table to default to the most recently updated materials first, so that recent changes are visible on arrival.
9. As a planner, I want the total number of matching materials displayed, so that I know how big my result set is.

### Search

10. As a planner, I want one search box that matches material number, description and manufacturer part number, so that I don't have to choose which field to search.
11. As a planner, I want search to be case-insensitive, so that "skf", "SKF" and "Skf" behave the same.
12. As a planner, I want search to match partial text anywhere in a field (e.g. "6205", "000123", "deep groove"), so that I can find parts from fragments.
13. As a planner, I want the app to wait until I pause typing before it searches, so that the server isn't hit on every keystroke and results don't flicker.
14. As a planner, I want leading and trailing whitespace ignored, so that a stray space doesn't change results.
15. As a planner, I want characters like `%` and `_` treated literally, so that typing them doesn't act as a wildcard and match everything.
16. As a planner, I want a clear (×) control in the search box, so that I can reset the search in one click.
17. As a planner, I want an overly long search term (over 100 characters) rejected with a clear message, so that I understand why nothing happened.

### Filtering

18. As a planner, I want to filter by material type (Spare Part, Consumable, Raw Material, Tool) and choose more than one, so that I can see e.g. spare parts and tools together.
19. As a planner, I want to filter by status (Active, Obsolete, Pending Review) and choose more than one, so that I can exclude obsolete parts.
20. As a planner, I want to filter by plant and choose more than one, so that I can look across e.g. Brisbane and Gladstone.
21. As a planner, I want plant filter options loaded from the database, so that new plants appear without a code change.
22. As a planner, I want different filters combined with AND and values within one filter combined with OR, so that results match intuitive expectations.
23. As a planner, I want search and filters to work together, so that I can answer "active SKF bearings at Brisbane".
24. As a planner, I want to clear an individual filter, so that I can relax one constraint without starting over.
25. As a planner, I want a "Clear all" control that resets search and every filter, so that I can start a fresh query quickly.
26. As a planner, I want "Clear all" visible only when something is applied, so that the UI stays uncluttered.

### Sorting

27. As a planner, I want to sort by clicking a column header, so that sorting feels familiar.
28. As a planner, I want to sort by material number, description, type, status, plant, manufacturer, unit price, quantity on hand and last updated, so that I can order results however suits the task.
29. As a planner, I want clicking the same header to toggle ascending and descending, so that I can reverse the order.
30. As a planner, I want a visible indicator on the sorted column showing its direction, so that I know how results are ordered.
31. As a planner, I want rows with equal sort values to keep a stable order between pages, so that no row is skipped or duplicated as I page.

### Pagination

32. As a planner, I want results paginated by the server, so that large catalogues stay fast.
33. As a planner, I want to choose a page size of 10, 25, 50 or 100, so that I can trade density for scrolling.
34. As a planner, I want to jump to any page and go to the next or previous page, so that I can navigate long result sets.
35. As a planner, I want to be returned to page 1 when I change search, filters, sort or page size, so that I don't land on an empty page.
36. As a planner, I want a helpful message and a way back if a URL points past the last page, so that stale links don't strand me.

### URL state and sharing

37. As a planner, I want search, filters, sort, page and page size reflected in the URL, so that I can bookmark a view.
38. As a planner, I want refreshing the page to restore exactly the same view, so that I don't lose my place.
39. As a planner, I want to send a colleague the URL and have them see the same results, so that we can collaborate on a parts list.
40. As a planner, I want the browser back and forward buttons to step through my previous views, so that navigation feels natural.
41. As a planner, I want a malformed or hand-edited URL (e.g. `page=abc`, an unknown status) to fall back to sensible defaults rather than crash, so that bad links still work.
42. As a planner, I want plants in the URL identified by plant code rather than internal id, so that links are readable and stable.

### Loading, empty and error states

43. As a planner, I want a skeleton table on first load, so that I know data is coming.
44. As a planner, I want the current rows to stay visible with a subtle loading indicator while the next page, sort or filter loads, so that the table doesn't jump.
45. As a planner, I want a clear empty state ("No materials match") with a "Clear all" action when nothing matches, so that I can recover quickly.
46. As a planner, I want a clear error state with the server's message and a "Retry" action when the API fails, so that I understand what happened and can try again.
47. As a planner, I want my filters and search to stay visible and editable during an error, so that I can adjust the query without reloading.
48. As a planner, I want validation errors from the API shown in human-readable language, so that I know what to fix.

### Material detail (the chosen optional extra)

48a. As a planner, I want to click a material number in the table and see that material on its own page, so that I can read every detail without squinting at a wide row.
48b. As a planner, I want the detail page to show the stock value (unit price × quantity on hand), so that I know what's sitting on the shelf.
48c. As a planner, I want the detail page to have its own URL, so that I can share one part with a colleague.
48d. As a planner, I want "Back to register" to return me to the exact list view I came from (search, filters, sort, page), so that I don't lose my place.
48e. As a planner, I want a clear message when a material number doesn't exist, so that a bad link doesn't strand me.
48f. As a planner, I want an unknown page (e.g. `/foo`) to show a styled not-found page with a way back, not a raw framework error.

### API consumer


49. As an API consumer, I want a single endpoint that lists materials with search, filter, sort and pagination parameters, so that any client can query the register.
50. As an API consumer, I want a paginated response with the data, page, page size, total and total pages, so that I can build pagination controls.
51a. As an API consumer, I want an endpoint that returns one material by number (case-insensitive) and a JSON 404 when it doesn't exist, so that detail views and links work.
51. As an API consumer, I want an endpoint listing plants, so that I can populate filter options.
52. As an API consumer, I want invalid query parameters rejected with HTTP 400 and a structured list of issues, so that I can see exactly which parameter is wrong.
53. As an API consumer, I want every error to use the same JSON shape (code, message, optional issues), so that error handling is uniform.
54. As an API consumer, I want unknown routes to return a JSON 404, so that I'm not given HTML.
55. As an API consumer, I want unexpected server errors to return a JSON 500 without leaking internals, so that the API is safe.
56. As an API consumer, I want prices returned as exact decimal strings, so that no floating-point rounding errors creep in.
57. As an API consumer, I want request and response types shared with the frontend, so that the contract can't drift.

### Developer / reviewer

58. As a reviewer, I want to start the whole stack in a few commands from the README, so that I can evaluate it quickly.
59. As a developer, I want one command that prepares a brand-new database (schema and seed), so that onboarding is trivial.
60. As a developer, I want the schema managed by versioned Drizzle migrations, so that database changes are reviewable and repeatable.
61. As a developer, I want a deterministic seed of 5,000 realistic industrial materials, so that search and pagination are meaningful and demos are repeatable.
62. As a developer, I want the seed to be re-runnable without duplicates, so that I can reset data at any time.
63. As a developer, I want one dev command that runs the backend (auto-restart) and frontend (HMR) together, so that iteration is fast.
64. As a developer, I want one build command that builds all packages in dependency order, so that production builds are reliable.
65. As a developer, I want a test command that needs no database, so that tests are quick and simple to run. (Amended 2026-11-18: previously a real Postgres test database.)
66. As a developer, I want environment variables validated at startup with a clear failure message, so that misconfiguration is obvious.
67. ~~As a reviewer, I want a benchmark that shows the measured effect of the trigram indexes on search.~~ Dropped 2026-11-18 with the "faster search" extra.
68. As a developer, I want a documented recipe for adding a new filter (e.g. manufacturer), so that small features can be added quickly and consistently.
69. As a reviewer, I want README notes on architecture, trade-offs, next steps and AI usage, so that I understand the decisions behind the code.

## Implementation Decisions

### Repository and packaging

- One git repository, laid out as a **pnpm workspaces monorepo** with three packages: a **backend** app, a **frontend** app, and a **shared** package.
- **Shared** holds the Zod schemas that are the single source of truth: enum values, the materials list query schema, the material DTO, the paginated response shape, and the API error shape. Both apps import types inferred from these schemas.
- Biome handles linting and formatting. Vitest is the test runner everywhere.

### Infrastructure

- Docker Compose runs Postgres 17 (alpine) on host port **5433**, with a healthcheck and a named volume. It holds one database, `lexin` (no test database).
- The backend validates environment variables with Zod at startup (database URL, port) and fails fast with a readable message. A committed example env file documents them.
- Ports: backend on 3001, frontend dev server on 5180 (5173 was taken on the dev machine). The frontend calls relative `/api` paths, and in development the Vite dev server proxies `/api` to the backend, so no CORS is needed in development.
- Postgres driver: postgres.js through Drizzle.

### Database schema (managed by Drizzle migrations)

- Three tables: **plants**, **manufacturers**, **materials**.
- Postgres enums:
  - material type: SPARE_PART, CONSUMABLE, RAW_MATERIAL, TOOL
  - material status: ACTIVE, OBSOLETE, PENDING_REVIEW
  - unit of measure: EA, BOX, KG, L, M, SET, PK
- **plants**: serial id, unique 4-character code (e.g. 1000), name (e.g. Brisbane). Seeded with about 8 Australian plants: Brisbane, Gladstone, Mackay, Sydney, Newcastle, Melbourne, Perth, Kalgoorlie.
- **manufacturers**: serial id, unique name. Seeded with about 25 real industrial brands (SKF, Timken, NSK, FAG, Gates, Parker, Bosch Rexroth, Siemens, ABB, Schneider, Festo, Loctite, 3M, Mobil, Shell, Atlas Copco, …).
- **materials**: serial id; unique material number (format MAT-000123); description; material type; manufacturer id (FK, restrict on delete); manufacturer part number; plant id (FK, restrict on delete); status (default ACTIVE); unit of measure; unit price numeric(12,2) in AUD; quantity on hand, a non-negative integer (check constraint); updated-at timestamptz (default now).
- Indexes:
  - btree on plant id and manufacturer id (Postgres doesn't index FKs automatically)
  - btree on material type and on status (filters)
  - composite btrees with id as a tiebreaker for sortable columns: updated-at descending, unit price, quantity on hand

### Seed

- Uses Faker with a **fixed seed**, combined with **curated domain catalogues**: category templates tied to plausible manufacturers, types, units of measure, price ranges, and realistic MPN formats. For example, "Bearing, deep groove ball, 25mm bore" from SKF with MPN 6205-2RS1, Gates V-belts, Parker hydraulic fittings, Loctite and Mobil consumables, steel plate raw materials.
- Weighted distributions: roughly 75% Active, 15% Obsolete, 10% Pending Review. Quantity skewed toward low values. Updated-at spread over the last three years.
- Generates **5,000** materials numbered sequentially, inserted in batches inside a single transaction.
- Idempotent: it truncates the tables and restarts identities before inserting.
- The seed CLI accepts `--count` and `--database-url`, so it can fill a larger dataset if ever needed.

### API (REST on Hono, validated with `@hono/zod-validator`)

- `GET /api/materials`, with query parameters:
  - `q`: optional search term, trimmed, 1 to 100 characters
  - `type`, `status`, `plant`: optional comma-separated multi-value lists. Type and status are enum values; plant uses plant **codes**.
  - `sort`: one of materialNumber, description, materialType, status, plant, manufacturer, unitPrice, quantityOnHand, updatedAt. Default updatedAt.
  - `order`: asc or desc. Default desc.
  - `page`: positive integer, default 1
  - `pageSize`: one of 10, 25, 50, 100, default 10 (changed from 25 on 2026-11-18 so a page fits the screen)
- Response: `{ data: MaterialDTO[], page, pageSize, total, totalPages }`. Each MaterialDTO includes nested plant (code, name) and manufacturer (name), with unit price as a decimal string and updated-at as an ISO string.
- `GET /api/materials/:materialNumber` returns one MaterialDTO; the number is matched case-insensitively. An unknown number returns 404 NOT_FOUND (`Material X not found.`).
- `GET /api/plants` returns all plants (id, code, name), ordered by code.
- Search semantics: case-insensitive substring match (ILIKE) OR'd across the three searchable fields, with no special index (a sequential scan is fast at 5,000 rows). The term's `%`, `_` and `\` are escaped before matching.
- Filter semantics: AND across filters, OR (IN) within a filter.
- Ordering always appends id as a tiebreaker so pages are deterministic.
- Pagination uses LIMIT/OFFSET with a total count. A page past the end returns empty data with the correct total and totalPages; it is not an error.
- Errors: one shape, `{ error: { code, message, issues? } }`. The validator hook maps Zod failures to 400 VALIDATION_ERROR with field-level issues. Unknown routes return 404 NOT_FOUND. A global error handler returns 500 INTERNAL_ERROR without exposing stack traces.
- Backend modules, kept separate:
  - env/config
  - database client and Drizzle schema
  - a **materials repository**, a deep module that turns a validated query object into one paginated result (all SQL building lives here)
  - route handlers, which stay thin: validate, call the repository, respond
  - app assembly (error handling, 404, CORS for non-dev)
  - the seed script

### Frontend (React Router v7 in SPA mode, Mantine, TanStack Table, TanStack Query)

- Routes (React Router data mode): a layout route with the masthead; `/` is the materials page; `/materials/:materialNumber` is the detail page; `*` is a styled not-found page; a root error element replaces the framework's raw error screen.
- Design system "stores ledger": graphite, safety amber and paper colours; Big Shoulders Display, Archivo and IBM Plex Mono fonts; defined once as a Mantine theme plus `--mr-*` CSS variables.
- **URL is the single source of truth** for table state. A URL-state hook parses search params with the shared query schema (falling back to defaults for invalid values) and exposes typed state plus updaters. Updaters reset the page to 1 on any change other than page, and drop default values from the URL to keep it short.
- The search input holds local text and pushes to the URL after a 300ms debounce.
- Data fetching uses TanStack Query keyed on the parsed state, with previous data kept while the next page loads. Plants are fetched once with an infinite stale time.
- TanStack Table is used headlessly for column definitions and **manual** sorting and pagination (the server does the work). Rows render with the Mantine Table.
- **Componentised, concise and clear**, with small single-purpose components:
  - search input
  - filter bar composed of a reusable multi-select filter
  - materials table
  - table pagination with page-size picker
  - status badge
  - empty state and error state
  - column definitions in their own module
  - a small API client that parses responses with the shared schemas and turns error bodies into typed errors
- States:
  - a skeleton on first load
  - an overlay while refetching
  - an empty state with Clear all
  - an error state with the server message and Retry, keeping the filters usable

### Scripts (root)

- `dev`: backend in watch mode and frontend with HMR, in parallel
- `build`: all packages in dependency order
- `start`: the built backend plus a preview of the built SPA
- `test`: all packages; needs no database
- `lint`: Biome
- `db:up`: compose up and wait for healthy
- `db:generate`: Drizzle migration generation
- `db:migrate`: apply migrations
- `db:seed`: load seed data
- `db:setup`: up, migrate, then seed a fresh database

### Documentation

- **README**: quickstart (install, copy env, db:setup, dev), an architecture overview (DB → API → FE), the API contract, decisions and trade-offs, testing instructions, next steps, and an AI-usage section with clearly marked spots for the author's own notes.
- **CLAUDE.md**: commands, an architecture map, conventions (shared Zod as the source of truth, TDD, componentised frontend), and a step-by-step "how to add a filter" recipe.

## Testing Decisions

- **What makes a good test:** it exercises externally observable behaviour through the highest available seam, not implementation details. Tests assert on HTTP responses and rendered UI, never on internal function calls, SQL strings, or component internals. Tests are written first (red → green → refactor) for each behaviour slice.
- **Seam 1: HTTP API — removed 2026-11-18.** It originally ran the Hono app in-process against a real Postgres test database (about 85 tests: validation, error shape, search escaping, filters, sorting, pagination, plants, detail). To keep one 5,000-row database, the test DB and these tests were removed. API/SQL changes are now checked with `curl` against the seeded `lexin` DB while `pnpm dev` runs, plus the browser e2e pass. Trade-off: no automated test exercises the SQL.
- **Seam 1b: seed generator (unit).** Pure-function tests of the deterministic generator (numbering, distributions, determinism, referential coverage, realistic MPNs). Needs no database.
- **Seam 2: the routed app (frontend).** The real routes are rendered at a given URL with React Testing Library, and MSW fakes the network. It covers:
  - URL → initial state, and state changes → URL updates
  - debounced search (one request after the pause)
  - multi-select filters and Clear all
  - resetting to page 1 on change
  - sort header toggling
  - loading, empty and error states, including Retry
  - malformed URL params falling back to defaults
  - routing: the detail page's facts, list → detail → back restoring the list view, a material 404, Retry, and the not-found page
- **Seam 3: browser end-to-end (acceptance, not TDD).** After everything is built, a Sonnet subagent drives the running app through the ego-browser skill. It checks the full stack: search, each filter, combined filters, sorting, paging, page size, refresh and shared-URL restoration, Clear all, the empty state, the error state (with the backend stopped), the detail route and back navigation, the not-found page, and the redesigned layout (10 rows fit without a page scrollbar). The subagent opens in a new Herdr pane, per the user's environment rules.
- **Prior art:** none. This is a greenfield repo, so these tests set the pattern for future work.

## Out of Scope

- A manufacturer filter in the UI. The schema, index and API plumbing make it easy to add, but it's deliberately held back as the live-coding exercise for the interview.
- Natural-language (LLM) filters.
- Editing a material from the detail view; any create, update or delete endpoints. (The read-only detail view is in scope since 2026-11-18.)
- Authentication, authorisation, and multi-tenant concerns.
- Keyset (cursor) pagination; offset pagination is adequate at this scale and noted as a future improvement.
- Multi-column sorting.
- Search indexes: trigram (`pg_trgm`) GIN indexes or full-text search. Plain ILIKE is fast enough at 5,000 rows; trigram is the noted next step if the catalogue grows.
- Deployment, CI pipelines, and production hosting.
- SAP synchronisation or import.

## Further Notes

- **Time budget** is about 3–4 hours, per the take-home brief. A focused, working core beats extras. The single optional extra chosen is the **material detail view** (read-only). Originally it was faster search (trigram indexes plus a 200k-row benchmark); that was dropped on 2026-11-18 because the brief allows at most one extra.
- **Git:** the repo is initialised, but nothing is committed or pushed until the user explicitly says "commit".
- **Interview demo:** the author must be able to explain every line. Favour simple, readable code over cleverness. The CLAUDE.md "add a filter" recipe supports the live-change portion of the interview.
- **Contract source:** the take-home brief, "3B take-home: The Pragmatist (AI-Native Full Stack Engineer)".
