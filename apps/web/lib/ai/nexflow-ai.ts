// NEXFLOW AI — assistente do CRM/ERP de engenharia elétrica.
// Funciona em dois modos:
//  • com ANTHROPIC_API_KEY → Claude (Anthropic) responde de verdade
//  • sem chave → cérebro local heurístico, respondendo dos dados reais do painel
// Server-only (usa SDK/env); nunca importar em componente client.

import type { DashData } from "@/lib/dashboard";

export type ChatMsg = { role: "user" | "assistant"; content: string };

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const MODELO = process.env.NEXFLOW_AI_MODEL ?? "claude-sonnet-4-6";

function brl(n: number): string {
  if (n >= 1e6)
    return "R$ " + (n / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " mi";
  if (n >= 1e3) return "R$ " + Math.round(n / 1e3).toLocaleString("pt-BR") + " mil";
  return "R$ " + Math.round(n).toLocaleString("pt-BR");
}

// Fotografia compacta do painel para dar contexto factual ao modelo.
export function snapshot(d: DashData): string {
  const funil = d.funil.map((f) => `${f.label}: ${f.count} (${brl(f.valor)})`).join("; ");
  const obras = d.obras.map((o) => `${o.nome} — ${o.pc}%`).join("; ");
  const alertas = d.alertas.map((a) => `(${a.cls}) ${a.txt}`).join("; ");
  return [
    `Receita acumulada: ${brl(d.receitaAcum)} · Receita do mês: ${brl(d.receitaMes)} (variação ${d.receitaMesDeltaPct >= 0 ? "+" : ""}${d.receitaMesDeltaPct}%)`,
    `Pipeline ativo: ${brl(d.pipelineValor)} · Oportunidades abertas: ${d.oportunidades} · Taxa de conversão: ${d.conversao}%`,
    `Obras ativas: ${d.obrasAtivas} (${d.obrasCriticas} críticas)`,
    `Funil: ${funil}`,
    `Obras em andamento: ${obras}`,
    `Alertas: ${alertas}`,
    d.demo ? "(observação: dados de demonstração — a empresa ainda não cadastrou registros reais)" : "",
  ].filter(Boolean).join("\n");
}

const SISTEMA = `Você é a NEXFLOW AI, assistente do NEXFLOW — um CRM/ERP para empresas de engenharia elétrica e automação industrial.
Responda SEMPRE em português do Brasil, de forma curta, objetiva e prática (no máximo ~120 palavras, salvo se pedirem detalhe).
Use SOMENTE os números dos "DADOS DO PAINEL" abaixo quando citar valores — nunca invente cifras.
Quando fizer sentido, termine com uma sugestão de próxima ação começando por "Sugestão:".
Quando listar itens, use marcadores com "- ".`;

// ── Modo Claude (gated) ──────────────────────────────────────────────────────
async function perguntarClaude(history: ChatMsg[], data: DashData): Promise<string> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic(); // lê ANTHROPIC_API_KEY do ambiente

  const resp = await client.messages.create({
    model: MODELO,
    max_tokens: 1024,
    system: `${SISTEMA}\n\nDADOS DO PAINEL (agora):\n${snapshot(data)}`,
    messages: history.map((m) => ({ role: m.role, content: m.content })),
  });

  const texto = resp.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n")
    .trim();
  return texto || "Não consegui gerar uma resposta agora. Tente reformular a pergunta.";
}

// ── Modo local (sem chave) — heurístico sobre os dados reais ──────────────────
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function nexflowLocalAI(perguntaRaw: string, d: DashData): string {
  const q = norm(perguntaRaw);
  const has = (...ks: string[]) => ks.some((k) => q.includes(k));

  if (has("pipeline", "funil", "oportunid", "etapa")) {
    const maior = [...d.funil].sort((a, b) => b.count - a.count)[0];
    const linhas = d.funil.map((f) => `- ${f.label}: ${f.count} (${brl(f.valor)})`).join("\n");
    return `Seu funil tem ${d.oportunidades} oportunidades abertas, somando ${brl(d.pipelineValor)} em pipeline.\n${linhas}\nA etapa mais cheia é "${maior?.label}".\nSugestão: priorize avançar as propostas e negociações, onde o ciclo de fechamento é mais curto.`;
  }
  if (has("receita", "financ", "fatur", "caixa", "previs")) {
    const dir = d.receitaMesDeltaPct >= 0 ? "alta" : "queda";
    return `Receita acumulada: ${brl(d.receitaAcum)}. No mês: ${brl(d.receitaMes)} (${dir} de ${Math.abs(d.receitaMesDeltaPct)}% vs. mês anterior).\nPipeline ativo: ${brl(d.pipelineValor)} em ${d.oportunidades} oportunidades.\nSugestão: acompanhe os recebíveis atrasados nos alertas para proteger o caixa.`;
  }
  if (has("obra", "risco", "atras", "medic", "campo", "equipe")) {
    const criticas = d.obras.filter((o) => o.pc < 50);
    const linhas = (criticas.length ? criticas : d.obras)
      .map((o) => `- ${o.nome} (${o.pc}%) · ${o.cli}`)
      .join("\n");
    const al = d.alertas.filter((a) => a.cls !== "info").map((a) => `- ${a.txt}`).join("\n");
    return `Você tem ${d.obrasAtivas} obras ativas, sendo ${d.obrasCriticas} críticas.\nAtenção:\n${linhas}${al ? `\nAlertas:\n${al}` : ""}\nSugestão: realoque equipe para as obras abaixo de 50% e destrave as que aguardam material.`;
  }
  if (has("convers", "taxa", "fech", "ganho")) {
    return `Sua taxa de conversão (lead → ganho) está em ${d.conversao}%.\nCom ${d.oportunidades} oportunidades abertas (${brl(d.pipelineValor)}), cada ponto de conversão vale bastante.\nSugestão: foque follow-up nas etapas Proposta e Negociação para subir a conversão.`;
  }
  if (has("prioriz", "quente", "foco", "vender", "onde", "lead", "acao", "proxim")) {
    const al = d.alertas[0];
    return `Para hoje, foque em 3 frentes:\n- Comercial: avançar as oportunidades em Proposta/Negociação (${brl(d.pipelineValor)} no pipeline).\n- Caixa: tratar recebíveis em aberto/atrasados.\n- Obras: as ${d.obrasCriticas} obras críticas.\n${al ? `Alerta nº1: ${al.txt}.\n` : ""}Sugestão: comece pelo alerta mais urgente e por uma proposta perto do fechamento.`;
  }

  // Resumo executivo (default / saudação)
  return `Panorama da empresa agora:\n- Receita acumulada: ${brl(d.receitaAcum)} (mês: ${brl(d.receitaMes)})\n- Pipeline: ${brl(d.pipelineValor)} em ${d.oportunidades} oportunidades · conversão ${d.conversao}%\n- Obras: ${d.obrasAtivas} ativas (${d.obrasCriticas} críticas)\n- Alertas: ${d.alertas.length} pendência(s)\nPergunte sobre "funil", "financeiro", "obras", "conversão" ou "o que priorizar".`;
}

// ── Ponto de entrada único ────────────────────────────────────────────────────
export async function perguntarIA(history: ChatMsg[], data: DashData): Promise<string> {
  const ultima = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
  if (!aiConfigured()) return nexflowLocalAI(ultima, data);
  try {
    return await perguntarClaude(history, data);
  } catch {
    // Falha de rede/chave → não quebra a experiência: cai no cérebro local.
    return nexflowLocalAI(ultima, data) + "\n\n_(resposta gerada localmente — a IA externa está indisponível no momento.)_";
  }
}
