// Converte um pedido em português ("quando um orçamento for aprovado, crie uma
// tarefa...") numa sugestão de automação (gatilho + ação + condição), pronta
// para o usuário revisar e criar. Mesmo padrão de dois modos da NEXFLOW AI:
// com ANTHROPIC_API_KEY usa Claude (restrito ao catálogo real, JSON validado);
// sem chave, ou se algo falhar, cai num interpretador local por palavras-chave.

import { aiConfigured } from "../ai/nexflow-ai";
import { GATILHOS, ACOES } from "./engine";

export type SugestaoAutomacao = {
  nome: string;
  gatilho: string;
  gatilhoValor: string | null;
  acao: string;
  param: Record<string, string | boolean>;
  condicao: { operador: string; valor: number } | null;
};

const MODELO = process.env.NEXFLOW_AI_MODEL ?? "claude-sonnet-4-6";

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Cada regra vira verdadeira se TODOS os radicais de pelo menos um grupo
// aparecerem no texto (robusto a conjugação/preposições do português, ex.:
// "negócio FOR ganho" ainda bate com o grupo ["negocio","ganho"]).
function bateAlgumGrupo(texto: string, grupos: string[][]): boolean {
  return grupos.some((g) => g.every((radical) => texto.includes(radical)));
}

const GATILHO_KEYWORDS: { id: string; grupos: string[][] }[] = [
  // Gatilhos de tempo primeiro (frases mais específicas ganham das genéricas)
  { id: "budget_stale", grupos: [["orcamento", "sem resposta"], ["proposta", "sem resposta"], ["orcamento", "parad"], ["proposta", "parad"], ["follow", "proposta"]] },
  { id: "budget_expiring", grupos: [["orcamento", "vencer"], ["orcamento", "vencendo"], ["proposta", "vencer"], ["validade", "orcamento"]] },
  { id: "lead_stale", grupos: [["negocio", "parad"], ["lead", "parad"], ["sem contato"], ["negocio", "sem resposta"], ["cliente", "parad"]] },
  { id: "project_deadline", grupos: [["obra", "prazo"], ["prazo", "final"], ["obra", "vencendo"], ["projeto", "prazo"]] },
  { id: "finance_overdue", grupos: [["conta", "vencid"], ["fatura", "vencid"], ["recebiv", "vencid"], ["conta", "atrasad"], ["fatura", "atrasad"], ["pagamento", "atrasad"]] },
  { id: "lead_won", grupos: [["negocio", "ganho"], ["lead", "ganho"], ["venda", "fechad"], ["negocio", "fechad"], ["vendeu"], ["ganhou"]] },
  { id: "lead_lost", grupos: [["negocio", "perdid"], ["lead", "perdid"], ["perdeu"], ["desistiu"]] },
  { id: "lead_stage", grupos: [["muda", "etapa"], ["muda", "estagio"], ["negociacao"], ["vira", "proposta"]] },
  { id: "budget_approved", grupos: [["orcamento", "aprov"]] },
  { id: "budget_created", grupos: [["orcamento", "cri"], ["orcamento", "novo"], ["orcamento", "gerar"]] },
  { id: "project_done", grupos: [["obra", "conclu"], ["projeto", "conclu"], ["servico", "conclu"], ["entregar", "obra"]] },
  { id: "project_paused", grupos: [["obra", "pausad"], ["obra", "parad"], ["projeto", "pausad"]] },
  { id: "project_created", grupos: [["obra", "cri"], ["obra", "nova"], ["projeto", "novo"], ["obra", "iniciar"]] },
  { id: "product_low_stock", grupos: [["estoque", "baix"], ["produto", "acaband"], ["falta", "material"], ["sem", "estoque"]] },
  { id: "product_created", grupos: [["produto", "cadastr"], ["produto", "novo"], ["material", "cadastr"]] },
  { id: "client_created", grupos: [["cliente", "cadastr"], ["cliente", "novo"]] },
  { id: "finance_created", grupos: [["lancamento", "financeiro"], ["conta", "criad"], ["cobranca", "criad"], ["nova", "conta"], ["novo", "lancamento"]] },
  { id: "task_created", grupos: [["tarefa", "criad"], ["tarefa", "nova"]] },
  { id: "event_created", grupos: [["evento", "criad"], ["reuniao", "agendad"], ["novo", "evento"], ["agendar", "reuniao"], ["marcar", "reuniao"]] },
  { id: "lead_created", grupos: [["lead", "criad"], ["novo", "lead"], ["negocio", "criad"], ["novo", "negocio"]] },
];

// Checada por ordem: tarefa/evento antes de financeiro, para não confundir
// "criar tarefa para o financeiro" com uma ação financeira.
const ACAO_KEYWORDS: { id: string; grupos: string[][] }[] = [
  { id: "create_task", grupos: [["tarefa"], ["lembrete"], ["follow-up"], ["followup"], ["avis"], ["notific"]] },
  { id: "create_event", grupos: [["agendar"], ["evento"], ["reuniao"], ["agenda"], ["visita", "tecnica"]] },
  { id: "create_finance", grupos: [["lancamento", "financeiro"], ["cobranca"], ["gerar", "conta"], ["lancar"], ["receita"], ["despesa"]] },
];

