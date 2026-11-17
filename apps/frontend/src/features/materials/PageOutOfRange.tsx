import { Alert, Button, Stack, Text } from "@mantine/core";

type Props = { page: number; totalPages: number; onGoToPage: (page: number) => void };

/** Shown when the URL names a page past the last one, e.g. a stale bookmark. */
export function PageOutOfRange({ page, totalPages, onGoToPage }: Props) {
  const lastPage = Math.max(totalPages, 1);
  return (
    <Alert color="yellow" title="Past the last page">
      <Stack align="flex-start" gap="sm">
        <Text size="sm">
          {`Page ${page} doesn't exist. `}
          {totalPages > 0
            ? `These results only go up to page ${totalPages}.`
            : "There are no results to page through."}
        </Text>
        <Button variant="light" onClick={() => onGoToPage(lastPage)}>
          {`Go to page ${lastPage}`}
        </Button>
      </Stack>
    </Alert>
  );
}
