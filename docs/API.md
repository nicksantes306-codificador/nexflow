# API & Edge Functions (esqueleto)

## Server Actions (apps/web)

| Action                  | Arquivo                          | O que faz                                  |
| ----------------------- | -------------------------------- | ------------------------------------------ |
| `login / signup / logout` | `app/login/actions.ts`         | Auth via Supabase (e-mail/senha)           |
| `moveLead(id, status)`  | `app/(app)/crm/actions.ts`       | Move lead no Kanban (RLS isola por tenant) |
| `createLead(form)`      | `app/(app)/crm/actions.ts`       | Cria lead no tenant ativo                  |

## Edge Functions (supabase/functions)

| Função            | Auth                         | Status            |
| ----------------- | ---------------------------- | ----------------- |
| `license`         | secret server-side           | em produção       |
| `billing-webhook` | `?token=IUGU_WEBHOOK_TOKEN`  | stub (Sprint 3)   |

A API REST pública documentada (para SAP/Totvs) entra no roadmap médio prazo.
