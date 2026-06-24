import { describe, it, expect } from "vitest";
import { nexflowLocalAI } from "./nexflow-ai";
import type { DashData } from "../dashboard";

const d: DashData = {
  demo: false,
  receitaAcum: 2_306_000,
  receitaMes: 496_000,
  receitaMesDeltaPct: 13,
  pipelineValor: 850_000,
  oportunidades: 33,
  conversao: 20,
  obrasAtivas: 5,
  funil: [
    { label: "Novo Lead", count: 12, valor: 95_000 },
    { label: "Proposta", count: 3, valor: 160_000 },
  ],
  obras: [{ nome: "Automação Linha 2", cli: "Romi · João", pc: 30, cls: "lo" }],
  obrasCriticas: 2,
  responsaveis: [],
  alertas: [{ cls: "bad", txt: "Recebível atrasado: Medição Romi", meta: "Financeiro" }],
  rev: { labels: [], real: [], proj: [], previsao: 0 },
};

describe("nexflowLocalAI", () => {
  it("responde sobre pipeline com números reais", () => {
    const r = nexflowLocalAI("resumir meu pipeline", d);
    expect(r).toContain("negócios em aberto");
    expect(r).toContain("850 mil");
  });

  it("responde sobre financeiro com receita formatada", () => {
    const r = nexflowLocalAI("como está o financeiro?", d);
    expect(r).toContain("2,31 mi");
    expect(r).toContain("496 mil");
  });

  it("responde sobre obras e cita as críticas", () => {
    const r = nexflowLocalAI("riscos das obras", d);
    expect(r).toContain("precisam de atenção");
    expect(r).toContain("Automação Linha 2");
  });

  it("responde sobre conversão", () => {
    const r = nexflowLocalAI("qual a taxa de conversão?", d);
    expect(r).toContain("20%");
  });

  it("dá um resumo no fallback / saudação", () => {
    const r = nexflowLocalAI("olá", d);
    expect(r).toContain("Resumo da empresa");
  });
});
