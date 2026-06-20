-- ============================================================================
-- NEXFLOW · Migration 0001 — Schema base + multi-tenancy
-- ----------------------------------------------------------------------------
-- Cada tabela de negócio carrega tenant_id (UUID). O isolamento real é feito
-- pelas RLS policies (ver 0002_rls.sql) que comparam tenant_id com a função
-- public.current_tenant_id().
-- ============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";      -- e-mail case-insensitive

-- ─────────────────────────────────────────────────────────────
-- TENANCY: tenants, profiles, memberships
-- ─────────────────────────────────────────────────────────────

create table public.tenants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  cnpj        text,
  plan        text not null default 'DEMO'
              check (plan in ('DEMO','STARTER','PRO','ENTERPRISE')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 1 profile por usuário do Supabase Auth
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       citext,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- vínculo usuário ⇄ tenant (com papel). Um usuário pode pertencer a N tenants.
create table public.memberships (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'Vendedor'
              check (role in ('Admin','Gerente','Vendedor','Tecnico','Visualizador')),
  created_at  timestamptz not null default now(),
  unique (tenant_id, user_id)
);
create index on public.memberships (user_id);
create index on public.memberships (tenant_id);

-- ─────────────────────────────────────────────────────────────
-- FUNÇÕES DE TENANCY (usadas pelas RLS)
-- ─────────────────────────────────────────────────────────────

-- Tenant ativo do usuário corrente.
-- Lê o claim 'tenant_id' do JWT (otimização futura via Access Token Hook) e,
-- na ausência dele, resolve pela primeira membership. SECURITY DEFINER para
-- não recursar nas policies de memberships.
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'tenant_id','')::uuid,
    (select m.tenant_id
       from public.memberships m
      where m.user_id = auth.uid()
      order by m.created_at
      limit 1)
  );
$$;

create or replace function public.is_member_of(p_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
     where m.user_id = auth.uid() and m.tenant_id = p_tenant
  );
$$;

