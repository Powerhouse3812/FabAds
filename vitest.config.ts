import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Render smoke tests (Industry Insights V2 pages/overlays build an
    // 800-ad universe) sit near the 5s default when the machine is busy with
    // parallel sessions; 15s keeps the gate about correctness, not load.
    testTimeout: 15000,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
