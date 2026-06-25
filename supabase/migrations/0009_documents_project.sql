-- Permite anexar documentos também a uma obra (project), não só a um cliente.
alter table public.documents
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists documents_project_idx on public.documents(project_id);
