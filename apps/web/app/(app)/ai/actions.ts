"use server";

import { createClient } from "@/lib/supabase/server";
import type { Lead, Project, FinanceEntry, Client } from "@/lib/types";
import { montarDash } from "@/lib/dashboard";
import { perguntarIA, type ChatMsg } from "@/lib/ai/nexflow-ai";

export type IAResposta = { reply: string };

export async function perguntar(history: ChatMsg[]): Promise<IAResposta> {
  const limpa = history
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12); // mantém o contexto curto e barato

  if (limpa.length === 0 || limpa[limpa.length - 1].role !== "user") {
    return { reply: "Faça uma pergunta sobre seu funil, financeiro, obras ou prioridades do dia." };
  }

  const supabase = await createClient();
  const [leadsRes, prjRes, finRes, cliRes] = await Promise.all([
    supabase.from("leads").select("*"),
    supabase.from("projects").select("*"),
    supabase.from("finance_entries").select("*"),
    supabase.from("clients").select("id,nome"),
  ]);

  const clientesNome: Record<string, string> = {};
  for (const c of (cliRes.data ?? []) as Pick<Client, "id" | "nome">[]) clientesNome[c.id] = c.nome;

  const data = montarDash({
    leads: (leadsRes.data ?? []) as Lead[],
    projects: (prjRes.data ?? []) as Project[],
    finance: (finRes.data ?? []) as FinanceEntry[],
    clientesNome,
  });

  const reply = await perguntarIA(limpa, data);
  return { reply };
}
