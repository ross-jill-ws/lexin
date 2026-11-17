import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

/**
 * MSW server faking the network; each test registers its own handlers with server.use().
 * The filter bar always loads plants, so an empty plant list is served by default.
 */
export const server = setupServer(http.get("/api/plants", () => HttpResponse.json([])));
