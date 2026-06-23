"use server";

import { createClient } from "@/lib/supabase/server";

export type SearchHit = { tipo: string; label: string; sub: string; href: string };

export async function buscarGlobal(q: string): Promise<SearchHit[]> {
  const termo = q.trim().replace(/[(),*%]/g, "");
  if (termo.length < 2) return [];

  const supabase = await createClient();
  const star = `*${termo}*`;
  const like = `%${termo}%`;

  const [leadsR, cliR, prjR, orcR] = await Promise.all([
    supabase.from("leads").select("id,cliente,empresa,status").or(`cliente.ilike.${star},empresa.ilike.${star}`).limit(5),
    supabase.from("clients").select("id,nome,segmento").ilike("nome", like).limit(4),
    supabase.from("projects").select("id,nome,status").ilike("nome", like).limit(4),
    supabase.from("budgets").select("id,titulo,status").ilike("titulo", like).limit(4),
  ]);

  const hits: SearchHit[] = [];
  for (const l of leadsR.data ?? []) hits.push({ tipo: "Lead", label: l.cliente, sub: l.empresa || l.status, href: "/crm" });
  for (const c of cliR.data ?? []) hits.push({ tipo: "Cliente", label: c.nome, sub: c.segmento ?? "", href: "/clientes" });
  for (const p of prjR.data ?? []) hits.push({ tipo: "Obra", label: p.nome, sub: p.status, href: "/projetos" });
  for (const o of orcR.data ?? []) hits.push({ tipo: "Orçamento", label: o.titulo, sub: o.status, href: `/orcamentos/${o.id}` });
  return hits;
}
