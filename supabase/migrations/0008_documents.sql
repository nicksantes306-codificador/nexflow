-- Documentos anexados (ART, projeto, nota fiscal, fotos) por cliente.
-- Metadados em public.documents; arquivos no bucket privado 'documentos'.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  nome text not null,
  path text not null,
  mime text,
  tamanho bigint,
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;

drop policy if exists "documents tenant" on public.documents;
create policy "documents tenant" on public.documents
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create index if not exists documents_client_idx on public.documents(client_id);
create index if not exists documents_tenant_idx on public.documents(tenant_id);

-- Bucket privado
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

-- Storage RLS: cada equipe só acessa a própria pasta.
-- Convenção de caminho: {tenant_id}/{client_id}/{arquivo}
drop policy if exists "doc read tenant" on storage.objects;
create policy "doc read tenant" on storage.objects
  for select to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = public.current_tenant_id()::text);

drop policy if exists "doc insert tenant" on storage.objects;
create policy "doc insert tenant" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = public.current_tenant_id()::text);

drop policy if exists "doc delete tenant" on storage.objects;
create policy "doc delete tenant" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = public.current_tenant_id()::text);
