import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/", "dist/", "**/*.test.ts", "**/*.benchmark.ts"],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
    testTimeout: 10000,
    benchmark: {
      outputFile: "./benchmarks/results.json",
    },
  },
  resolve: {
    alias: {
      // "@utils": resolve(__dirname, "./src/utils"),
    },
  },
});
