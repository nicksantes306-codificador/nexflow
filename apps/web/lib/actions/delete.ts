"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Exclusão genérica de registros. Só permite tabelas de dados do dia a dia
 * (nunca tenants/subscriptions/memberships/profiles). A RLS garante que a
 * pessoa só apaga o que é da própria equipe.
 */
const PERMITIDAS = [
  "clients",
  "leads",
  "projects",
  "finance_entries",
  "budgets",
  "tasks",
  "events",
] as const;
type Tabela = (typeof PERMITIDAS)[number];

export type ExcluirState = { ok?: boolean; error?: string };

export async function excluirRegistro(formData: FormData): Promise<ExcluirState> {
  const tabela = String(formData.get("tabela") ?? "") as Tabela;
  const id = String(formData.get("id") ?? "");
  const path = String(formData.get("path") ?? "/");
  if (!(PERMITIDAS as readonly string[]).includes(tabela)) return { error: "Item não pode ser excluído." };
  if (!id) return { error: "Item inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from(tabela).delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(path);
  return { ok: true };
}
