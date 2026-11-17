import type { RouteObject } from "react-router";
import { MaterialsPage } from "../features/materials/MaterialsPage";

export const routes: RouteObject[] = [{ path: "/", element: <MaterialsPage /> }];
