"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { auditar } from "@/lib/audit";
import { dispararAutomacao } from "@/lib/automations/engine";

export type FormState = { error?: string; ok?: boolean };

function num(formData: FormData, k: string): number {
  const n = Number(formData.get(k) ?? 0);
  return Number.isFinite(n) ? n : 0;
}
function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

export async function criarProduto(_prev: FormState, formData: FormData): Promise<FormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { error: "Informe o nome do produto." };

  const supabase = await createClient();
  const { data: tenant } = await supabase.rpc("current_tenant_id");
  if (!tenant) return { error: "Nenhuma equipe ativa." };

  const quantidade = num(formData, "quantidade");
  const minimo = num(formData, "minimo");

  const { error } = await supabase.from("products").insert({
    tenant_id: tenant,
    nome,
    sku: emptyToNull(formData.get("sku")),
    categoria: emptyToNull(formData.get("categoria")),
    unidade: String(formData.get("unidade") ?? "un").trim() || "un",
    quantidade,
    minimo,
    custo: num(formData, "custo"),
    preco: num(formData, "preco"),
  });
  if (error) return { error: error.message };

  await auditar({ acao: "Criou", entidade: "Produto", alvo: nome });
  await dispararAutomacao(supabase, tenant, "product_created", null, { cliente: nome });
  if (minimo > 0 && quantidade <= minimo) {
    await dispararAutomacao(supabase, tenant, "product_low_stock", null, { cliente: nome });
  }
  revalidatePath("/estoque");
  return { ok: true };
}

export async function editarProduto(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Produto inválido." };
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { error: "Informe o nome do produto." };

  const supabase = await createClient();
  const quantidade = num(formData, "quantidade");
  const minimo = num(formData, "minimo");

  const { error } = await supabase
    .from("products")
    .update({
      nome,
      sku: emptyToNull(formData.get("sku")),
      categoria: emptyToNull(formData.get("categoria")),
      unidade: String(formData.get("unidade") ?? "un").trim() || "un",
      quantidade,
      minimo,
      custo: num(formData, "custo"),
      preco: num(formData, "preco"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  await auditar({ acao: "Editou", entidade: "Produto", alvo: nome });
  if (minimo > 0 && quantidade <= minimo) {
    const { data: tenant } = await supabase.rpc("current_tenant_id");
    if (tenant) await dispararAutomacao(supabase, tenant, "product_low_stock", null, { cliente: nome });
  }
  revalidatePath("/estoque");
  return { ok: true };
}
