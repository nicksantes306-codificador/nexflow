"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { auditar } from "@/lib/audit";

export type FormState = { error?: string; ok?: boolean };

export async function criarLancamento(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const descricao = String(formData.get("descricao") ?? "").trim();
  if (!descricao) return { error: "Informe a descrição do lançamento." };

  const tipo = String(formData.get("tipo") ?? "Entrada");
  if (tipo !== "Entrada" && tipo !== "Saída") {
    return { error: "Tipo inválido." };
  }

  const supabase = await createClient();
  const { data: tenant } = await supabase.rpc("current_tenant_id");
  if (!tenant) return { error: "Nenhum tenant ativo para este usuário." };

  const valor = Number(formData.get("valor") ?? 0);
  const status = normalizaStatus(formData.get("status"));

  const { error } = await supabase.from("finance_entries").insert({
    tenant_id: tenant,
    tipo,
    descricao,
    valor: Number.isFinite(valor) ? valor : 0,
    status,
    data: emptyToNull(formData.get("data")) ?? new Date().toISOString().slice(0, 10),
    categoria: emptyToNull(formData.get("categoria")),
  });

  if (error) return { error: error.message };
  await auditar({ acao: "Criou", entidade: "Lançamento", alvo: descricao });
  revalidatePath("/financeiro");
  return { ok: true };
}

export async function editarLancamento(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Lançamento inválido." };
  const descricao = String(formData.get("descricao") ?? "").trim();
  if (!descricao) return { error: "Informe a descrição do lançamento." };

  const tipo = String(formData.get("tipo") ?? "Entrada");
  if (tipo !== "Entrada" && tipo !== "Saída") return { error: "Tipo inválido." };

  const supabase = await createClient();
  const valor = Number(formData.get("valor") ?? 0);

  const { error } = await supabase
    .from("finance_entries")
    .update({
      tipo,
      descricao,
      valor: Number.isFinite(valor) ? valor : 0,
      status: normalizaStatus(formData.get("status")),
      data: emptyToNull(formData.get("data")) ?? new Date().toISOString().slice(0, 10),
      categoria: emptyToNull(formData.get("categoria")),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  await auditar({ acao: "Editou", entidade: "Lançamento", alvo: descricao });
  revalidatePath("/financeiro");
  return { ok: true };
}

const FIN_STATUS = ["Pendente", "Pago", "Recebido", "Atrasado", "Cancelado"] as const;
type FinStatus = (typeof FIN_STATUS)[number];

function normalizaStatus(v: FormDataEntryValue | null): FinStatus {
  const s = String(v ?? "");
  return (FIN_STATUS as readonly string[]).includes(s) ? (s as FinStatus) : "Pendente";
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}
