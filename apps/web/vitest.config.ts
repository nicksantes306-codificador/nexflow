import { defineConfig } from "vitest/config";

// Testes unitários de lógica pura (sem DOM/Next). e2e (Playwright) vem no Sprint 2.
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
