# Material Register

## Agent skills

### Issue tracker

Issues and specs live as local markdown under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix) recorded as a `Status:` line. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/`. See `docs/agents/domain.md`.

## Commands

Run from the repo root; `package.json` lists every script.

- `pnpm db:setup` once (Docker Postgres on host port 5433, migrate, seed 5,000 rows), then `pnpm dev`.
- `pnpm test` needs Postgres up (`pnpm db:up`). Backend tests run against `lexin_test`, never `lexin`.
- One file: `pnpm --filter @material-register/backend exec vitest run test/<file>.test.ts` (same for `@material-register/frontend`).
- Before calling work done: `pnpm typecheck`, `pnpm test`, `pnpm lint`.
- `pnpm db:generate` after a schema change, then review the SQL in `apps/backend/drizzle/`.
- `pnpm db:bench` uses its own `lexin_bench` database (dropped and recreated each run).
- Commit only when the user says "commit".

## Architecture map

DB → API → FE, with `packages/shared` as the contract between them.

- `packages/shared/src/`: Zod schemas and types. `material.ts` composes `materialsQuerySchema` from the `searchQueryShape`, `filtersQueryShape`, `sortingQueryShape` and `paginationQueryShape` modules; `error.ts` is the error shape; `enums.ts` the enum tuples (also used for the pg enums).
- `apps/backend/src/`
  - `db/schema.ts` (Drizzle tables + indexes), `drizzle/` (migrations), `db/seed/` (catalogue + deterministic generator), `db/seed.ts`, `db/bench.ts`
  - `repositories/`: all SQL. `materials-repository.ts` turns a `MaterialsQuery` into one page (`whereCondition`, `sortColumns`) and finds one material by number (`findByNumber`).
  - `routes/`: thin handlers: `validate("query", schema)` → repository → `c.json`.
  - `validation.ts` (Zod failures → 400 `VALIDATION_ERROR`), `errors.ts` (404/500), `app.ts` (`createApp(db?)`), `env.ts`
- `apps/frontend/src/`
  - `api/client.ts`: fetch + shared-schema parsing; failures become typed `ApiClientError`s.
  - `lib/search-params.ts`: URL ↔ query object, field-by-field fallback to defaults.
  - `app/`: `routes.tsx` (`/`, `/materials/:materialNumber`, `*`, root `errorElement`), `AppLayout`/`AppFrame` (masthead), `theme.ts` + `tokens.css` (the design system: use its colours `graphite`/`amber` and the `--mr-*` variables, not ad-hoc values), `Providers.tsx`.
  - `features/material-detail/`: `MaterialDetailPage` (+ `useMaterial`, `MaterialFacts`). `features/not-found/`: `NotFoundPage`, `RouteErrorPage`, shared `Notice` and `BackToRegister`.
  - `features/materials/`: `MaterialsPage` composes `SearchInput`, `FilterBar` (→ `MultiSelectFilter`), `MaterialsResults` (skeleton / error / empty / out-of-range / `MaterialsTable`), `MaterialsPagination`, `PageSizePicker`. State in `useMaterialsUrlState`; data in `useMaterials` / `usePlants`.
- Tests: `apps/backend/test/` (HTTP seam, `createApp().request()`, fixtures in `fixtures.ts`, truncated before each test), `apps/frontend/test/` (`renderAt(url)` from `render.tsx`, MSW `server` from `server.ts`).

## Conventions

- **Shared Zod is the single source of truth.** A new query field, DTO field or enum value starts in `packages/shared`; the backend validates with it, the frontend parses the URL and responses with it. Types are `z.infer`, never hand-written twice.
- **TDD at the agreed seams** (use the `tdd` skill): the HTTP API via `app.request()` against the real test DB, and the Materials page via RTL + MSW. Red before green, one vertical slice at a time. Assert on responses and rendered UI, not SQL strings or component internals.
- **Thin routes over the repository.** Routes validate and delegate; SQL lives only in repositories.
- **Componentised frontend.** Small single-purpose components in `features/materials/`; the URL is the state, so view changes go through `useMaterialsUrlState` (non-page changes reset to page 1, defaults stay out of the URL).
- Error responses always use `errorResponse()` and the shared shape; user-facing messages are written for planners.

## Recipe: add a filter (manufacturer)

The schema already has `materials.manufacturer_id` with a btree index, and the list response already carries `manufacturer.name`. Each step is one red → green slice; the existing plant filter is the pattern to copy.

1. **Shared query field.** In `packages/shared/src/filters.ts` add `manufacturer: commaList(z.string().min(1).max(100, { error: "…" }))` to `filtersQueryShape`. Match by name (readable URLs, like plant codes). It flows into `materialsQuerySchema` automatically.
2. **Options endpoint (test first).** In `apps/backend/test/`, add a `manufacturers.test.ts` modelled on `plants.test.ts`. Then add `manufacturerSchema` / `manufacturersResponseSchema` in shared (copy `plant.ts`), `repositories/manufacturers-repository.ts` (ordered by name), `routes/manufacturers.ts`, and mount it at `/api/manufacturers` in `app.ts`.
3. **API filtering (test first).** In `apps/backend/test/materials-filters.test.ts` add cases: one manufacturer, several, combined with another filter and with search, totals, and a 400 for an invalid value. Then in `materials-repository.ts` add `manufacturer && inArray(manufacturers.name, manufacturer)` to `whereCondition`, and add `.innerJoin(manufacturers, …)` to the **count** query (it only joins plants today), or totals will error.
4. **Frontend data.** Add `listManufacturers` to `api/client.ts` and a `useManufacturers` hook mirroring `usePlants` (`staleTime: Infinity`). In `apps/frontend/test/server.ts`, serve an empty manufacturer list by default, like plants, so other tests have no unhandled requests.
5. **UI (test first).** In `apps/frontend/test/materials-filters.test.tsx` add cases: selecting updates the URL and request and resets to page 1, the URL restores the selection, individual clear, and Clear all clears it. Then add `"manufacturer"` to the `Filters` pick in `FilterBar.tsx` and render one more `MultiSelectFilter`. In `useMaterialsUrlState.ts` add `manufacturer: undefined` to `cleared` (this drives Clear all and `isNarrowed`), and add a `manufacturer: "Manufacturer"` label in `ErrorState.tsx`.
6. **Verify:** `pnpm typecheck`, `pnpm test`, `pnpm lint`, then try it in `pnpm dev`. No migration needed.
