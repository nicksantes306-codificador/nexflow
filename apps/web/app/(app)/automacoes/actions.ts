"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@nexflow/db";

export type AutoState = { ok?: boolean; error?: string };

function s(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

export async function criarAutomacao(formData: FormData): Promise<AutoState> {
  const nome = s(formData, "nome");
  const gatilho = s(formData, "gatilho");
  const acao = s(formData, "acao");
  if (!nome || !gatilho || !acao) return { error: "Preencha nome, gatilho e ação." };

  // Monta os parâmetros da ação conforme o tipo escolhido.
  let param: Json = {};
  if (acao === "create_task") {
    param = { titulo: s(formData, "p_titulo") || "Follow-up: {cliente}", prioridade: s(formData, "p_prioridade") || "Média" };
  } else if (acao === "create_finance") {
    const usarValor = formData.get("p_auto") === "on";
    param = { descricao: s(formData, "p_descricao") || "Lançamento — {cliente}", tipo: s(formData, "p_tipo") || "Entrada", valor: usarValor ? "auto" : Number(s(formData, "p_valor") || 0) };
  } else if (acao === "create_event") {
    param = { titulo: s(formData, "p_titulo") || "Contato com {cliente}" };
  }

  const supabase = await createClient();
  const { data: tenant } = await supabase.rpc("current_tenant_id");
  if (!tenant) return { error: "Nenhum tenant ativo." };

  const gatilhoValor = gatilho === "lead_stage" ? s(formData, "gatilho_valor") || null : null;

  const { error } = await supabase.from("automations").insert({
    tenant_id: tenant,
    nome,
    gatilho,
    gatilho_valor: gatilhoValor,
    acao,
    acao_param: param,
  });
  if (error) return { error: error.message };

  revalidatePath("/automacoes");
  return { ok: true };
}

export async function toggleAutomacao(formData: FormData) {
  const id = s(formData, "id");
  const ativo = s(formData, "ativo") === "true";
  const supabase = await createClient();
  await supabase.from("automations").update({ ativo: !ativo }).eq("id", id);
  revalidatePath("/automacoes");
}

export async function excluirAutomacao(formData: FormData) {
  const id = s(formData, "id");
  const supabase = await createClient();
  await supabase.from("automations").delete().eq("id", id);
  revalidatePath("/automacoes");
}
