// Motor de automações NEXFLOW — "quando GATILHO então AÇÃO".
// Roda no servidor quando os eventos disparam (lead criado, obra criada,
// orçamento aprovado, estoque baixo, etc.). Helpers puros (interp/filtrarRegras)
// são testáveis sem banco. Cada execução é registrada em automation_runs
// (monitoramento: status, erro, histórico).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@nexflow/db";

type SB = SupabaseClient<Database>;
type Regra = Tables<"automations">;

// ── catálogo (alimenta o construtor visual) ──
export type Categoria = "comercial" | "financeiro" | "obras" | "estoque" | "geral";

// `temValor`: o contexto do disparo carrega um valor em R$ — só esses gatilhos
// aceitam condição de valor (evita regras-fantasma que nunca disparam).
export const GATILHOS = [
  { id: "lead_created", label: "Quando um negócio é criado", precisaValor: false, temValor: true, categoria: "comercial" },
  { id: "lead_stage", label: "Quando um negócio muda de etapa", precisaValor: true, temValor: true, categoria: "comercial" },
  { id: "lead_won", label: "Quando um negócio é fechado (ganho)", precisaValor: false, temValor: true, categoria: "comercial" },
  { id: "lead_lost", label: "Quando um negócio é perdido", precisaValor: false, temValor: true, categoria: "comercial" },
  { id: "client_created", label: "Quando um cliente é cadastrado", precisaValor: false, temValor: false, categoria: "comercial" },
  { id: "budget_created", label: "Quando um orçamento é criado", precisaValor: false, temValor: true, categoria: "comercial" },
  { id: "budget_approved", label: "Quando um orçamento é aprovado", precisaValor: false, temValor: true, categoria: "comercial" },
  { id: "project_created", label: "Quando uma obra é criada", precisaValor: false, temValor: true, categoria: "obras" },
  { id: "project_paused", label: "Quando uma obra é pausada", precisaValor: false, temValor: true, categoria: "obras" },
  { id: "project_done", label: "Quando uma obra é concluída", precisaValor: false, temValor: true, categoria: "obras" },
  { id: "finance_created", label: "Quando um lançamento financeiro é criado", precisaValor: false, temValor: true, categoria: "financeiro" },
  { id: "task_created", label: "Quando uma tarefa é criada", precisaValor: false, temValor: false, categoria: "geral" },
  { id: "event_created", label: "Quando um evento é criado na agenda", precisaValor: false, temValor: false, categoria: "geral" },
  { id: "product_created", label: "Quando um produto é cadastrado", precisaValor: false, temValor: false, categoria: "estoque" },
  { id: "product_low_stock", label: "Quando um produto fica com estoque baixo", precisaValor: false, temValor: false, categoria: "estoque" },
] as const;

export function gatilhoTemValor(id: string): boolean {
  return GATILHOS.find((g) => g.id === id)?.temValor ?? false;
}

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
export function categoriaGatilho(id: string): Categoria {
  return GATILHOS.find((g) => g.id === id)?.categoria ?? "geral";
}

// ── contexto e helpers puros ──
export type AutoCtx = { cliente?: string | null; empresa?: string | null; valor?: number; status?: string };

export function interp(tpl: string | undefined, ctx: AutoCtx): string {
  return (tpl ?? "")
    .replace(/\{cliente\}/g, ctx.cliente ?? "")
    .replace(/\{empresa\}/g, ctx.empresa ?? "")
    .trim();
}

// Condição simples opcional: só dispara se {campo} {operador} {valor}.
// Guardada como jsonb; campo mal formado ou ausente não bloqueia a regra.
export type Condicao = { campo: "valor"; operador: ">" | ">=" | "<" | "<=" | "==" | "!="; valor: number };
export const OPERADORES = [
  { id: ">", label: "maior que" },
  { id: ">=", label: "maior ou igual a" },
  { id: "<", label: "menor que" },
  { id: "<=", label: "menor ou igual a" },
  { id: "==", label: "igual a" },
  { id: "!=", label: "diferente de" },
] as const;

