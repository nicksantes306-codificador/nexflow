"use server";

import { revalidatePath } from "next/cache";
import { computeScore } from "@nexflow/core";
import { createClient } from "@/lib/supabase/server";
import { TODOS_STATUS, type StatusLead } from "@/lib/constants";

// Move um lead de estágio (drag & drop do Kanban).
// O RLS garante que só atualizamos leads do próprio tenant — não passamos
// tenant_id no client; o banco resolve por current_tenant_id().
export async function moveLead(leadId: string, novoStatus: string) {
  if (!TODOS_STATUS.includes(novoStatus as StatusLead)) {
    return { error: "Status inválido." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status: novoStatus, ultimo: new Date().toISOString().slice(0, 10) })
    .eq("id", leadId);

  if (error) return { error: error.message };
  revalidatePath("/crm");
  return { ok: true };
}

// Cria um lead novo (botão "+ Novo lead").
export async function createLead(formData: FormData) {
  const cliente = String(formData.get("cliente") ?? "").trim();
  const valor = Number(formData.get("valor") ?? 0);
  if (!cliente) return { error: "Informe o nome do cliente." };

  const supabase = await createClient();

  // tenant_id é obrigatório no insert; resolvemos pela membership ativa.
  const { data: tenant } = await supabase.rpc("current_tenant_id");
  if (!tenant) return { error: "Nenhum tenant ativo para este usuário." };

  const valorOk = Number.isFinite(valor) ? valor : 0;
  const { error } = await supabase.from("leads").insert({
    tenant_id: tenant,
    cliente,
    valor: valorOk,
    status: "Novo Lead",
    score: computeScore({ valor: valorOk, status: "Novo Lead" }),
    origem: String(formData.get("origem") ?? "Manual"),
  });

  if (error) return { error: error.message };
  revalidatePath("/crm");
  return { ok: true };
}
