import "@mantine/core/styles.css";
import { MantineProvider, type MantineProviderProps } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

/**
 * The app's query client. Failed requests aren't retried: the error state and its Retry button
 * appear at once rather than after several seconds of backoff, and a 4xx would fail the same way
 * again anyway. Tests build their client here too, so they see this policy.
 */
export function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const defaultQueryClient = createQueryClient();

export function Providers({
  children,
  queryClient = defaultQueryClient,
  env,
}: {
  children: ReactNode;
  queryClient?: QueryClient;
  /** "test" turns off Mantine's transitions and portals for jsdom. */
  env?: MantineProviderProps["env"];
}) {
  return (
    <MantineProvider env={env}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MantineProvider>
  );
}
