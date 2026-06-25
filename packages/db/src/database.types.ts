// ============================================================================
// @nexflow/db — tipos do schema Supabase.
// ----------------------------------------------------------------------------
// Escrito à mão espelhando supabase/migrations/0001_init.sql, no MESMO formato
// que `supabase gen types typescript` produz (tipos de tabela standalone, sem
// auto-referência) — para o client tipado resolver Insert/Update corretamente.
// No Sprint 2, com o Supabase local de pé, é regenerado por:
//   pnpm --filter @nexflow/db gen
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Role = "Admin" | "Gerente" | "Vendedor" | "Tecnico" | "Visualizador";
type Plan = "DEMO" | "STARTER" | "PRO" | "ENTERPRISE";
type SubStatus = "trialing" | "active" | "past_due" | "canceled" | "suspended";
type InvoiceStatus = "pending" | "paid" | "failed" | "refunded" | "canceled";
type BudgetStatus = "rascunho" | "enviado" | "aprovado" | "recusado" | "expirado";
type FinTipo = "Entrada" | "Saída";
type FinStatus = "Pendente" | "Pago" | "Recebido" | "Atrasado" | "Cancelado";

// ── tenants ──
type TenantsRow = { id: string; name: string; cnpj: string | null; plan: Plan; nome_fantasia: string | null; situacao: string | null; abertura: string | null; cnae: string | null; natureza_juridica: string | null; porte: string | null; capital_social: number | null; endereco: string | null; telefone: string | null; email: string | null; dados: Json | null; created_at: string; updated_at: string };
type TenantsInsert = { id?: string; name: string; cnpj?: string | null; plan?: Plan; nome_fantasia?: string | null; situacao?: string | null; abertura?: string | null; cnae?: string | null; natureza_juridica?: string | null; porte?: string | null; capital_social?: number | null; endereco?: string | null; telefone?: string | null; email?: string | null; dados?: Json | null; created_at?: string; updated_at?: string };

// ── profiles ──
type ProfilesRow = { id: string; full_name: string | null; email: string | null; avatar_url: string | null; created_at: string; updated_at: string };
type ProfilesInsert = { id: string; full_name?: string | null; email?: string | null; avatar_url?: string | null; created_at?: string; updated_at?: string };

// ── memberships ──
type MembershipsRow = { id: string; tenant_id: string; user_id: string; role: Role; email: string | null; created_at: string };
type MembershipsInsert = { id?: string; tenant_id: string; user_id: string; role?: Role; email?: string | null; created_at?: string };

// ── invites ──
type InvitesRow = { id: string; tenant_id: string; email: string; role: Role; used_at: string | null; created_at: string };
type InvitesInsert = { id?: string; tenant_id: string; email: string; role?: Role; used_at?: string | null; created_at?: string };

// ── documents ──
type DocumentsRow = { id: string; tenant_id: string; client_id: string | null; nome: string; path: string; mime: string | null; tamanho: number | null; created_at: string };
type DocumentsInsert = { id?: string; tenant_id: string; client_id?: string | null; nome: string; path: string; mime?: string | null; tamanho?: number | null; created_at?: string };

// ── subscriptions ──
type SubscriptionsRow = { id: string; tenant_id: string; plan: Plan; status: SubStatus; gateway: string; gateway_subscription_id: string | null; current_period_end: string | null; grace_until: string | null; created_at: string; updated_at: string };
type SubscriptionsInsert = { id?: string; tenant_id: string; plan?: Plan; status?: SubStatus; gateway?: string; gateway_subscription_id?: string | null; current_period_end?: string | null; grace_until?: string | null; created_at?: string; updated_at?: string };

