import { describe, it, expect } from "vitest";
import { hojeLocalISO, diasAte, diasDe } from "./sweep";

describe("helpers de data da varredura", () => {
  it("hojeLocalISO usa a data local, não UTC", () => {
    expect(hojeLocalISO(new Date(2026, 6, 1, 23, 30))).toBe("2026-07-01");
    expect(hojeLocalISO(new Date(2026, 0, 5, 0, 10))).toBe("2026-01-05");
  });

  it("diasAte: futuro positivo, passado negativo, hoje zero", () => {
    expect(diasAte("2026-07-01", "2026-07-08")).toBe(7);
    expect(diasAte("2026-07-01", "2026-06-26")).toBe(-5);
    expect(diasAte("2026-07-01", "2026-07-01")).toBe(0);
  });

  it("diasAte atravessa mês e ano corretamente", () => {
    expect(diasAte("2026-12-30", "2027-01-02")).toBe(3);
    expect(diasAte("2026-02-27", "2026-03-01")).toBe(2); // 2026 não é bissexto
  });

  it("diasDe lê o nº de dias da regra, com padrão de fallback", () => {
    expect(diasDe({ gatilho_valor: "10" }, 7)).toBe(10);
    expect(diasDe({ gatilho_valor: null }, 7)).toBe(7);
    expect(diasDe({ gatilho_valor: "abc" }, 5)).toBe(5);
    expect(diasDe({ gatilho_valor: "0" }, 5)).toBe(5);
  });
});
