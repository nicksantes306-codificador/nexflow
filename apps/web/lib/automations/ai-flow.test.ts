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

  it("reconhece gatilhos de tempo e extrai os dias", () => {
    const s1 = sugerirLocal("quando uma proposta ficar 5 dias sem resposta, criar tarefa de follow-up");
    expect(s1.gatilho).toBe("budget_stale");
    expect(s1.gatilhoValor).toBe("5");

    const s2 = sugerirLocal("me avise quando um negócio ficar parado 10 dias");
    expect(s2.gatilho).toBe("lead_stale");
    expect(s2.gatilhoValor).toBe("10");

    const s3 = sugerirLocal("quando uma fatura estiver vencida, criar tarefa de cobrança");
    expect(s3.gatilho).toBe("finance_overdue");
    expect(s3.gatilhoValor).toBeNull();

    const s4 = sugerirLocal("alertar quando a obra estiver a 7 dias do prazo final");
    expect(s4.gatilho).toBe("project_deadline");
    expect(s4.gatilhoValor).toBe("7");
  });
});
