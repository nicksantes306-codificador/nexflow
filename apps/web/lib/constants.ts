// Estágios do CRM Kanban — espelham ESTAGIOS / ESTAGIO_COR do index.html.
export const ESTAGIOS = [
  "Novo Lead",
  "Em contato",
  "Orçamento enviado",
  "Negociação",
  "Proposta",
] as const;

export type Estagio = (typeof ESTAGIOS)[number];

// 'Aprovado' e 'Perdido' são status terminais (fora do board principal).
export const TODOS_STATUS = [...ESTAGIOS, "Aprovado", "Perdido"] as const;
export type StatusLead = (typeof TODOS_STATUS)[number];

export const ESTAGIO_COR: Record<string, string> = {
  "Novo Lead": "var(--stage-novo)",
  "Em contato": "var(--stage-contato)",
  "Orçamento enviado": "var(--stage-orcamento)",
  Negociação: "var(--stage-negociacao)",
  Proposta: "var(--stage-proposta)",
  Aprovado: "var(--stage-aprovado)",
  Perdido: "var(--stage-perdido)",
};
