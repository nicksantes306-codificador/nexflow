# NEXFLOW · Plano Sprint 0 → Sprint 5

Founder solo, ~25h/semana · 6 semanas · orçamento de ferramentas ≈ R$0.
Meta de saída: SaaS auditável, com cobrança real e MRR ≥ R$3.000 (valuation R$50k).

| Sprint | Foco (Pilar)                     | Escopo principal                                                                                                                                              | Horas | Entregáveis                                                                                  |
| ------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------- |
| **0**  | Arquitetura (P1) — **ENTREGUE**  | Monorepo pnpm+Turbo · Next.js 15 + Tailwind 4 · Supabase SSR · schema multi-tenant com RLS · auth (login/signup/logout) · **módulo CRM Kanban migrado**       | ~25h  | Repo rodando `pnpm dev` em <10 min · `0001_init.sql` + `0002_rls.sql` + seed · README        |
| **1**  | Arquitetura (P1) — **ENTREGUE**  | Tipos TS (`@nexflow/db`, client tipado) · migrou Clientes 360° + Orçamentos + Financeiro · tela "Importar dados locais" (JSON do localStorage → tenant) · Vitest base | ~25h  | 4 telas no Next · importador · Vitest 7/7 · `vercel.json` · corrigiu mismatch ssr↔supabase-js |
| **2**  | Arquitetura + UX (P1/P3) — **ENTREGUE** | Migrou Projetos/Obras, Tarefas (toggle), Agenda · extraiu `@nexflow/core` (computeScore + nextBestAction + FlowEngine, usado no CRM) · Playwright e2e (scaffold + smoke) · CI com build + e2e | ~25h  | 12 rotas · Vitest 10/10 · e2e no CI · build verde                                             |
| **3**  | Cobrança (P2) — **SCAFFOLD env-gated** | Planos/preços · client Iugu (gated por `IUGU_API_TOKEN`) · checkout PIX → `invoices` · `billing-webhook` real (paid→active, falha→past_due+grace 7d) · entitlements (`accessLevel` no core) · página Planos + Faturas · banner de suspensão | ~25h  | Fluxo pronto; falta só colar chaves do sandbox Iugu p/ pagar de verdade        |
| **4**  | UX premium + GTM (P3/P4) — **ENTREGUE** | dark/light com persistência (sem flash) · página "Minha empresa" + BrasilAPI (CNPJ autofill) · PDF de orçamento com 3 templates (Minimal/Corporate/Premium) + selo Aprovado · landing `apps/marketing` (hero/pricing/FAQ/SEO) · tokens em `@nexflow/ui` | ~25h  | Landing servindo · 17 rotas no app · dark mode · PDF imprimível             |
| **5**  | GTM + compliance (P4) — **SCAFFOLD env-gated** | WhatsApp (Z-API) p/ cobrança · NFe.io no webhook · ClickSign (botão no orçamento) · LGPD (Política + Termos + cookie banner + DPO) · pitch deck (10 slides) · RUNBOOK completo · backup `pg_dump` diário (workflow) | ~25h  | LGPD pronto · integrações esperando chaves · deck + runbook · falta só 1ª venda real |

**Critério de "pronto para valuation R$50k":** 3 clientes pagantes PRO + MRR ≥ R$3.000
comprovado (Iugu) · due diligence em <2h · handover em 7 dias.

> **Gate após Sprint 0:** validar o fluxo auth + Kanban ponta-a-ponta com 1 usuário
> real antes de migrar o restante dos módulos (Sprint 1).
