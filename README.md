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
| `pnpm db:up` | `docker compose up -d --wait` (Postgres 17 on host port 5433, creates the `lexin` database) |
| `pnpm db:generate` | Generates a Drizzle migration from schema changes |
| `pnpm db:migrate` | Applies migrations to `DATABASE_URL` |
| `pnpm db:seed` | Truncates and reloads the deterministic seed (`--count N`, `--database-url URL` optional) |
| `pnpm db:setup` | `db:up` → `db:migrate` → `db:seed`: a brand-new database ready to use |

## Architecture

```
Postgres 17  →  Hono REST API (apps/backend)  →  React SPA (apps/frontend)
                 ▲                        ▲                         ▲
                 └──── Zod schemas, enums and types in packages/shared ────┘
```

A pnpm workspaces monorepo with three packages:

- **`packages/shared`**: the Zod schemas that define the contract: enums, the `GET /api/materials` query schema, the material DTO, the paginated response and the error shape. The API validates requests with them and the frontend parses both its URL and the API responses with the same schemas, so the contract can't drift. It ships TypeScript source; there is no build step.
- **`apps/backend`**: Hono on Node with Drizzle over postgres.js.
  - `src/env.ts` validates environment variables with Zod at startup and exits with a readable message if they're wrong.
  - `src/db/`: Drizzle schema, migrations runner, deterministic seed (`seed/` holds the curated catalogue and the Faker-based generator).
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
- **Plain `ILIKE '%term%'` search, no search index.** Planners search fragments of codes (`000123`, `6205`), which `tsvector` word matching handles badly. At 5,000 rows a sequential scan takes a few milliseconds, so an index isn't worth its complexity yet. Of the brief's optional extras I picked one, the detail view, rather than faster search.
- **Offset pagination.** Simple, and it supports "jump to page N", which the UI needs. Deep pages get slower (`OFFSET` scans skipped rows) and concurrent writes can shift rows between pages. That is acceptable for a read-mostly register of thousands of rows; keyset pagination is the next step if it grows.
- **Plants in the URL by code, not id**, so links are readable and survive re-seeding. A well-formed but unknown code returns no rows rather than a 400, to avoid a DB lookup during validation.
- **Prices as `numeric(12,2)` returned as strings**, so no floating-point rounding anywhere.
- **Enums sort alphabetically by label text** (`::text`), not by Postgres declaration order.
- **One database, tests without it.** There is a single 5,000-row database. Tests run without Postgres: page tests render the real app with React Testing Library and fake only the network (MSW), and the seed generator has unit tests. Trade-off: the SQL itself (search escaping, filter joins, counts) is covered by the browser e2e pass rather than automated tests.
- **Scope held back on purpose:** a manufacturer filter (the plumbing makes it a small change; see the recipe in `CLAUDE.md`), editing materials, auth, multi-column sort.

## Testing

```bash
pnpm test    # backend + frontend, no database needed
pnpm --filter @material-register/frontend exec vitest run test/routing.test.tsx   # one file
```

- **Backend** (`apps/backend/test`): unit tests for the deterministic seed generator (numbering, status mix, stock skew, dates, catalogue coverage, repeatability).
- **Frontend** (`apps/frontend/test`): the Materials page rendered at a URL with React Testing Library; MSW fakes the API and fails on unhandled requests. Covers URL ↔ state, debounced search, filters and Clear all, sorting, paging, the loading, empty and error states, and routing (detail page, not-found page).
- Everything was written test-first (red → green), slice by slice.

## What I'd improve with more time

- **Natural-language filters:** turn "active SKF bearings at Brisbane" into the existing validated query object with an LLM, so the shared Zod schema stays the guardrail.
- **Faster search with `pg_trgm`:** trigram GIN indexes on material number, description and MPN, so `ILIKE '%term%'` stays fast as the catalogue grows.

## How AI tools were used

**Tools:** Claude Code (Opus 5.5), with these skills:

- **ego-lite browser skill** ([citrolabs/ego-lite](https://github.com/citrolabs/ego-lite)): a Sonnet subagent drove the running app in a real browser for end-to-end acceptance tests and screenshots.
- **Matt Pocock's skills** ([mattpocock/skills](https://github.com/mattpocock/skills)):
  - grilling the brief;
  - writing the spec and tickets (`.scratch/material-register/`);
  - test-first implementation.

**What worked:** grilling before coding turned assumptions into explicit decisions. The spec and tickets kept every agent on the same contract, and an independent browser tester caught bugs that the unit tests missed.

**What I had to correct:**

- **E2E failures.** The browser tests found two failures:
  - the Plant filter stayed empty after recovering from a backend outage;
  - after the redesign, filter pills were clipped and narrow screens gave no hint that the table scrolls.

  Neither was fixed automatically. Each took an extra prompt to fix test-first and re-verify in the browser.
- **UI refactoring.** The first UI was functional but generic, and it was routing-thin: a single `/` route, and React Router's raw error screen for unknown URLs. I directed a redesign:
  - a design system;
  - 10 rows per page, so the table fits the screen;
  - a material detail route (`/materials/:materialNumber`);
  - a styled not-found page.
