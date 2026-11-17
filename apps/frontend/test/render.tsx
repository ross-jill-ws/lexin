import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { createQueryClient, Providers } from "../src/app/Providers";
import { routes } from "../src/app/routes";

/** Renders the real app routes at `url`, with a fresh query client configured as in production. */
export function renderAt(url = "/") {
  const queryClient = createQueryClient();
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  render(
    <Providers queryClient={queryClient} env="test">
      <RouterProvider router={router} />
    </Providers>,
  );
  return { router };
}
