// Planos e preços (calibrados para o valuation R$50k). Fonte única de verdade
// usada pela página de planos, pelo checkout e pela landing.

export type PlanId = "STARTER" | "PRO" | "ENTERPRISE";

export type Plan = {
  id: PlanId;
  nome: string;
  priceCents: number; // mensal, em centavos
  destaque?: boolean;
  resumo: string;
  limites: { usuarios: number; orcamentos: number; ia: boolean; automacoes: boolean };
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "STARTER",
    nome: "Starter",
    priceCents: 14900,
    resumo: "Para começar a organizar o comercial.",
    limites: { usuarios: 2, orcamentos: 50, ia: false, automacoes: false },
    features: [
      "2 usuários",
      "50 orçamentos/mês",
      "CRM, Clientes e Financeiro",
      "Suporte por e-mail",
    ],
  },
  {
    id: "PRO",
    nome: "Professional",
    priceCents: 44900,
    destaque: true,
    resumo: "O plano completo para PMEs de engenharia.",
    limites: { usuarios: 8, orcamentos: 999999, ia: true, automacoes: true },
    features: [
      "8 usuários",
      "Orçamentos ilimitados",
      "IA comercial + automações (FlowEngine)",
      "Obras, Agenda e Engenharia",
      "Suporte prioritário",
    ],
  },
  {
    id: "ENTERPRISE",
    nome: "Enterprise",
    priceCents: 149900,
    resumo: "Para operações grandes e múltiplas unidades.",
    limites: { usuarios: 999999, orcamentos: 999999, ia: true, automacoes: true },
    features: [
      "Usuários ilimitados",
      "SSO/SAML + white-label",
      "SLA 99,5%",
      "Onboarding e migração dedicados",
    ],
  },
];

export function planById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function formatBRLFromCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
