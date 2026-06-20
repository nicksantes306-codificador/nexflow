import { describe, it, expect } from "vitest";
import { computeScore, nextBestAction, FlowEngine, accessLevel } from "./index";

describe("computeScore", () => {
  it("garante score base mínimo para lead novo sem valor", () => {
    expect(computeScore({ valor: 0, status: "Novo Lead" })).toBeGreaterThanOrEqual(30);
  });

  it("pondera valor alto + estágio avançado", () => {
    const s = computeScore({ valor: 80000, status: "Proposta" });
    expect(s).toBeGreaterThan(80);
  });

  it("nunca passa de 100 nem fica negativo", () => {
    expect(computeScore({ valor: 999999, status: "Aprovado" })).toBeLessThanOrEqual(100);
    expect(computeScore({ valor: -10, status: "desconhecido" })).toBeGreaterThanOrEqual(0);
  });
});

describe("nextBestAction", () => {
  it("sugere primeiro contato para lead novo", () => {
    expect(nextBestAction({ valor: 0, status: "Novo Lead" })).toMatch(/contato/i);
  });
  it("sugere abrir obra quando aprovado", () => {
    expect(nextBestAction({ valor: 0, status: "Aprovado" })).toMatch(/obra|ART/i);
  });
});

describe("accessLevel", () => {
  const now = new Date("2026-06-17T12:00:00Z");
  it("ativa/trial liberam uso total", () => {
    expect(accessLevel("active", null, now)).toBe("full");
    expect(accessLevel("trialing", null, now)).toBe("full");
  });
  it("past_due dentro do grace mantém full; após o grace vira readonly", () => {
    expect(accessLevel("past_due", "2026-06-20", now)).toBe("full");
    expect(accessLevel("past_due", "2026-06-10", now)).toBe("readonly");
  });
  it("suspensa = readonly; cancelada = blocked", () => {
    expect(accessLevel("suspended", null, now)).toBe("readonly");
    expect(accessLevel("canceled", null, now)).toBe("blocked");
  });
});

describe("FlowEngine", () => {
  it("registra handler, dispara e permite desinscrever", () => {
    const fe = new FlowEngine();
    let chamado = 0;
    const off = fe.on("lead_created", () => chamado++);
    expect(fe.trigger("lead_created")).toBe(1);
    expect(chamado).toBe(1);
    off();
    expect(fe.trigger("lead_created")).toBe(0);
    expect(chamado).toBe(1);
  });
});
