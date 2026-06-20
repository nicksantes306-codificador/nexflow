import { defineConfig } from "@playwright/test";

// e2e do app. Sobe o dev server automaticamente (reusa se já estiver de pé).
// Os smoke tests atuais cobrem a área pública (login + guard de rota) e rodam
// sem banco. Fluxos autenticados (criar lead, PDF) entram quando o Supabase de
// teste estiver no CI (seed dedicado).
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
