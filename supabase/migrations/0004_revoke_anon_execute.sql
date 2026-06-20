-- ============================================================================
-- NEXFLOW · Migration 0004 — Remove acesso de anon e tranca funções de trigger
-- ----------------------------------------------------------------------------
-- current_tenant_id/is_member_of/has_role permanecem chamáveis por
-- `authenticated` (o RLS depende disso) e só retornam dados do próprio usuário.
-- ============================================================================

revoke execute on function public.current_tenant_id() from anon;
revoke execute on function public.is_member_of(uuid) from anon;
revoke execute on function public.has_role(uuid, text[]) from anon;
revoke execute on function public.attach_me_to_demo() from anon;

-- Funções de trigger: ninguém chama via API.
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;
