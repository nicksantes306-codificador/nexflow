import { describe, it, expect } from "vitest";
import { interp, filtrarRegras, condicaoPassa } from "./engine";

describe("interp", () => {
  it("substitui {cliente} e {empresa}", () => {
    expect(interp("Follow-up: {cliente}", { cliente: "Gerdau" })).toBe("Follow-up: Gerdau");
    expect(interp("Contato {empresa}", { empresa: "WEG SA" })).toBe("Contato WEG SA");
  });
  it("tolera contexto vazio", () => {
    expect(interp("Tarefa {cliente}", {})).toBe("Tarefa");
  });
});

describe("filtrarRegras", () => {
  const regras = [
    { gatilho: "lead_created", gatilho_valor: null, ativo: true },
    { gatilho: "lead_stage", gatilho_valor: "Proposta", ativo: true },
    { gatilho: "lead_stage", gatilho_valor: "Aprovado", ativo: true },
    { gatilho: "lead_created", gatilho_valor: null, ativo: false },
  ];

  it("casa por gatilho e estágio, só ativas", () => {
    expect(filtrarRegras(regras, "lead_created", null)).toHaveLength(1);
    expect(filtrarRegras(regras, "lead_stage", "Proposta")).toHaveLength(1);
    expect(filtrarRegras(regras, "lead_stage", "Aprovado")[0].gatilho_valor).toBe("Aprovado");
    expect(filtrarRegras(regras, "lead_stage", "Negociação")).toHaveLength(0);
  });
});

describe("condicaoPassa", () => {
  it("sem condição, sempre passa", () => {
    expect(condicaoPassa(null, { valor: 10 })).toBe(true);
    expect(condicaoPassa(undefined, {})).toBe(true);
  });
  it("compara valor >= corretamente", () => {
    expect(condicaoPassa({ campo: "valor", operador: ">=", valor: 50000 }, { valor: 60000 })).toBe(true);
    expect(condicaoPassa({ campo: "valor", operador: ">=", valor: 50000 }, { valor: 40000 })).toBe(false);
  });
  it("compara valor < corretamente", () => {
    expect(condicaoPassa({ campo: "valor", operador: "<", valor: 1000 }, { valor: 500 })).toBe(true);
    expect(condicaoPassa({ campo: "valor", operador: "<", valor: 1000 }, { valor: 1000 })).toBe(false);
  });
  it("condição mal formada não bloqueia", () => {
    expect(condicaoPassa({ campo: "status" }, { valor: 10 })).toBe(true);
    expect(condicaoPassa("texto qualquer", { valor: 10 })).toBe(true);
  });
});