create or replace function public.has_role(p_tenant uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
     where m.user_id = auth.uid()
       and m.tenant_id = p_tenant
       and m.role = any(p_roles)
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- BILLING: subscriptions + invoices (Iugu — Sprint 3)
-- ─────────────────────────────────────────────────────────────

create table public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references public.tenants(id) on delete cascade,
  plan                     text not null default 'DEMO'
                           check (plan in ('DEMO','STARTER','PRO','ENTERPRISE')),
  status                   text not null default 'trialing'
                           check (status in ('trialing','active','past_due','canceled','suspended')),
  gateway                  text not null default 'iugu',
  gateway_subscription_id  text,
  current_period_end       timestamptz,
  grace_until              timestamptz,            -- 7 dias de tolerância pós-falha
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index on public.subscriptions (tenant_id);
create unique index on public.subscriptions (gateway, gateway_subscription_id)
  where gateway_subscription_id is not null;

create table public.invoices (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  subscription_id     uuid references public.subscriptions(id) on delete set null,
  amount_cents        integer not null default 0,
  status              text not null default 'pending'
                      check (status in ('pending','paid','failed','refunded','canceled')),
  due_date            date,
  paid_at             timestamptz,
  gateway_invoice_id  text,
  pix_qr_code         text,                          -- copia-e-cola do PIX
  pix_expires_at      timestamptz,
  nfe_url             text,                          -- NF-e emitida (NFe.io — Sprint 4)
  created_at          timestamptz not null default now()
);
create index on public.invoices (tenant_id);

-- ─────────────────────────────────────────────────────────────
-- NEGÓCIO: leads, clients, contacts, services, budgets, projects,
--          finance, tasks, events, audit
-- Todas com tenant_id NOT NULL.
-- ─────────────────────────────────────────────────────────────

-- CRM / Kanban (módulo migrado no Sprint 0)
create table public.leads (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  cliente      text not null,
  empresa      text,
  valor        numeric(14,2) not null default 0,
  status       text not null default 'Novo Lead'
               check (status in ('Novo Lead','Em contato','Orçamento enviado','Negociação','Proposta','Aprovado','Perdido')),
  responsavel  text,
  ultimo       date default current_date,
  obs          text,
  score        integer not null default 0 check (score between 0 and 100),
  origem       text,
  telefone     text,
  email        citext,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on public.leads (tenant_id);
create index on public.leads (tenant_id, status);

create table public.clients (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  nome        text not null,
  cnpj        text,
  segmento    text,
  contato     text,
  telefone    text,
  email       citext,
  endereco    text,
  obs         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on public.clients (tenant_id);

create table public.contacts (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  client_id   uuid references public.clients(id) on delete set null,
  nome        text not null,
  cargo       text,
  telefone    text,
  email       citext,
  created_at  timestamptz not null default now()
);
create index on public.contacts (tenant_id);

-- Catálogo de serviços
create table public.services (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  nome        text not null,
  descricao   text,
  unidade     text default 'un',
  preco       numeric(14,2) not null default 0,
  created_at  timestamptz not null default now()
);
create index on public.services (tenant_id);

create table public.budgets (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  client_id     uuid references public.clients(id) on delete set null,
  numero        text,
  titulo        text not null,
  status        text not null default 'rascunho'
                check (status in ('rascunho','enviado','aprovado','recusado','expirado')),
  valor_total   numeric(14,2) not null default 0,
  validade      date,
  assinado_em   timestamptz,           -- ClickSign (Sprint 4)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on public.budgets (tenant_id);

create table public.budget_items (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  budget_id   uuid not null references public.budgets(id) on delete cascade,
  descricao   text not null,
  quantidade  numeric(14,2) not null default 1,
  preco_unit  numeric(14,2) not null default 0,
  ordem       integer not null default 0
);
create index on public.budget_items (budget_id);

create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  client_id    uuid references public.clients(id) on delete set null,
  nome         text not null,
  status       text not null default 'Em andamento',
  inicio       date,
  fim          date,
  progresso    integer not null default 0 check (progresso between 0 and 100),
  valor        numeric(14,2) not null default 0,
  custo_real   numeric(14,2) not null default 0,
  responsavel  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on public.projects (tenant_id);

create table public.project_tasks (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  project_id  uuid not null references public.projects(id) on delete cascade,
  titulo      text not null,
  done        boolean not null default false,
  ordem       integer not null default 0
);
create index on public.project_tasks (project_id);

create table public.finance_entries (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  tipo        text not null check (tipo in ('Entrada','Saída')),
  descricao   text not null,
  valor       numeric(14,2) not null default 0,
  status      text not null default 'Pendente'
              check (status in ('Pendente','Pago','Recebido','Atrasado','Cancelado')),
  data        date not null default current_date,
  categoria   text,
  cliente     text,
  created_at  timestamptz not null default now()
);
create index on public.finance_entries (tenant_id);

create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  titulo      text not null,
  cliente     text,
  prioridade  text default 'Média' check (prioridade in ('Baixa','Média','Alta')),
  prazo       date,
  done        boolean not null default false,
  tags        text[] default '{}',
  created_at  timestamptz not null default now()
);
create index on public.tasks (tenant_id);

create table public.events (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  titulo      text not null,
  data        date not null,
  hora        text,
  tipo        text,
  cliente     text,
  local       text,
  created_at  timestamptz not null default now()
);
create index on public.events (tenant_id);

create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  acao        text not null,
  entidade    text,
  alvo        text,
  detalhe     text,
  created_at  timestamptz not null default now()
);
create index on public.audit_log (tenant_id);

-- ─────────────────────────────────────────────────────────────
-- TRIGGERS: updated_at automático
-- ─────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'tenants','profiles','subscriptions','leads','clients',
    'budgets','projects'
  ]
  loop
    execute format(
      'create trigger trg_%1$s_updated before update on public.%1$s
       for each row execute function public.set_updated_at();', t);
  end loop;
end$$;

-- ─────────────────────────────────────────────────────────────
-- ONBOARDING: ao criar usuário no Auth, cria profile + tenant + membership
-- (conveniência Sprint 0 — no Sprint 1 o tenant nasce no wizard de onboarding)
-- ─────────────────────────────────────────────────────────────

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

  insert into public.tenants (name)
  values (coalesce(new.raw_user_meta_data ->> 'company', 'Minha Empresa'))
  returning id into v_tenant;

  insert into public.memberships (tenant_id, user_id, role)
  values (v_tenant, new.id, 'Admin');

  insert into public.subscriptions (tenant_id, plan, status)
  values (v_tenant, 'DEMO', 'trialing');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
