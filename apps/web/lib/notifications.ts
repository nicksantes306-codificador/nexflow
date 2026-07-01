import { createClient } from "@/lib/supabase/server";

export type Notificacao = {
  id: string;
  grupo: "Avisos" | "Atividade";
  prioridade: 0 | 1 | 2; // 0 = alta (vermelho), 1 = média (âmbar), 2 = info
  titulo: string;
  sub?: string;
  quando: string; // ISO
  href: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const localISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Notificações = lembretes que precisam de ação (tarefas/contas/orçamentos)
// + atividade recente da equipe (auditoria). Best-effort: nunca lança.
export async function buscarNotificacoes(): Promise<Notificacao[]> {
  try {
    const supabase = await createClient();
    const now = new Date();
    const hoje = localISO(now);
    const em7 = localISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7));

    const [auditRes, tasksRes, budgetsRes, finRes, prodRes] = await Promise.all([
      supabase.from("audit_log").select("id,acao,entidade,alvo,created_at").order("created_at", { ascending: false }).limit(12),
      supabase.from("tasks").select("id,titulo,prazo,done"),
      supabase.from("budgets").select("id,titulo,status,validade"),
      supabase.from("finance_entries").select("id,descricao,tipo,status,data"),
      supabase.from("products").select("id,nome,quantidade,minimo"),
    ]);

    const notifs: Notificacao[] = [];

    for (const p of (prodRes.data ?? []) as { id: string; nome: string; quantidade: number; minimo: number }[]) {
      if (Number(p.minimo) > 0 && Number(p.quantidade) <= Number(p.minimo)) {
        notifs.push({ id: "prod-" + p.id, grupo: "Avisos", prioridade: 1, titulo: `Estoque baixo: ${p.nome}`, sub: `${Number(p.quantidade)} em estoque (mínimo ${Number(p.minimo)})`, quando: now.toISOString(), href: "/estoque" });
      }
    }

    for (const t of (tasksRes.data ?? []) as { id: string; titulo: string; prazo: string | null; done: boolean }[]) {
      if (t.done || !t.prazo) continue;
      const p = String(t.prazo);
      if (p < hoje) notifs.push({ id: "task-" + t.id, grupo: "Avisos", prioridade: 0, titulo: `Tarefa vencida: ${t.titulo}`, quando: p + "T12:00:00", href: "/tarefas" });
      else if (p <= em7) notifs.push({ id: "task-" + t.id, grupo: "Avisos", prioridade: 1, titulo: `Tarefa a vencer: ${t.titulo}`, sub: `Prazo ${p.split("-").reverse().join("/")}`, quando: p + "T12:00:00", href: "/tarefas" });
    }

    for (const b of (budgetsRes.data ?? []) as { id: string; titulo: string; status: string; validade: string | null }[]) {
      if (!b.validade) continue;
      const v = String(b.validade);
      if (v <= em7 && b.status !== "aprovado" && b.status !== "recusado") {
        const venceu = v < hoje;
        notifs.push({ id: "bud-" + b.id, grupo: "Avisos", prioridade: venceu ? 0 : 1, titulo: `${venceu ? "Orçamento vencido" : "Orçamento vence em breve"}: ${b.titulo}`, quando: v + "T12:00:00", href: "/orcamentos" });
      }
    }

    for (const e of (finRes.data ?? []) as { id: string; descricao: string; tipo: string; status: string; data: string | null }[]) {
      if (e.tipo === "Entrada" && e.status === "Atrasado") {
        notifs.push({ id: "fin-" + e.id, grupo: "Avisos", prioridade: 0, titulo: `Conta a receber atrasada: ${e.descricao}`, quando: (e.data ?? hoje) + "T12:00:00", href: "/financeiro" });
      }
    }

    for (const a of (auditRes.data ?? []) as { id: string; acao: string; entidade: string | null; alvo: string | null; created_at: string }[]) {
      const alvo = a.alvo ? ` "${a.alvo}"` : "";
      notifs.push({ id: "aud-" + a.id, grupo: "Atividade", prioridade: 2, titulo: `${a.acao} ${(a.entidade ?? "").toLowerCase()}${alvo}`.trim(), quando: a.created_at, href: "/historico" });
    }

    notifs.sort((x, y) => x.prioridade - y.prioridade || y.quando.localeCompare(x.quando));
    return notifs.slice(0, 30);
  } catch {
    return [];
  }
}
