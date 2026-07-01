import { describe, it, expect } from "vitest";
import { sugerirLocal } from "./ai-flow";

describe("sugerirLocal", () => {
  it("reconhece orçamento aprovado + criar tarefa", () => {
    const s = sugerirLocal("Quando um orçamento for aprovado, crie uma tarefa para o financeiro");
    expect(s.gatilho).toBe("budget_approved");
    expect(s.acao).toBe("create_task");
  });

  it("reconhece negócio ganho", () => {
    const s = sugerirLocal("quando o negócio for ganho, gerar um lançamento financeiro");
    expect(s.gatilho).toBe("lead_won");
    expect(s.acao).toBe("create_finance");
  });

  it("reconhece estoque baixo", () => {
    const s = sugerirLocal("me avise quando um produto ficar com estoque baixo");
    expect(s.gatilho).toBe("product_low_stock");
    expect(s.acao).toBe("create_task");
  });

  it("extrai condição de valor (acima de)", () => {
    const s = sugerirLocal("quando um negócio for ganho acima de R$ 50.000, criar uma tarefa");
    expect(s.condicao).toEqual({ operador: ">", valor: 50000 });
  });

  it("extrai condição de valor (abaixo de)", () => {
    const s = sugerirLocal("negócio perdido abaixo de 1000");
    expect(s.condicao).toEqual({ operador: "<", valor: 1000 });
  });

  it("sem palavras-chave reconhecidas, cai no padrão seguro", () => {
    const s = sugerirLocal("blablabla texto qualquer sem sentido");
    expect(s.gatilho).toBe("lead_created");
    expect(s.acao).toBe("create_task");
    expect(s.condicao).toBeNull();
  });

  it("texto vazio não quebra", () => {
    const s = sugerirLocal("");
    expect(s.nome).toBe("Nova automação");
  });
});
