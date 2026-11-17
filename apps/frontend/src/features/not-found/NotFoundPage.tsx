import { Text } from "@mantine/core";
import { useLocation } from "react-router";
import { BackToRegister } from "./BackToRegister";
import { Notice, noticeClasses } from "./Notice";

/** Any path the app doesn't know. */
export function NotFoundPage() {
  const { pathname } = useLocation();
  return (
    <Notice code="404" eyebrow="Bin location empty" title="Page not found">
      <Text c="graphite.6">
        Nothing is stocked at <span className={noticeClasses.path}>{pathname}</span>. It may have
        been moved, or the link is mistyped.
      </Text>
      <BackToRegister />
    </Notice>
  );
}
