-- Confiabilidade das automações: idempotência, contador atômico e modo teste.

-- 1) Deduplicação/idempotência: uma regra só executa 1x por chave de registro.
create table if not exists public.automation_dedup (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  automation_id uuid not null references public.automations(id) on delete cascade,
  chave text not null,
  created_at timestamptz not null default now(),
  unique (automation_id, chave)
);

alter table public.automation_dedup enable row level security;

drop policy if exists "automation_dedup tenant" on public.automation_dedup;
create policy "automation_dedup tenant" on public.automation_dedup
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- 2) Contador de execuções atômico (corrige lost update do read-modify-write).
create or replace function public.bump_automation_exec(aid uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.automations set exec_count = coalesce(exec_count, 0) + 1 where id = aid;
$$;

revoke execute on function public.bump_automation_exec(uuid) from public, anon;
grant execute on function public.bump_automation_exec(uuid) to authenticated;

-- 3) Modo teste (dry-run) por regra + status 'simulado' no log.
alter table public.automations add column if not exists dry_run boolean not null default false;

alter table public.automation_runs drop constraint if exists automation_runs_status_check;
alter table public.automation_runs add constraint automation_runs_status_check
  check (status in ('ok','erro','simulado'));
