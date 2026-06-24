// Cálculo do Console Executivo — lógica pura (testável sem React/Supabase).
// Recebe linhas já filtradas por RLS (tenant logado) e devolve tudo pronto
// para o dashboard renderizar. Cada seção cai para dados de demonstração só
// quando a tabela correspondente está vazia, para a tela nunca nascer vazia.

import type { Lead, Project, FinanceEntry } from "./types";
import { ESTAGIOS } from "./constants";
import { moneyFull } from "./format";

export type Obra = { nome: string; cli: string; pc: number; cls: "" | "hi" | "lo" };
export type Responsavel = {
  av: string;
  nome: string;
  obra: string;
  st: "field" | "move" | "idle";
  lbl: string;
};
export type Alerta = { cls: "bad" | "warn" | "info"; txt: string; meta: string };
export type RevSerie = {
  labels: string[];
  real: (number | null)[];
  proj: (number | null)[];
  previsao: number;
};
export type FunilEtapa = { label: string; count: number; valor: number };

export type DashData = {
  demo: boolean;
  receitaAcum: number;
  receitaMes: number;
  receitaMesDeltaPct: number;
  pipelineValor: number;
  oportunidades: number;
  conversao: number;
  obrasAtivas: number;
  funil: FunilEtapa[];
  obras: Obra[];
  obrasCriticas: number;
  responsaveis: Responsavel[];
  alertas: Alerta[];
  rev: RevSerie;
};

export type DashInput = {
  leads: Lead[];
  projects: Project[];
  finance: FinanceEntry[];
  clientesNome: Record<string, string>;
  now?: Date;
  desde?: Date | null;
};

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const ATIVA = (p: Project) => p.status !== "Concluído";

function iniciais(nome: string): string {
  const ps = nome.trim().split(/\s+/).filter(Boolean);
  if (ps.length === 0) return "EQ";
  if (ps.length === 1) return ps[0].slice(0, 2).toUpperCase();
  return (ps[0][0] + ps[ps.length - 1][0]).toUpperCase();
}

function statusEquipe(status: string): { st: Responsavel["st"]; lbl: string } {
  if (status === "Em andamento") return { st: "field", lbl: "Em campo" };
  if (status === "Aguardando material") return { st: "move", lbl: "Aguard. material" };
  if (status === "Pausado") return { st: "idle", lbl: "Pausado" };
  return { st: "idle", lbl: status };
}

function serieReceita(finance: FinanceEntry[], now: Date): RevSerie | null {
  const ano = now.getFullYear();
  const real: (number | null)[] = Array(12).fill(null);
  let tem = false;
  for (const e of finance) {
    if (e.tipo !== "Entrada" || e.status !== "Recebido" || !e.data) continue;
    const d = new Date(String(e.data) + "T00:00:00");
    if (d.getFullYear() !== ano) continue;
    const m = d.getMonth();
    real[m] = (real[m] ?? 0) + Number(e.valor || 0);
    tem = true;
  }
  if (!tem) return null;

  const mesAtual = now.getMonth();
  for (let i = 0; i <= mesAtual; i++) if (real[i] == null) real[i] = 0;
  for (let i = mesAtual + 1; i < 12; i++) real[i] = null;

  const realizado = real.slice(0, mesAtual + 1) as number[];
  const ult3 = realizado.slice(-3);
  const base = ult3.length ? ult3.reduce((a, b) => a + b, 0) / ult3.length : 0;
  const proj: (number | null)[] = Array(12).fill(null);
  proj[mesAtual] = real[mesAtual];
  for (let i = mesAtual + 1; i < 12; i++) proj[i] = Math.round(base * Math.pow(1.05, i - mesAtual));

  const previsao =
    realizado.reduce((a, b) => a + b, 0) +
    proj.slice(mesAtual + 1).reduce((a: number, b) => a + (b ?? 0), 0);

  return { labels: MESES, real, proj, previsao };
}

