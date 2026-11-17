import { Button } from "@mantine/core";
import { Link } from "react-router";

type Props = {
  /** The list's query string to return to, e.g. "?q=hose"; the plain register by default. */
  search?: string;
  variant?: "filled" | "subtle";
};

export function BackToRegister({ search = "", variant = "filled" }: Props) {
  return (
    <Button
      component={Link}
      to={{ pathname: "/", search }}
      variant={variant}
      color={variant === "filled" ? "graphite.9" : "graphite.7"}
      leftSection={<span aria-hidden="true">←</span>}
      px={variant === "subtle" ? 0 : undefined}
    >
      Back to the register
    </Button>
  );
}
