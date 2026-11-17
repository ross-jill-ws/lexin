import { Outlet } from "react-router";
import { AppFrame } from "./AppFrame";

export function AppLayout() {
  return (
    <AppFrame>
      <Outlet />
    </AppFrame>
  );
}
