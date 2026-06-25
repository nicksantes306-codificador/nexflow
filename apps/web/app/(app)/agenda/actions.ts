"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean };

export async function criarEvento(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const data = String(formData.get("data") ?? "").trim();
  if (!titulo) return { error: "Informe o título do evento." };
  if (!data) return { error: "Informe a data do evento." };

  const supabase = await createClient();
  const { data: tenant } = await supabase.rpc("current_tenant_id");
  if (!tenant) return { error: "Nenhum tenant ativo para este usuário." };

  const { error } = await supabase.from("events").insert({
    tenant_id: tenant,
    titulo,
    data,
    hora: emptyToNull(formData.get("hora")),
    tipo: emptyToNull(formData.get("tipo")),
    cliente: emptyToNull(formData.get("cliente")),
    local: emptyToNull(formData.get("local")),
  });

  if (error) return { error: error.message };
  revalidatePath("/agenda");
  return { ok: true };
}

export async function editarEvento(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Evento inválido." };
  const titulo = String(formData.get("titulo") ?? "").trim();
  const data = String(formData.get("data") ?? "").trim();
  if (!titulo) return { error: "Informe o título do evento." };
  if (!data) return { error: "Informe a data do evento." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      titulo,
      data,
      hora: emptyToNull(formData.get("hora")),
      tipo: emptyToNull(formData.get("tipo")),
      cliente: emptyToNull(formData.get("cliente")),
      local: emptyToNull(formData.get("local")),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/agenda");
  return { ok: true };
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}