// Extrai "acima de 50000" / "maior que R$ 50.000" / "menor que 1000" etc.
function extrairCondicao(texto: string): { operador: string; valor: number } | null {
  const m = texto.match(/(acima de|maior ou igual a|maior que|abaixo de|menor ou igual a|menor que)\s*(?:r\$)?\s*([\d.,]+)/);
  if (!m) return null;
  const opTxt = m[1];
  const numTxt = m[2].replace(/\./g, "").replace(",", ".");
  const valor = Number(numTxt);
  if (!Number.isFinite(valor)) return null;
  const operador = /maior ou igual/.test(opTxt) ? ">=" : /acima|maior/.test(opTxt) ? ">" : /menor ou igual/.test(opTxt) ? "<=" : "<";
  return { operador, valor };
}

// Extrai o "X dias" dos gatilhos de tempo (ex.: "sem resposta há 5 dias").
export function extrairDias(texto: string): number | null {
  const m = texto.match(/(\d{1,3})\s*dias?/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function sugerirLocal(textoRaw: string): SugestaoAutomacao {
  const texto = norm(textoRaw);
  const gatilho = GATILHO_KEYWORDS.find((g) => bateAlgumGrupo(texto, g.grupos))?.id ?? "lead_created";
  const acao = ACAO_KEYWORDS.find((a) => bateAlgumGrupo(texto, a.grupos))?.id ?? "create_task";
  const condicao = extrairCondicao(texto);
  const precisaDias = GATILHOS.find((g) => g.id === gatilho)?.precisaDias ?? false;
  const dias = precisaDias ? extrairDias(texto) : null;

  const param: Record<string, string | boolean> =
    acao === "create_finance"
      ? { descricao: "Lançamento — {cliente}", tipo: "Entrada", valorAuto: true }
      : acao === "create_event"
        ? { titulo: "Contato com {cliente}" }
        : { titulo: "Follow-up: {cliente}", prioridade: "Média" };

  return {
    nome: textoRaw.trim().slice(0, 80) || "Nova automação",
    gatilho,
    gatilhoValor: dias != null ? String(dias) : null,
    acao,
    param,
    condicao,
  };
}

async function sugerirComClaude(texto: string): Promise<SugestaoAutomacao> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const catalogoGatilhos = GATILHOS.map((g) => `${g.id}: ${g.label}`).join("\n");
  const catalogoAcoes = ACOES.map((a) => `${a.id}: ${a.label}`).join("\n");

  const resp = await client.messages.create({
    model: MODELO,
    max_tokens: 400,
    system: `Você converte um pedido em português numa automação do NEXFLOW. Responda APENAS com um JSON válido (sem texto antes/depois, sem markdown), no formato:
{"nome":"...","gatilho":"<id do catálogo>","gatilhoValor":null|"<dias>","acao":"<id do catálogo>","param":{...},"condicao":null|{"operador":">"|">="|"<"|"<="|"=="|"!=","valor":number}}

Gatilhos disponíveis (use exatamente o id):
${catalogoGatilhos}

Gatilhos de tempo (budget_expiring, budget_stale, lead_stale, project_deadline): se o pedido mencionar um número de dias, coloque-o como string em "gatilhoValor" (ex.: "5"); senão use null.

Ações disponíveis (use exatamente o id):
${catalogoAcoes}

Regras de param por ação:
- create_task: {"titulo":"texto com {cliente}","prioridade":"Alta"|"Média"|"Baixa"}
- create_finance: {"descricao":"texto com {cliente}","tipo":"Entrada"|"Saída","valorAuto":true|false}
- create_event: {"titulo":"texto com {cliente}"}
Use o marcador {cliente} no texto para representar o nome do cliente/negócio envolvido.`,
    messages: [{ role: "user", content: texto }],
  });

  const raw = resp.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
  const limpo = raw.replace(/^```(?:json)?\s*|\s*```$/g, "");
  const json = JSON.parse(limpo) as {
    nome?: string;
    gatilho?: string;
    gatilhoValor?: string | null;
    acao?: string;
    param?: Record<string, string | boolean>;
    condicao?: { operador?: string; valor?: number } | null;
  };

  if (!GATILHOS.some((g) => g.id === json.gatilho) || !ACOES.some((a) => a.id === json.acao)) {
    throw new Error("IA sugeriu um gatilho/ação fora do catálogo");
  }

  const precisaDias = GATILHOS.find((g) => g.id === json.gatilho)?.precisaDias ?? false;
  const diasOk = precisaDias && json.gatilhoValor != null && Number(json.gatilhoValor) > 0;

  return {
    nome: String(json.nome ?? texto.slice(0, 80)) || "Nova automação",
    gatilho: json.gatilho!,
    gatilhoValor: diasOk ? String(Math.floor(Number(json.gatilhoValor))) : null,
    acao: json.acao!,
    param: json.param ?? {},
    condicao: json.condicao && typeof json.condicao.valor === "number" ? { operador: String(json.condicao.operador ?? ">="), valor: json.condicao.valor } : null,
  };
}

export async function sugerirAutomacaoIA(texto: string): Promise<SugestaoAutomacao> {
  if (!texto.trim()) return sugerirLocal("");
  if (!aiConfigured()) return sugerirLocal(texto);
  try {
    return await sugerirComClaude(texto);
  } catch {
    return sugerirLocal(texto);
  }
}
