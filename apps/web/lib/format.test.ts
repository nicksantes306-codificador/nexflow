import { describe, it, expect } from "vitest";
import { money, moneyFull, dateBR, scoreBadgeColor } from "./format";

describe("formatadores PT-BR", () => {
  it("money abrevia milhares com k", () => {
    expect(money(24584)).toContain("k");
    expect(money(900)).toContain("R$");
  });

  it("moneyFull usa formato BRL completo", () => {
    const out = moneyFull(1234.5);
    expect(out).toContain("R$");
    expect(out).toContain("1.234,50");
  });

  it("dateBR converte ISO para dd/mm/aa e trata nulo", () => {
    expect(dateBR("2026-05-05")).toBe("05/05/26");
    expect(dateBR(null)).toBe("—");
  });

  it("scoreBadgeColor reflete faixas de score", () => {
    expect(scoreBadgeColor(90)).toContain("aprovado");
    expect(scoreBadgeColor(60)).toContain("negociacao");
    expect(scoreBadgeColor(20)).toContain("muted");
  });
});
