import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The SPA calls relative /api paths; in dev Vite forwards them to the backend (no CORS).
    proxy: { "/api": "http://localhost:3001" },
  },
  preview: {
    port: 5173,
    proxy: { "/api": "http://localhost:3001" },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
  },
});
