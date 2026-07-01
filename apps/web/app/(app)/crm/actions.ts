"use server";

import { revalidatePath } from "next/cache";
import { computeScore } from "@nexflow/core";
import { createClient } from "@/lib/supabase/server";
import { TODOS_STATUS, type StatusLead } from "@/lib/constants";
import { runAutomations, dispararAutomacao } from "@/lib/automations/engine";

// Move um lead de estágio (drag & drop do Kanban).
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

  // Dispara automações do gatilho "lead muda de estágio".
  const { data: lead } = await supabase
    .from("leads")
    .select("cliente, empresa, valor")
    .eq("id", leadId)
    .maybeSingle();
  const { data: tenant } = await supabase.rpc("current_tenant_id");
  if (tenant && lead) {
    const ctx = {
      cliente: lead.cliente,
      empresa: lead.empresa,
      valor: Number(lead.valor),
      status: novoStatus,
    };
    await runAutomations(supabase, tenant, "lead_stage", novoStatus, ctx);
    if (novoStatus === "Aprovado") await dispararAutomacao(supabase, tenant, "lead_won", null, ctx);
    if (novoStatus === "Perdido") await dispararAutomacao(supabase, tenant, "lead_lost", null, ctx);
  }

  revalidatePath("/crm");
  return { ok: true };
}

// Cria um lead novo (botão "+ Novo lead").
export async function createLead(formData: FormData) {
  const cliente = String(formData.get("cliente") ?? "").trim();
  const valor = Number(formData.get("valor") ?? 0);
  if (!cliente) return { error: "Informe o nome do cliente." };

  const supabase = await createClient();
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

  // Dispara automações do gatilho "lead criado".
  await runAutomations(supabase, tenant, "lead_created", null, {
    cliente,
    valor: valorOk,
    status: "Novo Lead",
  });

  revalidatePath("/crm");
  return { ok: true };
}
