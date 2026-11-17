import { Alert, Button, List, Stack, Text } from "@mantine/core";
import type { MaterialsQuery } from "@material-register/shared";
import { ApiClientError, ApiRequestError } from "../../api/client";

/** The planner's name for each query parameter the API may reject. */
const fieldLabels: Record<keyof MaterialsQuery, string> = {
  q: "Search",
  type: "Type",
  status: "Status",
  plant: "Plant",
  sort: "Sort column",
  order: "Sort order",
  page: "Page",
  pageSize: "Rows per page",
};

const fieldLabel = (path: string) => fieldLabels[path as keyof MaterialsQuery] ?? path;

type Props = { error: Error; retrying: boolean; onRetry: () => void };

/** Shown in place of the table when the materials request fails. */
export function ErrorState({ error, retrying, onRetry }: Props) {
  const issues = error instanceof ApiRequestError ? (error.error.issues ?? []) : [];
  return (
    <Alert color="red" title="Couldn't load materials">
      <Stack align="flex-start" gap="sm">
        <Text size="sm">
          {error instanceof ApiClientError ? error.message : "Something unexpected went wrong."}
        </Text>
        {issues.length > 0 && (
          <List size="sm">
            {issues.map((issue) => (
              <List.Item
                key={`${issue.path}:${issue.message}`}
              >{`${fieldLabel(issue.path)}: ${issue.message}`}</List.Item>
            ))}
          </List>
        )}
        <Button variant="light" color="red" onClick={onRetry} loading={retrying}>
          Retry
        </Button>
      </Stack>
    </Alert>
  );
}
