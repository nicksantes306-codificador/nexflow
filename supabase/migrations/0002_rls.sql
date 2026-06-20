-- ============================================================================
-- NEXFLOW · Migration 0002 — Row Level Security (multi-tenant)
-- ----------------------------------------------------------------------------
-- Regra geral das tabelas de negócio:
--   USING / WITH CHECK  →  tenant_id = public.current_tenant_id()
-- Assim cada requisição só enxerga/escreve as linhas do seu próprio tenant,
-- mesmo compartilhando a mesma tabela física.
-- ============================================================================

-- ── Habilita RLS em TODAS as tabelas ────────────────────────────────────────
alter table public.tenants          enable row level security;
alter table public.profiles         enable row level security;
alter table public.memberships      enable row level security;
alter table public.subscriptions    enable row level security;
alter table public.invoices         enable row level security;
alter table public.leads            enable row level security;
alter table public.clients          enable row level security;
alter table public.contacts         enable row level security;
alter table public.services         enable row level security;
alter table public.budgets          enable row level security;
alter table public.budget_items     enable row level security;
alter table public.projects         enable row level security;
alter table public.project_tasks    enable row level security;
alter table public.finance_entries  enable row level security;
alter table public.tasks            enable row level security;
alter table public.events           enable row level security;
alter table public.audit_log        enable row level security;

-- ── tenants: membro lê o próprio; Admin/Gerente edita ───────────────────────
create policy tenants_select on public.tenants
  for select using (public.is_member_of(id));
create policy tenants_update on public.tenants
  for update using (public.has_role(id, array['Admin','Gerente']))
  with check (public.has_role(id, array['Admin','Gerente']));

-- ── profiles: cada um vê/edita o seu ────────────────────────────────────────
create policy profiles_select on public.profiles
  for select using (id = auth.uid());
create policy profiles_upsert on public.profiles
  for insert with check (id = auth.uid());
create policy profiles_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ── memberships: vê as próprias; baseadas em auth.uid() p/ evitar recursão ──
create policy memberships_select on public.memberships
  for select using (user_id = auth.uid());
create policy memberships_admin_write on public.memberships
  for all using (public.has_role(tenant_id, array['Admin']))
  with check (public.has_role(tenant_id, array['Admin']));

-- ── billing: somente leitura para membros (escrita = service role/webhook) ──
create policy subscriptions_select on public.subscriptions
  for select using (public.is_member_of(tenant_id));
create policy invoices_select on public.invoices
  for select using (public.is_member_of(tenant_id));

-- ============================================================================
-- TABELAS DE NEGÓCIO — policy uniforme via current_tenant_id()
-- (gerada em loop para garantir consistência em todas elas)
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'leads','clients','contacts','services','budgets','budget_items',
    'projects','project_tasks','finance_entries','tasks','events','audit_log'
  ]
  loop
    execute format(
      'create policy %1$s_tenant_isolation on public.%1$s
         for all
         using (tenant_id = public.current_tenant_id())
         with check (tenant_id = public.current_tenant_id());', t);
  end loop;
end$$;
