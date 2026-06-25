"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean };

export async function criarTarefa(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return { error: "Informe o título da tarefa." };

  const supabase = await createClient();
  const { data: tenant } = await supabase.rpc("current_tenant_id");
  if (!tenant) return { error: "Nenhum tenant ativo para este usuário." };

  const prioridade = String(formData.get("prioridade") ?? "Média");

  const { error } = await supabase.from("tasks").insert({
    tenant_id: tenant,
    titulo,
    cliente: emptyToNull(formData.get("cliente")),
    prioridade: ["Baixa", "Média", "Alta"].includes(prioridade)
      ? (prioridade as "Baixa" | "Média" | "Alta")
      : "Média",
    prazo: emptyToNull(formData.get("prazo")),
    done: false,
  });

  if (error) return { error: error.message };
  revalidatePath("/tarefas");
  return { ok: true };
}

export async function editarTarefa(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Tarefa inválida." };
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return { error: "Informe o título da tarefa." };

  const prioridade = String(formData.get("prioridade") ?? "Média");
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update({
      titulo,
      cliente: emptyToNull(formData.get("cliente")),
      prioridade: ["Baixa", "Média", "Alta"].includes(prioridade)
        ? (prioridade as "Baixa" | "Média" | "Alta")
        : "Média",
      prazo: emptyToNull(formData.get("prazo")),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/tarefas");
  return { ok: true };
}

// Alterna concluída/aberta. Chamado via <form action> em cada linha.
export async function toggleTarefa(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const done = String(formData.get("done") ?? "") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("tasks").update({ done: !done }).eq("id", id);
  revalidatePath("/tarefas");
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}
