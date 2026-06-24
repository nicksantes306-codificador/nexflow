"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@nexflow/db";

export type FormState = { error?: string; ok?: boolean };

function txt(fd: FormData, k: string): string | null {
  const s = String(fd.get(k) ?? "").trim();
  return s === "" ? null : s;
}

export async function salvarEmpresa(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { error: "Informe a razão social." };

  const supabase = await createClient();
  const { data: tenant } = await supabase.rpc("current_tenant_id");
  if (!tenant) return { error: "Nenhum tenant ativo." };

  const capitalRaw = txt(formData, "capital_social");
  const capital = capitalRaw != null && Number.isFinite(Number(capitalRaw)) ? Number(capitalRaw) : null;

  let dados: Json | null = null;
  const dadosRaw = txt(formData, "dados");
  if (dadosRaw) {
    try {
      dados = JSON.parse(dadosRaw) as Json;
    } catch {
      dados = null;
    }
  }

  const { error } = await supabase
    .from("tenants")
    .update({
      name: nome,
      cnpj: txt(formData, "cnpj"),
      nome_fantasia: txt(formData, "nome_fantasia"),
      situacao: txt(formData, "situacao"),
      abertura: txt(formData, "abertura"),
      cnae: txt(formData, "cnae"),
      natureza_juridica: txt(formData, "natureza_juridica"),
      porte: txt(formData, "porte"),
      capital_social: capital,
      endereco: txt(formData, "endereco"),
      telefone: txt(formData, "telefone"),
      email: txt(formData, "email"),
      ...(dados !== null ? { dados } : {}),
    })
    .eq("id", tenant);

  if (error) return { error: error.message };
  revalidatePath("/empresa");
  return { ok: true };
}
