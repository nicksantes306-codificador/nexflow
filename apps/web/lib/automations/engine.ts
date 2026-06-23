// Motor de automações NEXFLOW — "quando GATILHO então AÇÃO".
// Roda no servidor quando os eventos disparam (ex.: lead criado / muda de estágio).
// Helpers puros (interp/filtrarRegras) são testáveis sem banco.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@nexflow/db";

type SB = SupabaseClient<Database>;
type Regra = Tables<"automations">;

// ── catálogo (alimenta o construtor visual) ──
export const GATILHOS = [
  { id: "lead_created", label: "Quando um lead é criado", precisaValor: false },
  { id: "lead_stage", label: "Quando um lead muda de estágio", precisaValor: true },
] as const;

export const ACOES = [
  { id: "create_task", label: "Criar uma tarefa" },
  { id: "create_finance", label: "Criar um lançamento financeiro" },
  { id: "create_event", label: "Criar um evento na agenda" },
] as const;

export function labelGatilho(id: string): string {
  return GATILHOS.find((g) => g.id === id)?.label ?? id;
}
export function labelAcao(id: string): string {
  return ACOES.find((a) => a.id === id)?.label ?? id;
}

// ── contexto e helpers puros ──
export type AutoCtx = { cliente?: string | null; empresa?: string | null; valor?: number; status?: string };

export function interp(tpl: string | undefined, ctx: AutoCtx): string {
  return (tpl ?? "")
    .replace(/\{cliente\}/g, ctx.cliente ?? "")
    .replace(/\{empresa\}/g, ctx.empresa ?? "")
    .trim();
}

export function filtrarRegras<T extends { gatilho: string; gatilho_valor: string | null; ativo: boolean }>(
  regras: T[],
  gatilho: string,
  valor: string | null,
): T[] {
  return regras.filter(
    (r) => r.ativo && r.gatilho === gatilho && (!r.gatilho_valor || r.gatilho_valor === valor),
  );
}

// ── execução (servidor) ──
async function executar(sb: SB, tenant: string, r: Regra, ctx: AutoCtx) {
  const p = (r.acao_param ?? {}) as Record<string, unknown>;
  if (r.acao === "create_task") {
    await sb.from("tasks").insert({
      tenant_id: tenant,
      titulo: interp(String(p.titulo ?? ""), ctx) || "Tarefa automática",
      cliente: ctx.cliente ?? null,
      prioridade: (p.prioridade as "Alta" | "Média" | "Baixa") ?? "Média",
    });
  } else if (r.acao === "create_finance") {
    const bruto = p.valor === "auto" ? (ctx.valor ?? 0) : Number(p.valor ?? 0);
    await sb.from("finance_entries").insert({
      tenant_id: tenant,
      tipo: (p.tipo as "Entrada" | "Saída") ?? "Entrada",
      descricao: interp(String(p.descricao ?? ""), ctx) || "Lançamento automático",
      valor: Number.isFinite(bruto) ? bruto : 0,
      status: "Pendente",
      cliente: ctx.cliente ?? null,
    });
  } else if (r.acao === "create_event") {
    await sb.from("events").insert({
      tenant_id: tenant,
      titulo: interp(String(p.titulo ?? ""), ctx) || "Evento automático",
      data: new Date().toISOString().slice(0, 10),
      cliente: ctx.cliente ?? null,
    });
  }
}

// Dispara as automações ativas do tenant para um gatilho. Best-effort:
// erros numa regra não derrubam o fluxo principal (lead criado/movido).
export async function runAutomations(
  sb: SB,
  tenant: string,
  gatilho: string,
  valor: string | null,
  ctx: AutoCtx,
): Promise<number> {
  const { data } = await sb.from("automations").select("*").eq("gatilho", gatilho).eq("ativo", true);
  const regras = filtrarRegras((data ?? []) as Regra[], gatilho, valor);
  for (const r of regras) {
    try {
      await executar(sb, tenant, r, ctx);
      await sb.from("automations").update({ exec_count: (r.exec_count ?? 0) + 1 }).eq("id", r.id);
    } catch {
      /* não interrompe o fluxo principal */
    }
  }
  return regras.length;
}
