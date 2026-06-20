"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
  revalidatePath("/orcamentos");
  return { ok: true };
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}