// ── invoices ──
type InvoicesRow = { id: string; tenant_id: string; subscription_id: string | null; amount_cents: number; status: InvoiceStatus; due_date: string | null; paid_at: string | null; gateway_invoice_id: string | null; pix_qr_code: string | null; pix_expires_at: string | null; nfe_url: string | null; created_at: string };
type InvoicesInsert = { id?: string; tenant_id: string; subscription_id?: string | null; amount_cents?: number; status?: InvoiceStatus; due_date?: string | null; paid_at?: string | null; gateway_invoice_id?: string | null; pix_qr_code?: string | null; pix_expires_at?: string | null; nfe_url?: string | null; created_at?: string };

// ── leads ──
type LeadsRow = { id: string; tenant_id: string; cliente: string; empresa: string | null; valor: number; status: string; responsavel: string | null; ultimo: string | null; obs: string | null; score: number; origem: string | null; telefone: string | null; email: string | null; created_at: string; updated_at: string };
type LeadsInsert = { id?: string; tenant_id: string; cliente: string; empresa?: string | null; valor?: number; status?: string; responsavel?: string | null; ultimo?: string | null; obs?: string | null; score?: number; origem?: string | null; telefone?: string | null; email?: string | null; created_at?: string; updated_at?: string };

// ── clients ──
type ClientsRow = { id: string; tenant_id: string; nome: string; cnpj: string | null; segmento: string | null; contato: string | null; telefone: string | null; email: string | null; endereco: string | null; obs: string | null; created_at: string; updated_at: string };
type ClientsInsert = { id?: string; tenant_id: string; nome: string; cnpj?: string | null; segmento?: string | null; contato?: string | null; telefone?: string | null; email?: string | null; endereco?: string | null; obs?: string | null; created_at?: string; updated_at?: string };

// ── contacts ──
type ContactsRow = { id: string; tenant_id: string; client_id: string | null; nome: string; cargo: string | null; telefone: string | null; email: string | null; created_at: string };
type ContactsInsert = { id?: string; tenant_id: string; client_id?: string | null; nome: string; cargo?: string | null; telefone?: string | null; email?: string | null; created_at?: string };

// ── services ──
type ServicesRow = { id: string; tenant_id: string; nome: string; descricao: string | null; unidade: string | null; preco: number; created_at: string };
type ServicesInsert = { id?: string; tenant_id: string; nome: string; descricao?: string | null; unidade?: string | null; preco?: number; created_at?: string };

// ── budgets ──
type BudgetsRow = { id: string; tenant_id: string; client_id: string | null; numero: string | null; titulo: string; status: BudgetStatus; valor_total: number; validade: string | null; assinado_em: string | null; created_at: string; updated_at: string };
type BudgetsInsert = { id?: string; tenant_id: string; client_id?: string | null; numero?: string | null; titulo: string; status?: BudgetStatus; valor_total?: number; validade?: string | null; assinado_em?: string | null; created_at?: string; updated_at?: string };

// ── budget_items ──
type BudgetItemsRow = { id: string; tenant_id: string; budget_id: string; descricao: string; quantidade: number; preco_unit: number; ordem: number };
type BudgetItemsInsert = { id?: string; tenant_id: string; budget_id: string; descricao: string; quantidade?: number; preco_unit?: number; ordem?: number };

// ── projects ──
type ProjectsRow = { id: string; tenant_id: string; client_id: string | null; nome: string; status: string; inicio: string | null; fim: string | null; progresso: number; valor: number; custo_real: number; responsavel: string | null; created_at: string; updated_at: string };
type ProjectsInsert = { id?: string; tenant_id: string; client_id?: string | null; nome: string; status?: string; inicio?: string | null; fim?: string | null; progresso?: number; valor?: number; custo_real?: number; responsavel?: string | null; created_at?: string; updated_at?: string };

// ── project_tasks ──
type ProjectTasksRow = { id: string; tenant_id: string; project_id: string; titulo: string; done: boolean; ordem: number };
type ProjectTasksInsert = { id?: string; tenant_id: string; project_id: string; titulo: string; done?: boolean; ordem?: number };

