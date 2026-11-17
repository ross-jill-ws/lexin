import { Box, LoadingOverlay } from "@mantine/core";
import type { ReactNode } from "react";

type Props = { visible: boolean; children: ReactNode };

/** Dims the current content under a spinner while newer data loads, so nothing jumps. */
export function RefetchOverlay({ visible, children }: Props) {
  return (
    <Box pos="relative" aria-busy={visible}>
      <LoadingOverlay
        visible={visible}
        zIndex={1}
        overlayProps={{ backgroundOpacity: 0.4, blur: 1 }}
        loaderProps={{ role: "status", "aria-label": "Loading materials" }}
      />
      {children}
    </Box>
  );
}
