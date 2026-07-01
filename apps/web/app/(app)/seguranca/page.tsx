import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { SegurancaClient } from "./seguranca-client";
import { DangerZone } from "./danger-zone";

export const dynamic = "force-dynamic";

const ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
);

export default async function SegurancaPage() {
  const supabase = await createClient();
  const [{ data }, { data: { user } }] = await Promise.all([
    supabase.from("audit_log").select("alvo,created_at").eq("acao", "Entrou").order("created_at", { ascending: false }).limit(15),
    supabase.auth.getUser(),
  ]);
  const logins = (data ?? []) as { alvo: string | null; created_at: string }[];

  let isAdmin = false;
  if (user) {
    const { data: tenant } = await supabase.rpc("current_tenant_id");
    if (tenant) {
      const { data: membership } = await supabase
        .from("memberships")
        .select("role")
        .eq("tenant_id", tenant)
        .eq("user_id", user.id)
        .maybeSingle();
      isAdmin = membership?.role === "Admin";
    }
  }

  return (
    <div className="p-5 md:p-7">
      <PageHeader title="Segurança da conta" subtitle="Proteja o acesso com verificação em duas etapas (2FA)" icon={ICON} />
      <div className="max-w-2xl space-y-5">
        <SegurancaClient logins={logins} />
        <DangerZone isAdmin={isAdmin} />
      </div>
    </div>
  );
}
