// Cálculo do Console Executivo — lógica pura (testável sem React/Supabase).
// Recebe linhas já filtradas por RLS (tenant logado) e devolve tudo pronto
// para o dashboard renderizar. NUNCA inventa dados: quando a empresa ainda
// não cadastrou nada (ou apagou tudo), os números voltam a zero de verdade —
// `demo` só sinaliza pra UI mostrar um convite pra começar a cadastrar.

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
  // Opcionais: alimentam os lembretes automáticos (avisos).
  tasks?: { titulo: string; prazo: string | null; done: boolean }[];
  budgets?: { titulo: string; status: string; validade: string | null }[];
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

const REV_VAZIA: RevSerie = { labels: MESES, real: Array(12).fill(null), proj: Array(12).fill(null), previsao: 0 };

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

  /* ----- alertas / lembretes automáticos (derivados dos dados) ----- */
  const tasks = input.tasks ?? [];
  const budgets = input.budgets ?? [];
  const pad = (n: number) => String(n).padStart(2, "0");
  const localISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const hojeISO = localISO(now);
  const em7ISO = localISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7));

  const alertas: Alerta[] = [];
  // Recebíveis atrasados
  for (const e of finance.filter((e) => e.tipo === "Entrada" && e.status === "Atrasado").slice(0, 2))
    alertas.push({ cls: "bad", txt: `Conta a receber atrasada: ${e.descricao} (${moneyFull(Number(e.valor || 0))})`, meta: "Financeiro" });
  // Tarefas vencidas
  for (const t of tasks.filter((t) => !t.done && t.prazo != null && String(t.prazo) < hojeISO).slice(0, 2))
    alertas.push({ cls: "bad", txt: `Tarefa vencida: ${t.titulo}`, meta: "Tarefas" });
  // Tarefas vencendo nos próximos 7 dias
  for (const t of tasks.filter((t) => !t.done && t.prazo != null && String(t.prazo) >= hojeISO && String(t.prazo) <= em7ISO).slice(0, 2))
    alertas.push({ cls: "warn", txt: `Tarefa a vencer: ${t.titulo}`, meta: "Tarefas" });
  // Orçamentos perto do vencimento (ainda sem decisão)
  for (const b of budgets.filter((b) => b.validade != null && String(b.validade) >= hojeISO && String(b.validade) <= em7ISO && b.status !== "aprovado" && b.status !== "recusado").slice(0, 1))
    alertas.push({ cls: "warn", txt: `Orçamento vence em breve: ${b.titulo}`, meta: "Comercial" });
  // Orçamentos enviados que venceram sem resposta
  for (const b of budgets.filter((b) => b.validade != null && String(b.validade) < hojeISO && b.status === "enviado").slice(0, 1))
    alertas.push({ cls: "info", txt: `Orçamento venceu sem resposta: ${b.titulo}`, meta: "Comercial" });
  // Obras paradas / aguardando material
  for (const p of ativas.filter((p) => p.status === "Pausado").slice(0, 1))
    alertas.push({ cls: "warn", txt: `Obra pausada: ${p.nome}`, meta: "Obras" });
  for (const p of ativas.filter((p) => p.status === "Aguardando material").slice(0, 1))
    alertas.push({ cls: "info", txt: `Aguardando material: ${p.nome}`, meta: "Obras" });
  // Contas a receber em aberto
  for (const e of finance.filter((e) => e.tipo === "Entrada" && e.status === "Pendente").slice(0, 1))
    alertas.push({ cls: "info", txt: `Conta a receber em aberto: ${e.descricao}`, meta: "Financeiro" });

  // Mais urgentes primeiro (vermelho > amarelo > azul)
  const sev: Record<Alerta["cls"], number> = { bad: 0, warn: 1, info: 2 };
  alertas.sort((a, b) => sev[a.cls] - sev[b.cls]);

  return {
    demo: vazio,
    receitaAcum: recebido,
    receitaMes,
    receitaMesDeltaPct,
    pipelineValor,
    oportunidades: emPipeline.length,
    conversao,
    obrasAtivas: ativas.length,
    funil: funilReal,
    obras: obrasReais,
    obrasCriticas,
    responsaveis: respReais,
    alertas: alertas.slice(0, 4),
    rev: revReal ?? REV_VAZIA,
  };
}
