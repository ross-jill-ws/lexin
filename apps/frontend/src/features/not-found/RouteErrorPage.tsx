import { Button, Group, Text } from "@mantine/core";
import { isRouteErrorResponse, useRouteError } from "react-router";
import { AppFrame } from "../../app/AppFrame";
import { BackToRegister } from "./BackToRegister";
import { NotFoundPage } from "./NotFoundPage";
import { Notice } from "./Notice";

/** Replaces React Router's developer error screen when rendering a route throws. */
export function RouteErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <AppFrame>
        <NotFoundPage />
      </AppFrame>
    );
  }
  return (
    <AppFrame>
      <Notice code="!" eyebrow="Unexpected fault" title="Something went wrong">
        <Text c="graphite.6">
          The page hit an error it couldn't recover from. Reloading usually fixes it.
        </Text>
        <Group>
          <Button color="graphite.9" onClick={() => window.location.reload()}>
            Reload
          </Button>
          <BackToRegister variant="subtle" />
        </Group>
      </Notice>
    </AppFrame>
  );
}
