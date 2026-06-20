# Arquitetura — NEXFLOW

## Visão geral

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  apps/web (Next.js 15)       │        │  Supabase                    │
│  · Server Components (RSC)   │  HTTPS │  · Postgres + RLS            │
│  · Server Actions (mutações) ├───────►│  · Auth (JWT)               │
│  · middleware (sessão+guard) │        │  · Edge Functions           │
└──────────────┬──────────────┘        │     - billing-webhook (Iugu)│
               │                        │     - license               │
        Vercel (deploy)                 └──────────────────────────────┘
```

O cliente nunca fala direto com o banco com privilégio: toda leitura/escrita
passa pela **anon key + RLS**. O `service_role` só existe server-side (seed,
webhooks, jobs) e **nunca** vai para o browser.

## Multi-tenancy (o coração do isolamento)

- Cada tabela de negócio tem `tenant_id uuid not null`.
- RLS em **todas** as tabelas: `USING/CHECK tenant_id = public.current_tenant_id()`.
- `current_tenant_id()` resolve o tenant do usuário:
  1. claim `tenant_id` do JWT (otimização via **Access Token Hook** — Sprint 1), ou
  2. fallback: primeira `membership` do `auth.uid()`.
- `handle_new_user()` (trigger em `auth.users`) cria **profile + tenant + membership
  Admin + subscription DEMO** no primeiro cadastro → onboarding sem fricção.

> **Assunção registrada (Sprint 0):** o claim `tenant_id` ainda não está no JWT
> (exige configurar o Access Token Hook no painel). Por isso `current_tenant_id()`
> usa o fallback por `memberships` — funciona out-of-the-box e fica pronto para a
> otimização por claim sem mudar nenhuma policy.

## Papéis

`memberships.role ∈ {Admin, Gerente, Vendedor, Tecnico, Visualizador}`.
Helpers SQL `is_member_of(tenant)` e `has_role(tenant, roles[])` para policies
mais finas (ex.: só Admin/Gerente edita o tenant). Granularidade por módulo
entra no Sprint 1.

## Cobrança (Sprint 3)

`subscriptions.status` vira a fonte de verdade da licença (substitui a chave
manual). Fluxo: pricing → checkout Iugu → `billing-webhook` → upsert em
`subscriptions`/`invoices` → `LicenseManager` libera/bloqueia. Falha de pagamento
→ `past_due` + `grace_until = now()+7d` → `suspended` (somente leitura) → bloqueio.

## Segurança

- Headers HSTS/X-Frame-Options/X-Content-Type-Options/Referrer-Policy/Permissions-Policy
  (Vercel `vercel.json` + `next.config.mjs`).
- Segredos (`LICENSE_SECRET`, `OWNER_TOKEN`, `IUGU_*`) só em Supabase Secrets / Vercel env.
- Sentry com `tracesSampleRate: 0.1` e remoção de PII (`beforeSend`).
