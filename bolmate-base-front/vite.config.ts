import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    globals: true,
  },
  server: {
    port: 3000,
    host: true,
    watch: {
      usePolling: true,
      interval: 100
    },
    hmr: {
      host: 'localhost'
    }
  }
});
