"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean };

export async function criarCliente(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { error: "Informe o nome do cliente." };

  const supabase = await createClient();
  const { data: tenant } = await supabase.rpc("current_tenant_id");
  if (!tenant) return { error: "Nenhum tenant ativo para este usuário." };

  const { error } = await supabase.from("clients").insert({
    tenant_id: tenant,
    nome,
    cnpj: emptyToNull(formData.get("cnpj")),
    segmento: emptyToNull(formData.get("segmento")),
    contato: emptyToNull(formData.get("contato")),
    telefone: emptyToNull(formData.get("telefone")),
    email: emptyToNull(formData.get("email")),
    endereco: emptyToNull(formData.get("endereco")),
  });

  if (error) return { error: error.message };
  revalidatePath("/clientes");
  return { ok: true };
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}
