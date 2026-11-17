# Material Register

A searchable, filterable, sortable, paginated register of industrial materials (spare parts, consumables, raw materials, tools) for maintenance planners. Postgres does the searching, filtering, sorting and paging. A validated REST API serves the results to a React table, and the whole view (search, filters, sort, page) lives in the URL, so a refresh or a shared link shows exactly the same view.

## Quickstart

Prerequisites: **Node 24** (developed on 24.15), **pnpm 11** (`corepack enable` picks up the pinned version) and **Docker** (for Postgres).

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env
pnpm db:setup   # starts Postgres on :5433, applies migrations, seeds 5,000 materials
pnpm dev        # API on http://localhost:3001, app on http://localhost:5173
```

Open http://localhost:5173. If port 5173 is busy, Vite picks the next free port and prints it.

To run the production build instead: `pnpm build && pnpm start`.

## Scripts

All scripts run from the repo root.

| Script | What it does |
| --- | --- |
| `pnpm dev` | Backend in watch mode (tsx) and frontend with HMR (Vite), in parallel |
| `pnpm build` | Builds every package in dependency order |
| `pnpm start` | Runs the built backend plus `vite preview` of the built SPA |
| `pnpm test` | Every package's Vitest suite. **Postgres must be up** (`pnpm db:up`) |
| `pnpm typecheck` | `tsc` in every package |
| `pnpm lint` / `pnpm format` | Biome check / Biome check with fixes |
| `pnpm db:up` | `docker compose up -d --wait` (Postgres 17 on host port 5433, creates `lexin` and `lexin_test`) |
| `pnpm db:generate` | Generates a Drizzle migration from schema changes |
| `pnpm db:migrate` | Applies migrations to `DATABASE_URL` |
| `pnpm db:seed` | Truncates and reloads the deterministic seed (`--count N`, `--database-url URL` optional) |
| `pnpm db:setup` | `db:up` → `db:migrate` → `db:seed`: a brand-new database ready to use |
| `pnpm db:bench` | Trigram index benchmark in a separate `lexin_bench` database (`--count`, `--runs` optional) |

## Architecture

```
Postgres 17 (pg_trgm)  →  Hono REST API (apps/backend)  →  React SPA (apps/frontend)
                 ▲                        ▲                         ▲
                 └──── Zod schemas, enums and types in packages/shared ────┘
```

A pnpm workspaces monorepo with three packages:

- **`packages/shared`**: the Zod schemas that define the contract: enums, the `GET /api/materials` query schema, the material DTO, the paginated response and the error shape. The API validates requests with them and the frontend parses both its URL and the API responses with the same schemas, so the contract can't drift. It ships TypeScript source; there is no build step.
- **`apps/backend`**: Hono on Node with Drizzle over postgres.js.
  - `src/env.ts` validates environment variables with Zod at startup and exits with a readable message if they're wrong.
  - `src/db/`: Drizzle schema, migrations runner, deterministic seed (`seed/` holds the curated catalogue and the Faker-based generator) and the benchmark.
  - `src/repositories/`: deep modules that turn a validated query into a result. **All SQL lives here.**
  - `src/routes/`: thin handlers: validate, call the repository, respond.
  - `src/app.ts`: assembles routes plus the JSON 404 and 500 handlers.
- **`apps/frontend`**: React 19, React Router 7 (SPA), Mantine, TanStack Query and headless TanStack Table.
  - `useMaterialsUrlState` parses the URL with the shared query schema (each bad value falls back to its own default) and exposes typed updaters. Any change other than the page resets to page 1.
  - `useMaterials` fetches with TanStack Query keyed on that state, keeping the previous page visible while the next loads.
  - Small components in `src/features/materials/`: `SearchInput` (300 ms debounce), `FilterBar` built from a reusable `MultiSelectFilter`, `MaterialsTable` and `columns.tsx`, `MaterialsPagination` and `PageSizePicker`, `StatusBadge`, and the loading, empty, error and out-of-range states.
  - Routes (`src/app/routes.tsx`): `/` the register, `/materials/:materialNumber` one material's record, `*` a styled not-found page; a root `errorElement` replaces React Router's developer error screen. Opening a material passes the list's search params in router state, so "Back to the register" restores the same view.
  - Design system: a Mantine theme (`src/app/theme.ts`) plus CSS tokens (`src/app/tokens.css`): graphite on warm paper with safety amber as the one accent, Big Shoulders Display for headings, Archivo for text and IBM Plex Mono for part codes. Ten rows per page by default so the register fits a laptop screen without scrolling.
  - In development Vite proxies `/api` to the backend, so the SPA uses relative paths and needs no CORS.

### Database

Three tables: `plants`, `manufacturers` and `materials`, with Postgres enums for material type, status and unit of measure. Indexes:

- GIN trigram indexes (`pg_trgm`) on material number, description and manufacturer part number, for `ILIKE '%term%'` search
- btree indexes on the foreign keys (plant, manufacturer) and the filter columns (type, status)
- composite `(column, id)` btree indexes for the common sorts (updated-at desc, unit price, quantity)

The seed is 5,000 materials from Faker with a fixed seed plus curated catalogues: real brands (SKF, Gates, Parker, Siemens, Loctite, Mobil…), plausible descriptions and realistic part numbers (e.g. `6205-2RS1`). It's identical on every run and safe to re-run.

## API

### `GET /api/materials`

| Param | Values | Default |
| --- | --- | --- |
| `q` | Search term, trimmed, 1–100 chars. Case-insensitive substring match on material number, description **or** MPN. `%`, `_` and `\` match literally | none |
| `type` | Comma-separated: `SPARE_PART`, `CONSUMABLE`, `RAW_MATERIAL`, `TOOL` | all |
| `status` | Comma-separated: `ACTIVE`, `OBSOLETE`, `PENDING_REVIEW` | all |
| `plant` | Comma-separated plant codes, e.g. `1000,1100` | all |
| `sort` | `materialNumber`, `description`, `materialType`, `status`, `plant`, `manufacturer`, `unitPrice`, `quantityOnHand`, `updatedAt` | `updatedAt` |
| `order` | `asc`, `desc` | `desc` |
| `page` | Positive integer | `1` |
| `pageSize` | `10`, `25`, `50`, `100` | `10` |

Filters are ANDed together. Values within one filter are ORed. Ordering always ends with `id`, so pages are stable. A page past the end returns `data: []` with the correct totals; it isn't an error.

`GET /api/materials/:materialNumber` returns one material in the same shape as a list row (case-insensitive number), or 404 `NOT_FOUND` with `Material MAT-999999 not found.`

Example: `GET /api/materials?q=6205` on the seeded database (first row shown):

```json
{
  "data": [
    {
      "id": 3593,
      "materialNumber": "MAT-003593",
      "description": "Bearing, deep groove ball, 25mm bore, shielded",
      "materialType": "SPARE_PART",
      "manufacturer": { "name": "FAG" },
      "manufacturerPartNumber": "6205-2Z",
      "plant": { "code": "2000", "name": "Sydney" },
      "status": "OBSOLETE",
      "unitOfMeasure": "EA",
      "unitPrice": "47.22",
      "quantityOnHand": 0,
      "updatedAt": "2026-10-20T19:31:58.552Z"
    }
  ],
  "page": 1,
  "pageSize": 10,
  "total": 91,
  "totalPages": 10
}
```

`unitPrice` is an exact decimal string (AUD). `updatedAt` is ISO 8601.

### `GET /api/plants`

Every plant as `{ id, code, name }`, ordered by code. The plant filter uses these options.

### Errors

Every error has the same shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request has invalid parameters.",
    "issues": [{ "path": "pageSize", "message": "Page size must be one of 10, 25, 50, 100." }]
  }
}
```

