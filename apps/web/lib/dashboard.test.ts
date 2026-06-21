import { describe, it, expect } from "vitest";
import { montarDash } from "./dashboard";
import type { Lead, Project, FinanceEntry } from "./types";

const L = (p: Partial<Lead>): Lead => p as unknown as Lead;
const P = (p: Partial<Project>): Project => p as unknown as Project;
const F = (p: Partial<FinanceEntry>): FinanceEntry => p as unknown as FinanceEntry;

const now = new Date(2026, 5, 15); // 15/jun/2026

describe("montarDash", () => {
  it("cai para demonstração quando tudo está vazio", () => {
    const d = montarDash({ leads: [], projects: [], finance: [], clientesNome: {}, now });
    expect(d.demo).toBe(true);
    expect(d.receitaAcum).toBe(4_820_000);
    expect(d.obras).toHaveLength(4);
    expect(d.funil[0].label).toBe("Novo Lead");
    expect(d.rev.real.length).toBe(12);
  });

  it("calcula comercial a partir dos leads reais", () => {
    const leads = [
      L({ status: "Aprovado", valor: 100_000 }),
      L({ status: "Negociação", valor: 50_000 }),
    ];
    const d = montarDash({ leads, projects: [], finance: [], clientesNome: {}, now });
    expect(d.demo).toBe(false);
    expect(d.conversao).toBe(50); // 1 ganho de 2 leads
    expect(d.pipelineValor).toBe(50_000); // Negociação está no pipeline
    expect(d.oportunidades).toBe(1);
    const neg = d.funil.find((f) => f.label === "Negociação");
    expect(neg?.count).toBe(1);
  });

  it("calcula receita e delta mensal do financeiro", () => {
    const finance = [
      F({ tipo: "Entrada", status: "Recebido", valor: 30_000, data: "2026-06-10" }),
      F({ tipo: "Entrada", status: "Recebido", valor: 20_000, data: "2026-05-10" }),
      F({ tipo: "Entrada", status: "Pendente", valor: 99_000, data: "2026-06-20" }),
    ];
    const d = montarDash({ leads: [], projects: [], finance, clientesNome: {}, now });
    expect(d.receitaAcum).toBe(50_000); // só recebidos
    expect(d.receitaMes).toBe(30_000); // junho
    expect(d.receitaMesDeltaPct).toBe(50); // 30k vs 20k
    expect(d.rev.real[5]).toBe(30_000); // índice 5 = junho
    expect(d.rev.real[4]).toBe(20_000);
    expect(d.rev.previsao).toBeGreaterThan(0);
    // alerta de recebível em aberto deve aparecer
    expect(d.alertas.some((a) => a.txt.includes("A receber"))).toBe(true);
  });

  it("monta obras e responsáveis a partir dos projetos", () => {
    const projects = [
      P({ nome: "Subestação Gerdau", status: "Em andamento", valor: 200_000, progresso: 80, responsavel: "Carlos M.", client_id: "c1" }),
      P({ nome: "Galpão velho", status: "Concluído", valor: 10_000, progresso: 100, responsavel: "Ana P.", client_id: "c2" }),
    ];
    const d = montarDash({ leads: [], projects, finance: [], clientesNome: { c1: "Gerdau", c2: "WEG" }, now });
    expect(d.obrasAtivas).toBe(1); // concluída não conta
    expect(d.obras[0].pc).toBe(80);
    expect(d.obras[0].cli).toContain("Gerdau");
    expect(d.responsaveis[0].av).toBe("CM");
    expect(d.responsaveis[0].st).toBe("field");
  });
});
