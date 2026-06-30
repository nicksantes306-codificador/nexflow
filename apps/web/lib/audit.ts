import { createClient } from "@/lib/supabase/server";

// Registro de auditoria (histórico de alterações). Best-effort: nunca lança
// erro nem quebra a ação principal. Chamado depois da operação dar certo.
export async function auditar(opts: {
  acao: "Criou" | "Editou" | "Excluiu" | "Restaurou" | "Convidou" | "Moveu" | "Entrou";
  entidade?: string;
  alvo?: string | null;
  detalhe?: string | null;
}) {
  try {
    const supabase = await createClient();
    const { data: tenant } = await supabase.rpc("current_tenant_id");
    if (!tenant) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("audit_log").insert({
      tenant_id: tenant,
      user_id: user?.id ?? null,
      acao: opts.acao,
      entidade: opts.entidade ?? null,
      alvo: opts.alvo ?? null,
      detalhe: opts.detalhe ?? null,
    });
  } catch {
    // silencioso de propósito — auditoria não pode atrapalhar a ação
  }
}
