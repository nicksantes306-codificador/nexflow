"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean };

export async function criarProjeto(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { error: "Informe o nome da obra/projeto." };

  const supabase = await createClient();
  const { data: tenant } = await supabase.rpc("current_tenant_id");
  if (!tenant) return { error: "Nenhum tenant ativo para este usuário." };

  const valor = Number(formData.get("valor") ?? 0);
  const custo = Number(formData.get("custo_real") ?? 0);
  const progresso = Math.max(0, Math.min(100, Number(formData.get("progresso") ?? 0)));
  const clientId = String(formData.get("client_id") ?? "").trim();

  const { error } = await supabase.from("projects").insert({
    tenant_id: tenant,
    nome,
    client_id: clientId === "" ? null : clientId,
    status: String(formData.get("status") ?? "Em andamento"),
    valor: Number.isFinite(valor) ? valor : 0,
    custo_real: Number.isFinite(custo) ? custo : 0,
    progresso,
    responsavel: emptyToNull(formData.get("responsavel")),
    inicio: emptyToNull(formData.get("inicio")),
    fim: emptyToNull(formData.get("fim")),
  });

  if (error) return { error: error.message };
  revalidatePath("/projetos");
  return { ok: true };
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}
