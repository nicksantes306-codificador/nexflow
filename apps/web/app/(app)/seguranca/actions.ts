"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { auditar } from "@/lib/audit";

export type LimparState = { ok?: boolean; error?: string };

const FRASE = "EXCLUIR TUDO";

// Tabelas de dados do dia a dia (todas com tenant_id → tenants ON DELETE CASCADE).
// NÃO inclui tenants/profiles/memberships/subscriptions/invoices — a conta e o
// plano continuam existindo, só os dados cadastrados são apagados.
const TABELAS = [
  "documents",
  "automation_runs",
  "automations",
  "invites",
  "events",
  "tasks",
  "finance_entries",
  "budgets",
  "projects",
  "contacts",
  "clients",
  "leads",
  "products",
  "services",
  "audit_log",
] as const;

// Apaga TODOS os dados da equipe (irreversível). Só um Admin pode confirmar,
// e só se digitar exatamente a frase de segurança.
export async function excluirTodosDados(_prev: LimparState, formData: FormData): Promise<LimparState> {
  const confirmacao = String(formData.get("confirmacao") ?? "").trim();
  if (confirmacao !== FRASE) return { error: `Digite exatamente "${FRASE}" para confirmar.` };

  const supabase = await createClient();
  const { data: tenant } = await supabase.rpc("current_tenant_id");
  if (!tenant) return { error: "Nenhuma equipe ativa." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão inválida." };

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("tenant_id", tenant)
    .eq("user_id", user.id)
    .maybeSingle();
  if (membership?.role !== "Admin") return { error: "Só um administrador pode apagar todos os dados." };

  // Remove os arquivos do Storage antes de apagar os registros de documentos.
  const { data: docs } = await supabase.from("documents").select("path").eq("tenant_id", tenant);
  const paths = (docs ?? []).map((d) => d.path).filter(Boolean);
  if (paths.length) {
    try {
      await supabase.storage.from("documentos").remove(paths);
    } catch {
      /* best-effort — não bloqueia a limpeza dos registros */
    }
  }

  for (const tabela of TABELAS) {
    const { error } = await supabase.from(tabela).delete().eq("tenant_id", tenant);
    if (error) return { error: `Falha ao limpar ${tabela}: ${error.message}` };
  }

  await auditar({ acao: "Excluiu", entidade: "Todos os dados", alvo: user.email ?? null });

  revalidatePath("/", "layout");
  return { ok: true };
}
