import type { RouteObject } from "react-router";
import { MaterialDetailPage } from "../features/material-detail/MaterialDetailPage";
import { MaterialsPage } from "../features/materials/MaterialsPage";
import { NotFoundPage } from "../features/not-found/NotFoundPage";
import { RouteErrorPage } from "../features/not-found/RouteErrorPage";
import { AppLayout } from "./AppLayout";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <MaterialsPage /> },
      { path: "materials/:materialNumber", element: <MaterialDetailPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
