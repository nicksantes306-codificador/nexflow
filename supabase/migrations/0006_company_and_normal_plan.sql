-- ============================================================================
-- NEXFLOW · Migration 0006
--  (1) Conta nova nasce como conta NORMAL (PRO ativa), não mais DEMO.
--  (2) Campos completos da empresa (preenchidos pelo CNPJ via BrasilAPI).
-- ============================================================================

-- (2) Campos da empresa --------------------------------------------------------
alter table public.tenants
  add column if not exists nome_fantasia    text,
  add column if not exists situacao         text,
  add column if not exists abertura         date,
  add column if not exists cnae             text,
  add column if not exists natureza_juridica text,
  add column if not exists porte            text,
  add column if not exists capital_social   numeric,
  add column if not exists endereco         text,
  add column if not exists telefone         text,
  add column if not exists email            text,
  add column if not exists dados            jsonb;

-- (1) Cadastro cria conta normal ----------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_name   text := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email,'@',1));
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, v_name, new.email);

  insert into public.tenants (name, plan)
  values (coalesce(new.raw_user_meta_data ->> 'company', 'Minha Empresa'), 'PRO')
  returning id into v_tenant;

  insert into public.memberships (tenant_id, user_id, role)
  values (v_tenant, new.id, 'Admin');

  insert into public.subscriptions (tenant_id, plan, status)
  values (v_tenant, 'PRO', 'active');

  return new;
end;
$$;

-- mantém o hardening do 0003/0004 (a função de trigger não é chamável via API)
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Normaliza as contas já criadas (tira do DEMO).
update public.subscriptions set plan = 'PRO', status = 'active' where plan = 'DEMO';
update public.tenants set plan = 'PRO' where plan = 'DEMO';
