# NEXFLOW

**CRM + ERP para empresas de engenharia elétrica e automação industrial.**
Gestão comercial (CRM/Kanban), orçamentos, obras, financeiro e engenharia —
multi-tenant, sobre Supabase + Next.js.

> Monorepo nascido da migração do `index.html` (single-file, 8.097 linhas) para
> uma arquitetura auditável. **Sprint 0 entregue:** auth + módulo CRM Kanban
> migrados como prova de conceito.

---

## Stack

| Camada       | Tecnologia                                            |
| ------------ | ----------------------------------------------------- |
| Frontend     | Next.js 15 (App Router) · React 19 · TypeScript       |
| Estilo       | Tailwind CSS v4 (design tokens em `@theme`)           |
| Backend/Auth | Supabase (Postgres + RLS + Auth + Edge Functions)     |
| Deploy       | Vercel (app) · Supabase (banco/funcs)                 |
| Monorepo     | pnpm workspaces + Turborepo                           |

## Estrutura

```
apps/web         → app autenticado (login + CRM Kanban) ← Sprint 0
apps/marketing   → landing page pública (Sprint 4)
packages/db      → schema + tipos TS gerados do Supabase
packages/ui      → design system / tokens (Sprint 3)
packages/core    → FlowEngine, LicenseManager, regras (Sprint 1–2)
supabase/        → migrations (RLS multi-tenant), seed, edge functions
docs/            → ARCHITECTURE · SPRINTS · API · DEPLOY · RUNBOOK
```

---

## Rodar localmente (alvo: < 10 min)

**Pré-requisitos:** Node ≥ 20, [pnpm](https://pnpm.io) (`corepack enable pnpm`)
e [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
# 1. Dependências
pnpm install

# 2. Banco local (Docker) + migrations + seed de demonstração
supabase start
supabase db reset            # aplica supabase/migrations/* e supabase/seed.sql

# 3. Variáveis de ambiente (use a URL/anon key que o `supabase start` imprimiu)
cp .env.example apps/web/.env.local
#   edite NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Subir o app
pnpm dev                     # http://localhost:3000
```

### Ver os dados de demonstração

1. Acesse `http://localhost:3000` → **Cadastre-se** (cria conta + tenant + membership automaticamente).
2. Para reaproveitar o tenant DEMO populado pelo seed, rode no SQL Editor
   (Supabase Studio, `http://localhost:54323`):
   ```sql
   select public.attach_me_to_demo();
   ```
3. Recarregue `/crm` — o Kanban mostra os 10 leads de exemplo. Arraste entre
   colunas: a mudança persiste via Server Action + RLS.

> **Sem Supabase CLI?** Aponte o `.env.local` para um projeto Supabase na nuvem
> e rode as migrations pelo SQL Editor (cole `0001_init.sql`, `0002_rls.sql`,
> `seed.sql` em ordem).

> ⚠️ **Moveu a pasta de lugar?** Os atalhos internos do pnpm são por caminho.
> Depois de mover/renomear a pasta do projeto, rode **`pnpm install`** de novo no
> novo local — isso reconstrói os links de `@nexflow/db`, `@nexflow/core` e
> `@nexflow/ui`. Sem isso, dá erro de "módulo não encontrado" ao subir.
> Dica: evite pastas com espaço no caminho (ex.: prefira `Desktop\nexflow`).

---

## Scripts

| Comando          | O que faz                                  |
| ---------------- | ------------------------------------------ |
| `pnpm dev`       | sobe todos os apps em watch (Turborepo)    |
| `pnpm build`     | build de produção                          |
| `pnpm lint`      | ESLint                                     |
| `pnpm typecheck` | `tsc --noEmit` em todo o monorepo          |
| `pnpm db:types`  | regenera os tipos TS do schema             |

## Documentação

- [`docs/SPRINTS.md`](docs/SPRINTS.md) — roadmap Sprint 0 → 5
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — visão de arquitetura e multi-tenancy
- [`docs/DEPLOY.md`](docs/DEPLOY.md) · [`docs/RUNBOOK.md`](docs/RUNBOOK.md) · [`docs/API.md`](docs/API.md)
