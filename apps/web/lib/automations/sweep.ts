// Varredura das automações de TEMPO (gatilhos precisaDias + conta vencida).
// Roda quando alguém da equipe abre o app; a idempotência do motor
// (automation_dedup) garante que cada regra executa 1x por registro, então
// rodar a varredura muitas vezes ao dia não duplica nada.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@nexflow/db";
import { executarRegra } from "./engine";

type SB = SupabaseClient<Database>;
type Regra = Tables<"automations">;

export const GATILHOS_TEMPO = [
  "budget_expiring",
  "budget_stale",
  "lead_stale",
  "project_deadline",
  "finance_overdue",
] as const;

// ── helpers puros de data (testáveis) ────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, "0");
export function hojeLocalISO(now: Date): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
// Dias de hojeISO até dataISO (positivo = futuro, negativo = passado).
export function diasAte(hojeISO: string, dataISO: string): number {
  const [ya, ma, da] = hojeISO.split("-").map(Number);
  const [yb, mb, db] = dataISO.split("-").map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 864e5);
}
export function diasDe(regra: { gatilho_valor: string | null }, padrao: number): number {
  const n = Number(regra.gatilho_valor);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : padrao;
}

// ── varredura ─────────────────────────────────────────────────────────────────
export async function varreduraAutomacoes(sb: SB, tenant: string, now = new Date()): Promise<void> {
  const { data } = await sb
    .from("automations")
    .select("*")
    .in("gatilho", [...GATILHOS_TEMPO])
    .eq("ativo", true);
  const regras = (data ?? []) as Regra[];
  if (regras.length === 0) return; // sem regras de tempo — varredura sai de graça

  const hoje = hojeLocalISO(now);
  const por = (g: string) => regras.filter((r) => r.gatilho === g);

  // Orçamento a X dias de vencer (ainda sem decisão)
  const rExp = por("budget_expiring");
  if (rExp.length) {
    const { data: rows } = await sb
      .from("budgets")
      .select("id,titulo,valor_total,validade,status")
      .not("validade", "is", null)
      .in("status", ["rascunho", "enviado"]);
    for (const b of rows ?? []) {
      const dias = diasAte(hoje, String(b.validade));
      for (const r of rExp) {
        if (dias >= 0 && dias <= diasDe(r, 7)) {
          await executarRegra(sb, tenant, r, { cliente: b.titulo, valor: Number(b.valor_total) }, `budget_expiring:${b.id}:${b.validade}`);
        }
      }
    }
  }

  // Orçamento enviado há X dias sem resposta
  const rStaleB = por("budget_stale");
  if (rStaleB.length) {
    const { data: rows } = await sb
      .from("budgets")
      .select("id,titulo,valor_total,created_at,status")
      .eq("status", "enviado");
    for (const b of rows ?? []) {
      const dias = -diasAte(hoje, String(b.created_at).slice(0, 10));
      for (const r of rStaleB) {
        if (dias >= diasDe(r, 5)) {
          await executarRegra(sb, tenant, r, { cliente: b.titulo, valor: Number(b.valor_total) }, `budget_stale:${b.id}`);
        }
      }
    }
  }

  // Negócio parado há X dias sem contato (fora dos status terminais)
  const rStaleL = por("lead_stale");
  if (rStaleL.length) {
    const { data: rows } = await sb
      .from("leads")
      .select("id,cliente,empresa,valor,ultimo,status")
      .not("ultimo", "is", null)
      .not("status", "in", '("Aprovado","Perdido")');
    for (const l of rows ?? []) {
      const dias = -diasAte(hoje, String(l.ultimo));
      for (const r of rStaleL) {
        if (dias >= diasDe(r, 7)) {
          // chave inclui a data do último contato: se houver novo contato e
          // parar de novo, a regra volta a valer (evento genuinamente novo).
          await executarRegra(sb, tenant, r, { cliente: l.cliente, empresa: l.empresa, valor: Number(l.valor) }, `lead_stale:${l.id}:${l.ultimo}`);
        }
      }
    }
  }

  // Obra a X dias do prazo final (ainda não concluída)
  const rDead = por("project_deadline");
  if (rDead.length) {
    const { data: rows } = await sb
      .from("projects")
      .select("id,nome,valor,fim,status")
      .not("fim", "is", null)
      .neq("status", "Concluído");
    for (const p of rows ?? []) {
      const dias = diasAte(hoje, String(p.fim));
      for (const r of rDead) {
        if (dias >= 0 && dias <= diasDe(r, 7)) {
          await executarRegra(sb, tenant, r, { cliente: p.nome, valor: Number(p.valor) }, `project_deadline:${p.id}:${p.fim}`);
        }
      }
    }
  }

  // Conta a receber vencida (Pendente com data no passado)
  const rOver = por("finance_overdue");
  if (rOver.length) {
    const { data: rows } = await sb
      .from("finance_entries")
      .select("id,descricao,valor,data,tipo,status")
      .eq("tipo", "Entrada")
      .eq("status", "Pendente")
      .lt("data", hoje);
    for (const f of rows ?? []) {
      for (const r of rOver) {
        await executarRegra(sb, tenant, r, { cliente: f.descricao, valor: Number(f.valor) }, `finance_overdue:${f.id}`);
      }
    }
  }
}