/* ---------- dados de demonstração (fallback por seção) ---------- */
const DEMO_REV: RevSerie = {
  labels: MESES,
  real: [285e3, 330e3, 355e3, 402e3, 438e3, 496e3, 540e3, 575e3, 612e3, null, null, null],
  proj: [null, null, null, null, null, null, null, null, 612e3, 640e3, 672e3, 705e3],
  previsao: 6_900_000,
};
const DEMO_OBRAS: Obra[] = [
  { nome: "Subestação 13,8 kV", cli: "Gerdau S.A. · Equipe Alpha", pc: 78, cls: "" },
  { nome: "Retrofit painéis CCM", cli: "Tupy S.A. · Equipe Bravo", pc: 45, cls: "lo" },
  { nome: "SPDA + aterramento", cli: "Iochpe-Maxion · Equipe Delta", pc: 92, cls: "hi" },
  { nome: "Automação Linha 2", cli: "Romi S.A. · Equipe Charlie", pc: 30, cls: "lo" },
];
const DEMO_RESP: Responsavel[] = [
  { av: "EA", nome: "Equipe Alpha", obra: "Subestação · Gerdau", st: "field", lbl: "Em campo" },
  { av: "EB", nome: "Equipe Bravo", obra: "Retrofit · Tupy", st: "field", lbl: "Em campo" },
  { av: "ED", nome: "Equipe Delta", obra: "SPDA · Iochpe", st: "move", lbl: "Deslocamento" },
  { av: "EC", nome: "Equipe Charlie", obra: "Automação · Romi", st: "idle", lbl: "Standby" },
];
const DEMO_ALERTAS: Alerta[] = [
  { cls: "bad", txt: "Medição da obra SUB-13 (Gerdau) vence em 2 dias", meta: "Financeiro" },
  { cls: "warn", txt: "Equipe Charlie sem apontamento há 3 h", meta: "Operações" },
  { cls: "info", txt: "Contrato WEG #2024-087 renova em 15 dias", meta: "Contratos" },
  { cls: "warn", txt: "Orçamento Embraer aguardando aprovação há 5 dias", meta: "Comercial" },
];
const DEMO_FUNIL: FunilEtapa[] = [
  { label: "Novo Lead", count: 42, valor: 3_800_000 },
  { label: "Em contato", count: 28, valor: 2_900_000 },
  { label: "Orçamento enviado", count: 19, valor: 2_300_000 },
  { label: "Negociação", count: 14, valor: 1_900_000 },
  { label: "Proposta", count: 9, valor: 1_400_000 },
];

