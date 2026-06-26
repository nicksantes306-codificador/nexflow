"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { auditar } from "@/lib/audit";

export type FormState = { error?: string; ok?: boolean };

export async function criarOrcamento(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return { error: "Informe o título do orçamento." };

  const supabase = await createClient();
  const { data: tenant } = await supabase.rpc("current_tenant_id");
  if (!tenant) return { error: "Nenhum tenant ativo para este usuário." };

  // Numeração sequencial simples por tenant: ORC-0001…
  const { count } = await supabase
    .from("budgets")
    .select("*", { count: "exact", head: true });
  const numero = `ORC-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const valor = Number(formData.get("valor_total") ?? 0);
  const clientId = String(formData.get("client_id") ?? "").trim();

  const { error } = await supabase.from("budgets").insert({
    tenant_id: tenant,
    numero,
    titulo,
    client_id: clientId === "" ? null : clientId,
    valor_total: Number.isFinite(valor) ? valor : 0,
    status: "rascunho",
    validade: emptyToNull(formData.get("validade")),
  });

  if (error) return { error: error.message };
  await auditar({ acao: "Criou", entidade: "Orçamento", alvo: titulo });
  revalidatePath("/orcamentos");
  return { ok: true };
}

const ORC_STATUS = ["rascunho", "enviado", "aprovado", "recusado"] as const;

export async function editarOrcamento(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Orçamento inválido." };
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return { error: "Informe o título do orçamento." };

  const supabase = await createClient();
  const valor = Number(formData.get("valor_total") ?? 0);
  const clientId = String(formData.get("client_id") ?? "").trim();
  const status = String(formData.get("status") ?? "rascunho");

  const { error } = await supabase
    .from("budgets")
    .update({
      titulo,
      client_id: clientId === "" ? null : clientId,
      valor_total: Number.isFinite(valor) ? valor : 0,
      status: ((ORC_STATUS as readonly string[]).includes(status) ? status : "rascunho") as (typeof ORC_STATUS)[number],
      validade: emptyToNull(formData.get("validade")),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  await auditar({ acao: "Editou", entidade: "Orçamento", alvo: titulo });
  revalidatePath("/orcamentos");
  return { ok: true };
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}
