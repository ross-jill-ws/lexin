import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { env } from "./env";

serve({ fetch: createApp().fetch, port: env.PORT }, ({ port }) => {
  console.log(`Material Register API listening on http://localhost:${port}`);
});