export function condicaoPassa(condicao: unknown, ctx: AutoCtx): boolean {
  if (!condicao || typeof condicao !== "object") return true;
  const c = condicao as Partial<Condicao>;
  if (c.campo !== "valor" || typeof c.valor !== "number") return true;
  const atual = Number(ctx.valor ?? 0);
  switch (c.operador) {
    case ">": return atual > c.valor;
    case ">=": return atual >= c.valor;
    case "<": return atual < c.valor;
    case "<=": return atual <= c.valor;
    case "==": return atual === c.valor;
    case "!=": return atual !== c.valor;
    default: return true;
  }
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

// Dispara as automações ativas do tenant para um gatilho, registrando cada
// execução em automation_runs (ok/erro/simulado) para a tela de monitoramento.
//
// Idempotência: se `dedupKey` for informado (id do registro que originou o
// evento), cada regra executa NO MÁXIMO uma vez por registro — a inserção em
// automation_dedup tem UNIQUE(automation_id, chave), então disparos repetidos
// (re-salvar um orçamento aprovado, duplo clique, duas abas) são ignorados
// atomicamente no banco, sem race condition.
export async function runAutomations(
  sb: SB,
  tenant: string,
  gatilho: string,
  valor: string | null,
  ctx: AutoCtx,
  dedupKey?: string,
): Promise<number> {
  const { data } = await sb.from("automations").select("*").eq("gatilho", gatilho).eq("ativo", true);
  const regras = filtrarRegras((data ?? []) as Regra[], gatilho, valor);
  for (const r of regras) {
    // Regra-fantasma: condição de valor num gatilho cujo contexto não carrega
    // valor. Em vez de nunca disparar em silêncio, registra o problema no log.
    if (r.condicao != null && !gatilhoTemValor(r.gatilho)) {
      await logRun(sb, tenant, r, "erro", "Condição de valor não se aplica a este gatilho — edite ou recrie a regra sem condição.");
      continue;
    }
    if (!condicaoPassa(r.condicao, ctx)) continue; // condição não bateu — não executa, não conta como erro

    // Idempotência por registro (quando o chamador identifica o registro).
    if (dedupKey) {
      const { error: dupErr } = await sb.from("automation_dedup").insert({
        tenant_id: tenant,
        automation_id: r.id,
        chave: `${gatilho}:${dedupKey}`,
      });
      if (dupErr) continue; // já executada para este registro (ou corrida perdida) — ignora
    }

    // Modo teste: registra o que TERIA acontecido, sem criar nada.
    if (r.dry_run) {
      await logRun(sb, tenant, r, "simulado", "Modo teste — nada foi criado.");
      continue;
    }

    let status: "ok" | "erro" = "ok";
    let detalhe: string | null = null;
    try {
      await executar(sb, tenant, r, ctx);
      await sb.rpc("bump_automation_exec", { aid: r.id }); // incremento atômico
    } catch (e) {
      status = "erro";
      detalhe = e instanceof Error ? e.message.slice(0, 300) : "Erro desconhecido";
    }
    await logRun(sb, tenant, r, status, detalhe);
  }
  return regras.length;
}

async function logRun(sb: SB, tenant: string, r: Regra, status: "ok" | "erro" | "simulado", detalhe: string | null) {
  try {
    await sb.from("automation_runs").insert({
      tenant_id: tenant,
      automation_id: r.id,
      nome: r.nome,
      gatilho: r.gatilho,
      acao: r.acao,
      status,
      detalhe,
    });
  } catch {
    /* log é best-effort — nunca interrompe o fluxo principal */
  }
}

// Wrapper seguro para chamar de qualquer Server Action (criar cliente, obra,
// orçamento…) sem risco de derrubar a ação principal se algo falhar aqui.
export async function dispararAutomacao(
  sb: SB,
  tenant: string,
  gatilho: string,
  valor: string | null,
  ctx: AutoCtx,
  dedupKey?: string,
): Promise<void> {
  try {
    await runAutomations(sb, tenant, gatilho, valor, ctx, dedupKey);
  } catch {
    /* best-effort */
  }
}
