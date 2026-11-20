import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The app code imports through the "@" alias (see tsconfig paths); vitest
// needs the same mapping spelled out here.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
