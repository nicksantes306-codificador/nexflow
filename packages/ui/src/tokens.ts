// Design tokens do NEXFLOW — fonte para Style Dictionary / Tailwind @theme.
// Hoje refletidos em apps/web/app/globals.css; centralizados aqui para o
// Sprint 4 (consumo por apps/web e apps/marketing) e futura geração shadcn/ui.

export const brand = {
  50: "#fff3ed",
  100: "#ffe2d2",
  200: "#ffc0a5",
  300: "#ff9569",
  400: "#fb6a3c",
  500: "#ee4a1f",
  600: "#cc3600", // marca
  700: "#a82c05",
  800: "#87260b",
  900: "#6f220c",
  950: "#3c0e03",
} as const;

export const navy = {
  700: "#1e293b",
  800: "#172033",
  900: "#0f172a", // fundo admin
  950: "#0a0f1d",
} as const;

export const stageColors = {
  novo: "#64748b",
  contato: "#0d9488",
  orcamento: "#cc3600",
  negociacao: "#d97706",
  proposta: "#7c3aed",
  aprovado: "#059669",
  perdido: "#dc2626",
} as const;

export const radius = { sm: "0.5rem", card: "0.75rem", lg: "1rem" } as const;
