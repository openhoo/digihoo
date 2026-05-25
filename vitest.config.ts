import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/generated/**", "src/index.ts", "src/types.ts"],
      thresholds: {
        branches: 90,
        functions: 98,
        lines: 95,
        statements: 95,
      },
    },
  },
});
