// Formatadores PT-BR (espelham money/moneyFull/dateBR do index.html).

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const BRL_FULL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function money(v: number): string {
  if (v >= 1000) return "R$ " + (v / 1000).toFixed(1).replace(".", ",") + "k";
  return BRL.format(v);
}

export function moneyFull(v: number): string {
  return BRL_FULL.format(v);
}

export function dateBR(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y.slice(2)}`;
}

export function scoreBadgeColor(score: number): string {
  if (score >= 75) return "var(--stage-aprovado)";
  if (score >= 50) return "var(--stage-negociacao)";
  return "var(--muted)";
}
