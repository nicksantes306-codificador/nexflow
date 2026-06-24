-- ============================================================================
-- NEXFLOW · Migration 0007 — Equipe (convites por e-mail)
-- ----------------------------------------------------------------------------
-- Admin convida a equipe por e-mail. Quando a pessoa se cadastra com aquele
-- e-mail, ela ENTRA NO TENANT do admin (em vez de criar empresa nova). Assim
-- toda a informação fica isolada por equipe (RLS por tenant_id).
-- Não precisa de service_role: o próprio convidado se cadastra.
-- ============================================================================

-- E-mail no membership (exibir a equipe sem ler profiles de terceiros).
alter table public.memberships add column if not exists email text;
update public.memberships m set email = p.email
  from public.profiles p where p.id = m.user_id and m.email is null;

-- Convites pendentes.
create table if not exists public.invites (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  email      text not null,
  role       text not null default 'Vendedor'
             check (role in ('Admin','Gerente','Vendedor','Tecnico','Visualizador')),
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists invites_tenant_idx on public.invites (tenant_id);
create index if not exists invites_email_idx on public.invites (lower(email));

alter table public.invites enable row level security;
drop policy if exists invites_tenant on public.invites;
create policy invites_tenant on public.invites
  for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- handle_new_user passa a honrar convites.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_invite public.invites%rowtype;
  v_name   text := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email,'@',1));
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, v_name, new.email);

  select * into v_invite
    from public.invites
   where lower(email) = lower(new.email) and used_at is null
   order by created_at desc
   limit 1;

  if v_invite.id is not null then
    -- entra na equipe que convidou
    insert into public.memberships (tenant_id, user_id, role, email)
    values (v_invite.tenant_id, new.id, v_invite.role, new.email);
    update public.invites set used_at = now() where id = v_invite.id;
  else
    -- conta nova (PRO ativa) com a própria empresa
    insert into public.tenants (name, plan)
    values (coalesce(new.raw_user_meta_data ->> 'company', 'Minha Empresa'), 'PRO')
    returning id into v_tenant;
    insert into public.memberships (tenant_id, user_id, role, email)
    values (v_tenant, new.id, 'Admin', new.email);
    insert into public.subscriptions (tenant_id, plan, status)
    values (v_tenant, 'PRO', 'active');
  end if;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
