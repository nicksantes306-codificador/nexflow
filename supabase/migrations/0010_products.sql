-- Módulo Estoque: produtos/materiais (cabos, disjuntores, painéis…) com
-- quantidade, mínimo, custo e preço. RLS por equipe.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nome text not null,
  sku text,
  categoria text,
  unidade text not null default 'un',
  quantidade numeric not null default 0,
  minimo numeric not null default 0,
  custo numeric not null default 0,
  preco numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "products tenant" on public.products;
create policy "products tenant" on public.products
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create index if not exists products_tenant_idx on public.products(tenant_id);
