import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["server/**/*.test.{js,ts}"],
    watch: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      all: true,
      include: ["server/**/*.js"],
      exclude: [
        "server/**/server.js",
        "**/node_modules/**",
        "**/dist/**"
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    }
  }
});
