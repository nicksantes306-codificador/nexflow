"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean };

export async function salvarEmpresa(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { error: "Informe a razão social." };

  const supabase = await createClient();
  const { data: tenant } = await supabase.rpc("current_tenant_id");
  if (!tenant) return { error: "Nenhum tenant ativo." };

  const cnpj = String(formData.get("cnpj") ?? "").trim();
  const { error } = await supabase
    .from("tenants")
    .update({ name: nome, cnpj: cnpj === "" ? null : cnpj })
    .eq("id", tenant);

  if (error) return { error: error.message };
  revalidatePath("/empresa");
  return { ok: true };
}