| Status | Code | When |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Any invalid query parameter. `issues` lists every bad field; list items include their index, e.g. `type.1` |
| 404 | `NOT_FOUND` | Unknown route, or no material with that number (JSON, never HTML) |
| 500 | `INTERNAL_ERROR` | Unexpected failure. A generic message; details are logged on the server, never returned |

## Decisions and trade-offs

- **The database does the work.** Search, filter, sort and paging all happen in SQL, so the browser only ever holds one page. This scales to real SAP-sized catalogues; a client-side table would not.
- **Shared Zod schemas as the single source of truth.** One definition gives request validation, response parsing, URL parsing and TypeScript types on both sides. The cost is a monorepo, which is small at this size.
- **The URL is the state.** Shareable, bookmarkable, and back/forward just work. Malformed params degrade field by field to defaults instead of crashing.
- **Trigram (`pg_trgm`) instead of full-text search.** Planners search fragments of codes (`000123`, `6205`), which `tsvector` word matching handles badly. Trigram indexes make `ILIKE '%term%'` index-assisted. Trade-off: no stemming or relevance ranking, and larger indexes.
- **Offset pagination.** Simple, and it supports "jump to page N", which the UI needs. Deep pages get slower (`OFFSET` scans skipped rows) and concurrent writes can shift rows between pages. That is acceptable for a read-mostly register of thousands of rows; keyset pagination is the next step if it grows.
- **Plants in the URL by code, not id**, so links are readable and survive re-seeding. A well-formed but unknown code returns no rows rather than a 400, to avoid a DB lookup during validation.
- **Prices as `numeric(12,2)` returned as strings**, so no floating-point rounding anywhere.
- **Enums sort alphabetically by label text** (`::text`), not by Postgres declaration order.
- **Tests at the highest seams, against a real database.** API tests go through `app.request()` against a real Postgres test DB, which catches real SQL behaviour (ILIKE escaping, enum casts, join counts) that mocks would hide. Page tests render the real page with React Testing Library and fake only the network (MSW). Trade-off: the backend suite needs Docker and runs its files serially.
- **Scope held back on purpose:** a manufacturer filter (the plumbing makes it a small change; see the recipe in `CLAUDE.md`), detail/edit views, auth, multi-column sort.

## Benchmark: trigram indexes

