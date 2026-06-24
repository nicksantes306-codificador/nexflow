import { createClient } from "@/lib/supabase/server";
import type { Lead, Project, FinanceEntry, Client } from "@/lib/types";
import { montarDash } from "@/lib/dashboard";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

const PERIODOS = ["hoje", "semana", "mes", "trimestre", "ano"] as const;

function desdeDe(periodo: string, now: Date): Date | null {
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  switch (periodo) {
    case "hoje": return new Date(y, m, d);
    case "semana": return new Date(now.getTime() - 7 * 864e5);
    case "mes": return new Date(y, m, 1);
    case "trimestre": return new Date(y, Math.floor(m / 3) * 3, 1);
    case "ano": return new Date(y, 0, 1);
    default: return null;
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const sp = await searchParams;
  const periodo = PERIODOS.includes((sp.periodo ?? "") as (typeof PERIODOS)[number]) ? sp.periodo! : "ano";

  const supabase = await createClient();
  const [leadsRes, prjRes, finRes, cliRes] = await Promise.all([
    supabase.from("leads").select("*").order("valor", { ascending: false }),
    supabase.from("projects").select("*"),
    supabase.from("finance_entries").select("*"),
    supabase.from("clients").select("id,nome"),
  ]);

  const clientesNome: Record<string, string> = {};
  for (const c of (cliRes.data ?? []) as Pick<Client, "id" | "nome">[]) clientesNome[c.id] = c.nome;

  const dash = montarDash({
    leads: (leadsRes.data ?? []) as Lead[],
    projects: (prjRes.data ?? []) as Project[],
    finance: (finRes.data ?? []) as FinanceEntry[],
    clientesNome,
    desde: desdeDe(periodo, new Date()),
  });

  return <DashboardClient data={dash} periodo={periodo} />;
}
