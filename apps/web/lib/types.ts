import type { Tables, TablesInsert } from "@nexflow/db";
import type { StatusLead } from "./constants";

// Tipos de domínio derivados do schema (@nexflow/db) — fonte única, sem drift.
// `status` do lead é estreitado para a união de estágios (o schema gera string
// por causa do CHECK; aqui ganhamos ergonomia no app).
export type Lead = Omit<Tables<"leads">, "status"> & { status: StatusLead };
export type Client = Tables<"clients">;
export type Budget = Tables<"budgets">;
export type BudgetItem = Tables<"budget_items">;
export type FinanceEntry = Tables<"finance_entries">;
export type Project = Tables<"projects">;

export type LeadInsert = TablesInsert<"leads">;
export type ClientInsert = TablesInsert<"clients">;
export type FinanceInsert = TablesInsert<"finance_entries">;
