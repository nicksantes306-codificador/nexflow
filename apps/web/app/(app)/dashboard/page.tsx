import { createClient } from "@/lib/supabase/server";
import type { Lead, Project, FinanceEntry, Client } from "@/lib/types";
import { montarDash } from "@/lib/dashboard";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  // RLS filtra tudo pelo tenant logado.
  const [leadsRes, prjRes, finRes, cliRes] = await Promise.all([
    supabase.from("leads").select("*").order("valor", { ascending: false }),
    supabase.from("projects").select("*"),
    supabase.from("finance_entries").select("*"),
    supabase.from("clients").select("id,nome"),
  ]);

  const clientes = (cliRes.data ?? []) as Pick<Client, "id" | "nome">[];
  const clientesNome: Record<string, string> = {};
  for (const c of clientes) clientesNome[c.id] = c.nome;

  const dash = montarDash({
    leads: (leadsRes.data ?? []) as Lead[],
    projects: (prjRes.data ?? []) as Project[],
    finance: (finRes.data ?? []) as FinanceEntry[],
    clientesNome,
  });

  return <DashboardClient data={dash} />;
}
