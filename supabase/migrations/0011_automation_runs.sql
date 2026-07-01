-- Log de execuções das automações (monitoramento: status, erro, histórico).
create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  automation_id uuid references public.automations(id) on delete set null,
  nome text not null,
  gatilho text not null,
  acao text not null,
  status text not null default 'ok' check (status in ('ok','erro')),
  detalhe text,
  created_at timestamptz not null default now()
);

alter table public.automation_runs enable row level security;

drop policy if exists "automation_runs tenant" on public.automation_runs;
create policy "automation_runs tenant" on public.automation_runs
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create index if not exists automation_runs_tenant_idx on public.automation_runs(tenant_id, created_at desc);
