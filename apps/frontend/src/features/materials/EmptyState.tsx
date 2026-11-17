import { Button, Paper, Stack, Text, Title } from "@mantine/core";
import { useId } from "react";

type Props = {
  /** Clears the search and filters; omitted when nothing is narrowing the results. */
  onClearAll?: () => void;
};

/** Shown in place of the table when no material matches the current view. */
export function EmptyState({ onClearAll }: Props) {
  const titleId = useId();
  return (
    <Paper component="section" aria-labelledby={titleId} withBorder p="xl">
      <Stack align="center" gap="sm">
        <Title id={titleId} order={2} size="h4">
          No materials match
        </Title>
        <Text c="dimmed" size="sm">
          {onClearAll
            ? "Try a different search, or remove some filters."
            : "The register has no materials yet."}
        </Text>
        {onClearAll && (
          <Button variant="light" onClick={onClearAll}>
            Clear all
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
