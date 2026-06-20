"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TODOS_STATUS } from "@/lib/constants";

export type ImportResult = {
  error?: string;
  counts?: Record<string, number>;
};

type AnyRec = Record<string, unknown>;
const str = (v: unknown) => (v == null ? null : String(v));
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const MAX = 5000; // teto por coleção para evitar abuso

// Recebe o JSON exportado do localStorage do index.html (objeto Store.db ou
// um wrapper com `db`). Mapeia para as tabelas do tenant e insere via RLS.
export async function importData(raw: string): Promise<ImportResult> {
  let parsed: AnyRec;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "JSON inválido. Cole o conteúdo exportado do NEXFLOW." };
  }
  const db = (parsed.db ?? parsed) as AnyRec;

  const supabase = await createClient();
  const { data: tenant } = await supabase.rpc("current_tenant_id");
  if (!tenant) return { error: "Nenhum tenant ativo para este usuário." };

  const arr = (k: string): AnyRec[] => {
    const v = db[k];
    return Array.isArray(v) ? (v.slice(0, MAX) as AnyRec[]) : [];
  };

  const counts: Record<string, number> = {};

  // ── leads ──
  const leads = arr("leads").map((l) => ({
    tenant_id: tenant,
    cliente: str(l.cliente) ?? "Sem nome",
    empresa: str(l.empresa),
    valor: num(l.valor),
    status: TODOS_STATUS.includes(String(l.status) as never)
      ? String(l.status)
      : "Novo Lead",
    responsavel: str(l.responsavel),
    ultimo: str(l.ultimo),
    obs: str(l.obs),
    score: num(l.score),
    origem: str(l.origem),
    telefone: str(l.telefone),
    email: str(l.email),
  }));
  if (leads.length) {
    const { error } = await supabase.from("leads").insert(leads);
    if (error) return { error: `Leads: ${error.message}` };
    counts.leads = leads.length;
  }

  // ── clientes (clientes | clients) ──
  const clientes = [...arr("clientes"), ...arr("clients")].map((c) => ({
    tenant_id: tenant,
    nome: str(c.nome) ?? str(c.cliente) ?? "Sem nome",
    cnpj: str(c.cnpj),
    segmento: str(c.segmento),
    contato: str(c.contato),
    telefone: str(c.telefone),
    email: str(c.email),
  }));
  if (clientes.length) {
    const { error } = await supabase.from("clients").insert(clientes);
    if (error) return { error: `Clientes: ${error.message}` };
    counts.clientes = clientes.length;
  }

  // ── financeiro (financeiro | finance) ──
  const FIN_STATUS = ["Pendente", "Pago", "Recebido", "Atrasado", "Cancelado"];
  const fin = [...arr("financeiro"), ...arr("finance")].map((f) => ({
    tenant_id: tenant,
    tipo: (str(f.tipo) === "Saída" ? "Saída" : "Entrada") as "Entrada" | "Saída",
    descricao: str(f.descricao) ?? "Lançamento",
    valor: num(f.valor),
    status: (FIN_STATUS.includes(String(f.status))
      ? String(f.status)
      : "Pendente") as "Pendente" | "Pago" | "Recebido" | "Atrasado" | "Cancelado",
    data: str(f.data) ?? new Date().toISOString().slice(0, 10),
    categoria: str(f.categoria),
    cliente: str(f.cliente),
  }));
  if (fin.length) {
    const { error } = await supabase.from("finance_entries").insert(fin);
    if (error) return { error: `Financeiro: ${error.message}` };
    counts.financeiro = fin.length;
  }

  // ── tarefas (tarefas | tasks) ──
  const tarefas = [...arr("tarefas"), ...arr("tasks")].map((t) => ({
    tenant_id: tenant,
    titulo: str(t.titulo) ?? "Tarefa",
    cliente: str(t.cliente),
    prioridade: ["Baixa", "Média", "Alta"].includes(String(t.prioridade))
      ? (String(t.prioridade) as "Baixa" | "Média" | "Alta")
      : "Média",
    prazo: str(t.prazo),
    done: Boolean(t.done),
    tags: Array.isArray(t.tags) ? (t.tags as string[]) : [],
  }));
  if (tarefas.length) {
    const { error } = await supabase.from("tasks").insert(tarefas);
    if (error) return { error: `Tarefas: ${error.message}` };
    counts.tarefas = tarefas.length;
  }

  // ── agenda (agenda | events) ──
  const agenda = [...arr("agenda"), ...arr("events")]
    .filter((e) => e.data)
    .map((e) => ({
      tenant_id: tenant,
      titulo: str(e.titulo) ?? "Evento",
      data: String(e.data),
      hora: str(e.hora),
      tipo: str(e.tipo),
      cliente: str(e.cliente),
      local: str(e.local),
    }));
  if (agenda.length) {
    const { error } = await supabase.from("events").insert(agenda);
    if (error) return { error: `Agenda: ${error.message}` };
    counts.agenda = agenda.length;
  }

  revalidatePath("/crm");
  return { counts };
}