// ── finance_entries ──
type FinanceRow = { id: string; tenant_id: string; tipo: FinTipo; descricao: string; valor: number; status: FinStatus; data: string; categoria: string | null; cliente: string | null; created_at: string };
type FinanceInsert = { id?: string; tenant_id: string; tipo: FinTipo; descricao: string; valor?: number; status?: FinStatus; data?: string; categoria?: string | null; cliente?: string | null; created_at?: string };

// ── tasks ──
type TasksRow = { id: string; tenant_id: string; titulo: string; cliente: string | null; prioridade: "Baixa" | "Média" | "Alta" | null; prazo: string | null; done: boolean; tags: string[] | null; created_at: string };
type TasksInsert = { id?: string; tenant_id: string; titulo: string; cliente?: string | null; prioridade?: "Baixa" | "Média" | "Alta" | null; prazo?: string | null; done?: boolean; tags?: string[] | null; created_at?: string };

// ── events ──
type EventsRow = { id: string; tenant_id: string; titulo: string; data: string; hora: string | null; tipo: string | null; cliente: string | null; local: string | null; created_at: string };
type EventsInsert = { id?: string; tenant_id: string; titulo: string; data: string; hora?: string | null; tipo?: string | null; cliente?: string | null; local?: string | null; created_at?: string };

// ── audit_log ──
type AuditRow = { id: string; tenant_id: string; user_id: string | null; acao: string; entidade: string | null; alvo: string | null; detalhe: string | null; created_at: string };
type AuditInsert = { id?: string; tenant_id: string; user_id?: string | null; acao: string; entidade?: string | null; alvo?: string | null; detalhe?: string | null; created_at?: string };

// ── automations ──
type AutomationsRow = { id: string; tenant_id: string; nome: string; gatilho: string; gatilho_valor: string | null; acao: string; acao_param: Json; ativo: boolean; exec_count: number; created_at: string };
type AutomationsInsert = { id?: string; tenant_id: string; nome: string; gatilho: string; gatilho_valor?: string | null; acao: string; acao_param?: Json; ativo?: boolean; exec_count?: number; created_at?: string };

type Table<R, I> = { Row: R; Insert: I; Update: Partial<I>; Relationships: [] };

export interface Database {
  public: {
    Tables: {
      tenants: Table<TenantsRow, TenantsInsert>;
      profiles: Table<ProfilesRow, ProfilesInsert>;
      memberships: Table<MembershipsRow, MembershipsInsert>;
      subscriptions: Table<SubscriptionsRow, SubscriptionsInsert>;
      invoices: Table<InvoicesRow, InvoicesInsert>;
      leads: Table<LeadsRow, LeadsInsert>;
      clients: Table<ClientsRow, ClientsInsert>;
      contacts: Table<ContactsRow, ContactsInsert>;
      services: Table<ServicesRow, ServicesInsert>;
      budgets: Table<BudgetsRow, BudgetsInsert>;
      budget_items: Table<BudgetItemsRow, BudgetItemsInsert>;
      projects: Table<ProjectsRow, ProjectsInsert>;
      project_tasks: Table<ProjectTasksRow, ProjectTasksInsert>;
      finance_entries: Table<FinanceRow, FinanceInsert>;
      tasks: Table<TasksRow, TasksInsert>;
      events: Table<EventsRow, EventsInsert>;
      audit_log: Table<AuditRow, AuditInsert>;
      automations: Table<AutomationsRow, AutomationsInsert>;
      invites: Table<InvitesRow, InvitesInsert>;
      documents: Table<DocumentsRow, DocumentsInsert>;
    };
    Views: Record<string, never>;
    Functions: {
      current_tenant_id: { Args: Record<string, never>; Returns: string };
      is_member_of: { Args: { p_tenant: string }; Returns: boolean };
      has_role: { Args: { p_tenant: string; p_roles: string[] }; Returns: boolean };
      attach_me_to_demo: { Args: Record<string, never>; Returns: string };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Atalhos ergonômicos para consumidores (apps/web).
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
