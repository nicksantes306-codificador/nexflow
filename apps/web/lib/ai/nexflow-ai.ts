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
Use linguagem simples e direta, como quem explica para o dono de uma empresa de engenharia de 50 anos: evite jargão técnico e termos em inglês (diga "negócio em aberto" em vez de "lead", "faturamento" em vez de "receita", "fechamento" em vez de "conversão"). Pode usar termos de engenharia (ART, SPDA, subestação).
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

  if (has("pipeline", "funil", "oportunid", "etapa", "venda")) {
    const maior = [...d.funil].sort((a, b) => b.count - a.count)[0];
    const linhas = d.funil.map((f) => `- ${f.label}: ${f.count} (${brl(f.valor)})`).join("\n");
    return `Você tem ${d.oportunidades} negócios em aberto, somando ${brl(d.pipelineValor)} em negociação.\n${linhas}\nA etapa com mais clientes é ${maior?.label}.\nSugestão: dê atenção às propostas e negociações — são as que fecham mais rápido.`;
  }
  if (has("receita", "financ", "fatur", "caixa", "previs", "dinheiro")) {
    const dir = d.receitaMesDeltaPct >= 0 ? "subiu" : "caiu";
    return `Faturamento no ano: ${brl(d.receitaAcum)}. Neste mês: ${brl(d.receitaMes)} (${dir} ${Math.abs(d.receitaMesDeltaPct)}% em relação ao mês passado).\nEm negociação: ${brl(d.pipelineValor)} em ${d.oportunidades} negócios.\nSugestão: fique de olho nas contas atrasadas (nos avisos) para proteger o caixa.`;
  }
  if (has("obra", "risco", "atras", "medic", "campo", "equipe", "problema")) {
    const criticas = d.obras.filter((o) => o.pc < 50);
    const linhas = (criticas.length ? criticas : d.obras)
      .map((o) => `- ${o.nome} (${o.pc}%) · ${o.cli}`)
      .join("\n");
    const al = d.alertas.filter((a) => a.cls !== "info").map((a) => `- ${a.txt}`).join("\n");
    return `Você tem ${d.obrasAtivas} obras em andamento, sendo ${d.obrasCriticas} que precisam de atenção.\nPara olhar de perto:\n${linhas}${al ? `\nAvisos:\n${al}` : ""}\nSugestão: mande equipe para as obras abaixo de 50% e destrave as que esperam material.`;
  }
  if (has("convers", "taxa", "fech", "ganho")) {
    return `Sua taxa de fechamento está em ${d.conversao}% — de cada 100 clientes em potencial, ${d.conversao} viram negócio.\nVocê tem ${d.oportunidades} negócios em aberto (${brl(d.pipelineValor)}).\nSugestão: dê atenção às propostas e negociações para fechar mais.`;
  }
  if (has("prioriz", "quente", "foco", "vender", "onde", "lead", "acao", "proxim", "hoje")) {
    const al = d.alertas[0];
    return `Para hoje, foque em 3 frentes:\n- Vendas: avançar os negócios em proposta e negociação (${brl(d.pipelineValor)} em jogo).\n- Caixa: resolver as contas a receber em aberto ou atrasadas.\n- Obras: as ${d.obrasCriticas} que precisam de atenção.\n${al ? `Aviso mais urgente: ${al.txt}.\n` : ""}Sugestão: comece pelo aviso mais urgente e por uma venda perto de fechar.`;
  }

  // Resumo (default / saudação)
  return `Resumo da empresa agora:\n- Faturamento no ano: ${brl(d.receitaAcum)} (neste mês: ${brl(d.receitaMes)})\n- Em negociação: ${brl(d.pipelineValor)} em ${d.oportunidades} negócios · fechamento ${d.conversao}%\n- Obras: ${d.obrasAtivas} em andamento (${d.obrasCriticas} precisam de atenção)\n- Avisos: ${d.alertas.length}\nVocê pode me perguntar sobre vendas, financeiro, obras ou o que fazer hoje.`;
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