`pnpm db:bench` drops and recreates a separate `lexin_bench` database, migrates it, and seeds **200,000** materials with the same generator as `db:seed`. It then runs `VACUUM ANALYZE`, captures the exact SQL the API sends for each search (the page query plus the count query), and runs `EXPLAIN ANALYZE` on it five times. It does this first with the trigram indexes, then with them dropped inside a transaction that is rolled back. The app and test databases are never touched.

Measured on an Apple Silicon (arm64) Mac, Postgres 17 in Docker (median of 5 runs, page + count query):

| Search | Term | Matches | With trigram indexes | Without (seq scan) | Speed-up |
| --- | --- | ---: | ---: | ---: | ---: |
| Material number fragment | `1234` | 142 | 0.35 ms | 113.08 ms | 318.5x |
| Description word | `spherical` | 11,564 | 11.66 ms | 60.27 ms | 5.2x |
| MPN fragment | `6205` | 3,446 | 5.60 ms | 57.40 ms | 10.2x |

What the numbers show: the more selective the term, the bigger the win, because the index finds the few matching rows directly while a sequential scan always reads all 200k. Broad terms (11k matches) still gain about 5x. At the default 5,000 rows a sequential scan takes only a few milliseconds, so the planner may reasonably ignore the indexes; they pay off as the catalogue grows. The `VACUUM` step matters: right after a bulk insert the new GIN entries sit in a pending list, and the planner then costs index scans so high that it picks a sequential scan anyway.

## Testing

```bash
pnpm db:up   # the backend tests need Postgres
pnpm test    # backend + frontend
pnpm --filter @material-register/backend exec vitest run test/materials-search.test.ts   # one file
```

- **Backend** (`apps/backend/test`): HTTP-seam tests through `createApp().request()` against the real `lexin_test` database. It is migrated once per run and truncated before each test; small fixtures in `test/fixtures.ts`. Covers validation and errors, search, filters, sorting, pagination, plants, the seed and the benchmark.
- **Frontend** (`apps/frontend/test`): the Materials page rendered at a URL with React Testing Library; MSW fakes the API and fails on unhandled requests. Covers URL ↔ state, debounced search, filters and Clear all, sorting, paging, and the loading, empty and error states.
- Everything was written test-first (red → green), slice by slice.

## What's next

- **Keyset (cursor) pagination** for deep pages and stability under concurrent writes, keeping offset only for small "jump to page" ranges.
- **Manufacturer filter** in the UI (API and index already in place; recipe in `CLAUDE.md`).
- **Natural-language filters**: "active SKF bearings at Brisbane" → an LLM turns the sentence into the existing validated query object, so the shared schema stays the guardrail.
- **Editing a material** from its detail page.
- **CI**: lint, typecheck and both test suites against a Postgres service container on every PR, plus the browser e2e pass.
- Smaller items: total counts get expensive on large, unselective result sets (consider estimates beyond a threshold); a tsvector or similarity ranking if relevance ordering is wanted; SAP sync.

## How AI tools were used

> Draft written from the project record. Sections marked _TODO (author)_ are for my own notes.

This project was built with Claude Code following a deliberate, documented process. The artefacts are in `.scratch/material-register/` (`spec.md` and `issues/01`–`09`).

1. **Grilling.** Before any code, Claude interviewed me relentlessly about the brief (the `grilling` skill): scope, the stack, how search should behave (trigram vs full-text), offset vs keyset pagination, URL state, test seams, and the one optional extra (faster search, backed by a benchmark). The answers became decisions rather than assumptions.
2. **Spec.** The decisions were written up as `spec.md`: problem, 69 user stories, implementation decisions, testing decisions (which seams, and why) and what is out of scope.
3. **Tickets.** The spec was split into nine vertical-slice tickets with explicit "blocked by" dependencies and acceptance checklists. First a walking skeleton, then seed, pagination with URL state, sorting, search, filters, UI states, this benchmark and docs, and finally browser e2e.
4. **Workflow implementation, test-first.** A workflow implemented the tickets in blocking order, each by a fresh agent following strict TDD (red → green) at the agreed seams: the HTTP API against a real Postgres test database, and the Materials page via React Testing Library + MSW. Each agent ticked only the criteria it actually met and recorded deviations in the ticket's Comments (for example, the extra generator seam in ticket 02, and dependency version pins in ticket 01).
5. **Code review.** The implemented work is reviewed along two axes: the repo's standards, and fidelity to the spec and tickets. _TODO (author): note what the review found and what changed as a result._
6. **Browser e2e.** A Sonnet subagent drives the running app through the ego-browser skill (ticket 09): search, each filter, sorting, paging, URL restore, back/forward, empty and error states. Defects found there get regression tests at the right seam. _TODO (author): summarise the e2e findings once ticket 09 has run._

What worked well: _TODO (author): e.g. where the grilling changed your mind, how much the spec and tickets kept agents on track._

Where I stepped in or corrected the AI: _TODO (author): concrete examples of output you rejected, rewrote or simplified, and why._

What I verified myself: _TODO (author): what you read line by line, ran by hand or checked in the browser._

What I'd do differently: _TODO (author)._
