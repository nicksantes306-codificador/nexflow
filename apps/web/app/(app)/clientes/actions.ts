"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { auditar } from "@/lib/audit";

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
  await auditar({ acao: "Criou", entidade: "Cliente", alvo: nome });
  revalidatePath("/clientes");
  return { ok: true };
}

export async function editarCliente(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Cliente inválido." };
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { error: "Informe o nome do cliente." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      nome,
      cnpj: emptyToNull(formData.get("cnpj")),
      segmento: emptyToNull(formData.get("segmento")),
      contato: emptyToNull(formData.get("contato")),
      telefone: emptyToNull(formData.get("telefone")),
      email: emptyToNull(formData.get("email")),
      endereco: emptyToNull(formData.get("endereco")),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  await auditar({ acao: "Editou", entidade: "Cliente", alvo: nome });
  revalidatePath("/clientes");
  return { ok: true };
}

/* ---------- documentos anexados ---------- */

export async function enviarDocumento(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const clientId = String(formData.get("client_id") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  const file = formData.get("arquivo");
  if (!(file instanceof File) || file.size === 0) return { error: "Escolha um arquivo." };
  if (file.size > 10 * 1024 * 1024) return { error: "Arquivo muito grande (máximo 10 MB)." };

  const supabase = await createClient();
  const { data: tenant } = await supabase.rpc("current_tenant_id");
  if (!tenant) return { error: "Nenhuma equipe ativa." };

  const safe = file.name.normalize("NFKD").replace(/[^\w.\-]+/g, "_").slice(-120) || "arquivo";
  const path = `${tenant}/${projectId || clientId || "geral"}/${crypto.randomUUID()}_${safe}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const up = await supabase.storage.from("documentos").upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (up.error) return { error: up.error.message };

  const { error } = await supabase.from("documents").insert({
    tenant_id: tenant,
    client_id: clientId || null,
    project_id: projectId || null,
    nome: file.name,
    path,
    mime: file.type || null,
    tamanho: file.size,
  });
  if (error) {
    await supabase.storage.from("documentos").remove([path]); // desfaz o upload
    return { error: error.message };
  }

  if (projectId) revalidatePath(`/projetos/${projectId}`);
  else if (clientId) revalidatePath(`/clientes/${clientId}`);
  return { ok: true };
}

export async function excluirDocumento(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const path = String(formData.get("path") ?? "");
  const clientId = String(formData.get("client_id") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  if (path) await supabase.storage.from("documentos").remove([path]);
  await supabase.from("documents").delete().eq("id", id);
  if (projectId) revalidatePath(`/projetos/${projectId}`);
  else if (clientId) revalidatePath(`/clientes/${clientId}`);
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}
