-- ============================================================================
-- NEXFLOW · Migration 0005 — Automações (no-code: gatilho → ação)
-- ----------------------------------------------------------------------------
-- Regras por tenant: "quando GATILHO acontecer, execute AÇÃO".
-- O motor (apps/web/lib/automations) roda no servidor quando os eventos
-- disparam (ex.: lead criado / lead muda de estágio).
-- ============================================================================

create table if not exists public.automations (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  nome        text not null,
  gatilho     text not null,                 -- 'lead_created' | 'lead_stage'
  gatilho_valor text,                        -- ex.: estágio alvo do lead_stage
  acao        text not null,                 -- 'create_task' | 'create_finance' | 'create_event'
  acao_param  jsonb not null default '{}'::jsonb,
  ativo       boolean not null default true,
  exec_count  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists automations_tenant_idx on public.automations (tenant_id);

alter table public.automations enable row level security;

drop policy if exists automations_tenant on public.automations;
create policy automations_tenant on public.automations
  for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
