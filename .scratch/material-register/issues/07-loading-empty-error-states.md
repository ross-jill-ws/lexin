# 07 — Loading, empty & error states

**What to build:** A planner always knows what the table is doing. A skeleton shows on first load. The current rows stay visible under a subtle overlay while the next page, sort or filter loads. A clear empty state offers Clear all. A clear error state shows the server's message with Retry, and filters and search stay usable throughout.

**Blocked by:** 06 — Filters + Clear all

**Status:** done

> **Amended 2026-11-18.** The backend error-shape tests were removed with the test database; the frontend state tests remain. The states were restyled in the redesign (ticket 10).

- [x] Skeleton table on first load (no data yet)
- [x] Previous data kept while refetching (TanStack Query keep-previous-data) with a subtle loading overlay; the table doesn't jump
- [x] Empty state component ("No materials match") with a Clear all action when there are no results
- [x] Error state component showing the API error message (validation messages in human-readable form) with a Retry action that refetches
- [x] The API client parses success bodies with the shared schemas and turns error bodies into typed errors
- [x] Search, filters and pagination stay visible and editable during loading and error states
- [x] Network failure (backend down) shows a sensible message rather than a crash
- [x] Page-seam tests cover skeleton, refetch overlay, empty state with Clear all, error state with message and Retry recovering after success. Written test-first

## Comments

**Implemented (test-first, page seam: RTL + MSW, `apps/frontend/test/materials-states.test.tsx`, 9 tests).**

- `MaterialsResults` now owns everything that stands where the table goes: error → `ErrorState`, no data yet → `MaterialsTableSkeleton` (real headers over 10 skeleton rows, `aria-label="Loading materials"`, `aria-busy`), page past the end → `PageOutOfRange`, `total === 0` → `EmptyState`, otherwise `MaterialsTable`. Non-error content is wrapped in `RefetchOverlay` (Mantine `LoadingOverlay`, light blur, `role="status"`) shown while `isPlaceholderData` is true, so previous rows stay put while the next page/sort/filter loads.
- `EmptyState`: "No materials match" section with a Clear all button when a search/filter is applied (falls back to "The register has no materials yet." when nothing is narrowing).
- `ErrorState`: red alert "Couldn't load materials" with the error's message, validation issues listed with planner-facing field names (e.g. "Rows per page: …", "Search: …"), and a Retry button that calls `refetch()` and shows a spinner while retrying.
- API client (`src/api/client.ts`): all failures are `ApiClientError` subclasses with display-safe messages — `ApiRequestError` (server's error shape, typed), `NetworkError` (fetch rejected, or a non-API error body such as a proxy 502/500 when the backend is down: "Can't reach the server (HTTP 502). Check that it's running, then retry."), and `UnexpectedResponseError` (success body failing the shared Zod schema). Success bodies are `safeParse`d with the shared schemas.
- Search, filters and page size are always rendered outside the results area, so they stay editable while loading and on error. Pagination stays visible during placeholder refetches, and on an error it keeps the last known page count (`useLastDefined`), so the planner can step back to a page that worked.
- Full suite: frontend 50 tests, backend 85 tests pass; typecheck and `pnpm lint` clean.

**Deviations:** none of substance. No browser e2e run (ticket 09).
