-- ============================================================================
-- NEXFLOW · Migration 0003 — Hardening de funções (avisos do linter Supabase)
-- ============================================================================

-- search_path fixo na função de trigger.
alter function public.set_updated_at() set search_path = public;

-- Funções de trigger não devem ser chamáveis via API REST.
revoke execute on function public.set_updated_at() from public;
revoke execute on function public.handle_new_user() from public;

-- Helpers de RLS: somente usuários autenticados (anon não precisa).
revoke execute on function public.current_tenant_id() from public;
grant execute on function public.current_tenant_id() to authenticated;

revoke execute on function public.is_member_of(uuid) from public;
grant execute on function public.is_member_of(uuid) to authenticated;

revoke execute on function public.has_role(uuid, text[]) from public;
grant execute on function public.has_role(uuid, text[]) to authenticated;

-- Helper de demonstração: somente autenticado.
revoke execute on function public.attach_me_to_demo() from public;
grant execute on function public.attach_me_to_demo() to authenticated;
