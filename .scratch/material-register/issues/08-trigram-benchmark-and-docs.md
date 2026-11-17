# 08 — Trigram benchmark + docs

**What to build:** A reviewer can run a benchmark that shows, with real numbers, how much the trigram indexes speed up search. They can then read a README that takes them from clone to a running app in a few commands and explains the architecture, trade-offs, next steps and how AI tools were used. CLAUDE.md gives agents the context to make changes, including a step-by-step recipe for adding a filter.

**Blocked by:** 02 — Realistic seed; 05 — Debounced search

**Status:** done

- [x] `db:bench` creates/uses a separate bench database, migrates it, generates about 200k rows with the ticket 02 generator, and runs EXPLAIN ANALYZE on representative searches (material number fragment, description word, MPN fragment) with the trigram indexes, then without them (dropped or disabled), printing a comparison
- [x] The benchmark leaves the main and test databases untouched
- [x] README: quickstart (install → copy env → db:setup → dev), prerequisites, all scripts, architecture overview DB → API → FE, API contract and error shape, decisions and trade-offs, measured benchmark results, how to run tests (DB must be up), what's next (keyset pagination, NL filters, detail view, CI), and an AI-usage section drafted from what actually happened, with clearly marked spots for the author's own notes
- [x] CLAUDE.md extended (keeping the existing Agent skills block): commands, architecture map, conventions (shared Zod as single source of truth, TDD, componentised frontend, thin routes over the repository), and a "how to add a filter" recipe walking through the manufacturer filter as the example
- [x] Quickstart verified on a fresh database

## Comments

**Implemented (ticket 08).**

- **Benchmark:** `apps/backend/src/db/bench.ts`, run with root `pnpm db:bench [--count N] [--runs N] [--database-url URL]`. By default it uses 200,000 rows, 5 runs and `lexin_bench`, derived from `DATABASE_URL`.
  - `runBenchmark({ databaseUrl, count, runs })` refuses the app and test databases, then drops and recreates the bench database, migrates it, and seeds it with ticket 02's `seedDatabase`. It then runs `VACUUM ANALYZE materials`.
  - Next it pushes each search through the **real materials repository** with a Drizzle logger attached, which captures the exact page and count SQL the API sends. It runs `EXPLAIN (ANALYZE, FORMAT JSON)` on those statements, first with the trigram indexes in place, then with them dropped on a reserved connection inside `BEGIN … ROLLBACK`.
  - It reports the median summed execution time, whether a `*_trgm_idx` was used, and a Markdown table (`formatReport`).
  - The three representative searches are `1234` (material number fragment), `spherical` (description word) and `6205` (MPN fragment).
- **Measured** at 200k rows, median of 5 runs: 0.35 vs 113.08 ms (318.5x), 11.66 vs 60.27 ms (5.2x) and 5.60 vs 57.40 ms (10.2x). The README has the table.
- **Tests:** `apps/backend/test/bench.test.ts` has 3 tests:
  - the benchmark refuses the app and test databases;
  - a 2k-row run returns all three searches with matches and timings, the without-index pass never uses a trigram index, and the test DB still serves exactly its fixture over the HTTP seam;
  - a 20k-row run uses the trigram indexes in every "with" pass, which proves each drop was rolled back.

  I mutation-checked them: swapping `ROLLBACK` for `COMMIT` fails 2 tests. Full suite: backend 88, frontend 50. Typecheck and lint are clean.
- **Untouched databases:** the `lexin` md5 over all material rows was identical before and after a real `pnpm db:bench`.
- **README.md:** quickstart, prerequisites, the scripts table, architecture DB → API → FE, the API contract (params, a real example response, the error shape and codes), decisions and trade-offs, the benchmark method and results, testing, what's next, and the AI-usage section. The AI-usage section is a draft built from the `.scratch` record (grilling → spec → tickets → test-first workflow → code review → Sonnet ego-browser e2e) with `_TODO (author)_` spots. The example response and error body are copied from the real API.
- **CLAUDE.md:** the Agent skills block is unchanged. I added Commands, an Architecture map, Conventions, and a 6-step "add a filter" recipe for manufacturer. Each step is a test-first slice naming the exact files, including the gotcha that the count query must also join `manufacturers`.
- **Quickstart verified on a fresh database:**
  1. I copied the repo without `node_modules`, `.env` or `dist` and ran `pnpm install`.
  2. I copied `.env.example`, pointing `DATABASE_URL` at a brand-new `lexin_quickstart` database.
  3. I ran `db:migrate` and `db:seed`, which gave 8/25/5000.
  4. I ran `pnpm dev`, and `/api/materials?q=6205` came back through the Vite proxy along with the SPA's HTML.

  Afterwards I stopped the servers and dropped the database.

**Deviations / notes**

- I added a third test seam, the benchmark's own `runBenchmark` interface, as ticket 02 did for the generator. The benchmark is a script that the HTTP and page seams can't reach. The test DB check still goes through the HTTP seam.
- The benchmark **drops and recreates** its database on every run instead of reusing it. This keeps results independent of earlier runs, and a run interrupted mid-drop can't leave a stale database without indexes. The tests use their own `lexin_bench_test` database, so they never clobber a real benchmark run.
- `VACUUM ANALYZE` is essential. Right after the bulk insert the GIN pending lists make the planner cost trigram scans so high that it picks a seq scan even for 12 matches in 20k rows. The README explains this.
- The quickstart check ran `db:migrate` + `db:seed` rather than `db:setup`, because a second compose project from the copied folder would clash on port 5433. `db:up` was checked separately against the running stack, where it waited until healthy. On this machine Vite fell back from 5173 to 5180 (5173 was taken), as noted in ticket 01. The README mentions the fallback.
- The README's code-review and e2e steps describe the workflow's later stages and carry TODOs, because ticket 09 hasn't run yet.

**2026-11-18. Superseded.** The brief allows at most one optional extra, so the user chose the detail view and dropped "faster search". The trigram indexes, `pg_trgm`, `db:bench` and its README section are gone, and the init migration was regenerated without them. Separately, to keep one 5,000-row database, the `lexin_test` database and every DB-backed backend test were removed. Backend tests are now the seed-generator unit tests only.
