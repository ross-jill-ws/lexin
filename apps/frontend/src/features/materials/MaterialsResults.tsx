import type { MaterialsQuery, MaterialsResponse } from "@material-register/shared";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { MaterialsTable } from "./MaterialsTable";
import { MaterialsTableSkeleton } from "./MaterialsTableSkeleton";
import { PageOutOfRange } from "./PageOutOfRange";
import { RefetchOverlay } from "./RefetchOverlay";
import type { useMaterials } from "./useMaterials";

type Sort = Pick<MaterialsQuery, "sort" | "order">;

type Props = {
  result: ReturnType<typeof useMaterials>;
  sort: Sort;
  onSortChange: (sort: Sort) => void;
  onGoToPage: (page: number) => void;
  /** Offered by the empty state when a search or filter is applied. */
  onClearAll?: () => void;
};

/**
 * True when the response is for a page past the last one. Judged on the response, not the URL,
 * so the previous page's placeholder data can't trip it.
 */
export const isPastLastPage = (data: MaterialsResponse) => data.page > Math.max(data.totalPages, 1);

/**
 * Whatever stands where the table goes: skeleton, error, empty state, page-out-of-range or rows.
 */
export function MaterialsResults({ result, sort, onSortChange, onGoToPage, onClearAll }: Props) {
  const { data, error, isFetching, isPlaceholderData } = result;
  const queryClient = useQueryClient();
  if (error) {
    // Retry every failed query (e.g. plants), not just materials: one outage usually fails both.
    const retryFailed = () =>
      void queryClient.refetchQueries({ predicate: (query) => query.state.status === "error" });
    return <ErrorState error={error} retrying={isFetching} onRetry={retryFailed} />;
  }
  if (data === undefined) return <MaterialsTableSkeleton />;

  let content: ReactNode;
  if (isPastLastPage(data)) {
    content = (
      <PageOutOfRange page={data.page} totalPages={data.totalPages} onGoToPage={onGoToPage} />
    );
  } else if (data.total === 0) {
    content = <EmptyState onClearAll={onClearAll} />;
  } else {
    content = <MaterialsTable materials={data.data} sort={sort} onSortChange={onSortChange} />;
  }
  return <RefetchOverlay visible={isPlaceholderData}>{content}</RefetchOverlay>;
}
