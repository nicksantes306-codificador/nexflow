// @nexflow/core — lógica de negócio pura (sem React/DOM), testável com Vitest.
// Extraída do index.html. No Sprint 3, o LicenseManager passa a ler
// subscriptions.status; aqui ficam as regras que não dependem de I/O.

export type LeadLike = {
  valor: number;
  status: string;
  ultimo?: string | null;
};

const PESO_ESTAGIO: Record<string, number> = {
  "Em contato": 10,
  "Orçamento enviado": 20,
  Negociação: 30,
  Proposta: 35,
  Aprovado: 40,
};

// Score 0–100 do lead (espelha/refina computeScore do index.html).
export function computeScore(input: LeadLike): number {
  let s = 30;
  if (input.valor > 50000) s += 25;
  else if (input.valor > 20000) s += 15;
  s += PESO_ESTAGIO[input.status] ?? 0;
  return Math.max(0, Math.min(100, s));
}

// Próxima melhor ação sugerida para o vendedor (heurística sem IA).
export function nextBestAction(lead: LeadLike): string {
  switch (lead.status) {
    case "Novo Lead":
      return "Fazer primeiro contato e qualificar a necessidade.";
    case "Em contato":
      return "Levantar escopo técnico e preparar orçamento.";
    case "Orçamento enviado":
      return "Follow-up: confirmar recebimento e tirar dúvidas.";
    case "Negociação":
      return "Negociar prazo/condições e endereçar objeções.";
    case "Proposta":
      return "Enviar proposta para assinatura e definir fechamento.";
    case "Aprovado":
      return "Abrir obra/projeto e emitir ART/RRT.";
    default:
      return "Revisar o lead.";
  }
}

// ── Cobrança / licença (Sprint 3) ──────────────────────────────────────────
export type SubStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "suspended";

// full = uso normal · readonly = somente leitura (suspensão suave) · blocked = bloqueado
export type AccessLevel = "full" | "readonly" | "blocked";

// Deriva o nível de acesso a partir do status da assinatura.
// Regra: past_due dentro do período de tolerância (grace, 7 dias) mantém full;
// após o grace vira readonly (suspensão suave); cancelada bloqueia.
export function accessLevel(
  status: SubStatus,
  graceUntil: string | null = null,
  now: Date = new Date(),
): AccessLevel {
  if (status === "active" || status === "trialing") return "full";
  if (status === "past_due") {
    if (graceUntil && new Date(graceUntil).getTime() > now.getTime()) return "full";
    return "readonly";
  }
  if (status === "suspended") return "readonly";
  return "blocked"; // canceled
}

// Motor de automações (event bus) — semente da extração do FlowEngine.
type Handler<C = unknown> = (ctx: C) => void;

export class FlowEngine {
  private handlers = new Map<string, Handler[]>();

  on(event: string, fn: Handler): () => void {
    const list = this.handlers.get(event) ?? [];
    list.push(fn);
    this.handlers.set(event, list);
    return () => this.off(event, fn);
  }

  off(event: string, fn: Handler): void {
    const list = this.handlers.get(event);
    if (list) this.handlers.set(event, list.filter((h) => h !== fn));
  }

  // Dispara um evento; retorna quantos handlers rodaram.
  trigger(event: string, ctx?: unknown): number {
    const list = this.handlers.get(event) ?? [];
    for (const h of list) h(ctx);
    return list.length;
  }
}