export function montarDash(input: DashInput): DashData {
  const { leads: leadsAll, projects, finance, clientesNome } = input;
  const now = input.now ?? new Date();
  const vazio = leadsAll.length === 0 && projects.length === 0 && finance.length === 0;

  // Escalas do painel (hoje/semana/mês/trimestre/ano). Sem desde = tudo.
  const desdeISO = input.desde ? input.desde.toISOString().slice(0, 10) : null;
  const leads = desdeISO ? leadsAll.filter((l) => l.ultimo != null && String(l.ultimo) >= desdeISO) : leadsAll;
  const noPeriodo = (data: string | null) => !desdeISO || (data != null && String(data) >= desdeISO);

  /* ----- comercial (leads, já no período) ----- */
  const emPipeline = leads.filter((l) => ESTAGIOS.includes(l.status as (typeof ESTAGIOS)[number]));
  const ganhos = leads.filter((l) => l.status === "Aprovado");
  const pipelineValor = emPipeline.reduce((a, l) => a + Number(l.valor || 0), 0);
  const conversao = leads.length ? Math.round((ganhos.length / leads.length) * 100) : 0;
  const funilReal = ESTAGIOS.map((stage) => {
    const itens = leads.filter((l) => l.status === stage);
    return { label: stage, count: itens.length, valor: itens.reduce((a, l) => a + Number(l.valor || 0), 0) };
  });

  /* ----- financeiro (recebido respeita o período) ----- */
  const recebido = finance
    .filter((e) => e.tipo === "Entrada" && e.status === "Recebido" && noPeriodo(e.data))
    .reduce((a, e) => a + Number(e.valor || 0), 0);
  const mesRecebido = (offset: number) => {
    const ref = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return finance
      .filter((e) => {
        if (e.tipo !== "Entrada" || e.status !== "Recebido" || !e.data) return false;
        const d = new Date(String(e.data) + "T00:00:00");
        return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
      })
      .reduce((a, e) => a + Number(e.valor || 0), 0);
  };
  const receitaMes = mesRecebido(0);
  const mesAnterior = mesRecebido(1);
  const receitaMesDeltaPct =
    mesAnterior > 0 ? Math.round(((receitaMes - mesAnterior) / mesAnterior) * 100) : 0;
  const revReal = serieReceita(finance, now);

  /* ----- obras ----- */
  const ativas = projects.filter(ATIVA);
  const obrasReais: Obra[] = [...ativas]
    .sort((a, b) => Number(b.valor || 0) - Number(a.valor || 0))
    .slice(0, 4)
    .map((p) => {
      const pc = Math.max(0, Math.min(100, Math.round(Number(p.progresso || 0))));
      const cliNome = p.client_id ? clientesNome[p.client_id] : "";
      const sub = [cliNome, p.responsavel].filter(Boolean).join(" · ");
      return { nome: p.nome, cli: sub || "—", pc, cls: pc >= 85 ? "hi" : pc < 50 ? "lo" : "" };
    });
  const obrasCriticas = ativas.filter(
    (p) => Number(p.progresso || 0) < 50 || p.status === "Pausado" || p.status === "Aguardando material",
  ).length;

  /* ----- responsáveis em campo (a partir das obras ativas) ----- */
  const vistos = new Set<string>();
  const respReais: Responsavel[] = [];
  for (const p of ativas) {
    const nome = (p.responsavel || "").trim();
    if (!nome || vistos.has(nome)) continue;
    vistos.add(nome);
    const cliNome = p.client_id ? clientesNome[p.client_id] : "";
    const { st, lbl } = statusEquipe(p.status);
    respReais.push({
      av: iniciais(nome),
      nome,
      obra: [p.nome.split(" ").slice(0, 2).join(" "), cliNome].filter(Boolean).join(" · "),
      st,
      lbl,
    });
    if (respReais.length >= 4) break;
  }

  /* ----- alertas operacionais (derivados) ----- */
  const alertas: Alerta[] = [];
  for (const e of finance.filter((e) => e.tipo === "Entrada" && e.status === "Atrasado").slice(0, 2))
    alertas.push({ cls: "bad", txt: `Recebível atrasado: ${e.descricao} (${moneyFull(Number(e.valor || 0))})`, meta: "Financeiro" });
  for (const p of ativas.filter((p) => p.status === "Pausado").slice(0, 1))
    alertas.push({ cls: "warn", txt: `Obra pausada: ${p.nome}`, meta: "Obras" });
  for (const p of ativas.filter((p) => p.status === "Aguardando material").slice(0, 1))
    alertas.push({ cls: "info", txt: `Aguardando material: ${p.nome}`, meta: "Obras" });
  for (const e of finance.filter((e) => e.tipo === "Entrada" && e.status === "Pendente").slice(0, 1))
    alertas.push({ cls: "warn", txt: `A receber em aberto: ${e.descricao}`, meta: "Financeiro" });

  return {
    demo: vazio,
    receitaAcum: vazio ? 4_820_000 : recebido,
    receitaMes: vazio ? 612_000 : receitaMes,
    receitaMesDeltaPct: vazio ? 6 : receitaMesDeltaPct,
    pipelineValor: vazio ? 2_100_000 : pipelineValor,
    oportunidades: vazio ? 38 : emPipeline.length,
    conversao: vazio ? 32 : conversao,
    obrasAtivas: vazio ? 14 : ativas.length,
    funil: vazio ? DEMO_FUNIL : funilReal,
    obras: obrasReais.length ? obrasReais : vazio ? DEMO_OBRAS : obrasReais,
    obrasCriticas: vazio ? 4 : obrasCriticas,
    responsaveis: respReais.length ? respReais : vazio ? DEMO_RESP : respReais,
    alertas: alertas.length ? alertas.slice(0, 4) : vazio ? DEMO_ALERTAS : alertas,
    rev: revReal ?? DEMO_REV,
  };
}
