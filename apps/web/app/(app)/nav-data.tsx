// Itens de navegação compartilhados entre a sidebar (desktop) e o menu mobile.
// Fonte única → desktop e celular sempre mostram o mesmo (consistência).

export type NavItemData = { id: string; label: string; icon: React.ReactNode; tag?: string; desc?: string };

export const NAV_ICONS = {
  dash: <svg className="ic" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>,
  crm: <svg className="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" /></svg>,
  users: <svg className="ic" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  file: <svg className="ic" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h8M8 9h2" /></svg>,
  hardhat: <svg className="ic" viewBox="0 0 24 24"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-1H2z" /><path d="M10 9V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4" /><path d="M4 16v-3a6 6 0 0 1 6-6" /><path d="M14 7a6 6 0 0 1 6 6v3" /></svg>,
  wallet: <svg className="ic" viewBox="0 0 24 24"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" /></svg>,
  check: <svg className="ic" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
  cal: <svg className="ic" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  building: <svg className="ic" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M9 6h.01M15 6h.01M9 10h.01M15 10h.01M9 14h.01M15 14h.01" /></svg>,
  card: <svg className="ic" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>,
  upload: <svg className="ic" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></svg>,
  spark: <svg className="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.4L12 17l-1.9-5.6L4.5 10l5.6-1.4z" /><path d="M19 4v3M20.5 5.5h-3" /></svg>,
  zap: <svg className="ic" viewBox="0 0 24 24"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
  chart: <svg className="ic" viewBox="0 0 24 24"><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" rx="1" /><rect x="12" y="7" width="3" height="10" rx="1" /><rect x="17" y="13" width="3" height="4" rx="1" /></svg>,
  history: <svg className="ic" viewBox="0 0 24 24"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" /></svg>,
};

export const PRINCIPAL: NavItemData[] = [
  { id: "dashboard", label: "Painel", icon: NAV_ICONS.dash, desc: "Visão geral do seu negócio num lugar só" },
  { id: "crm", label: "Vendas", icon: NAV_ICONS.crm, desc: "Acompanhe os clientes em potencial até fechar negócio" },
  { id: "clientes", label: "Clientes", icon: NAV_ICONS.users, desc: "Cadastro, contatos e histórico dos seus clientes" },
  { id: "orcamentos", label: "Orçamentos", icon: NAV_ICONS.file, desc: "Faça propostas e orçamentos para os clientes" },
  { id: "projetos", label: "Obras", icon: NAV_ICONS.hardhat, desc: "Acompanhe o andamento das obras e serviços" },
  { id: "financeiro", label: "Financeiro", icon: NAV_ICONS.wallet, desc: "Contas a pagar, a receber e o caixa da empresa" },
  { id: "relatorios", label: "Relatórios", icon: NAV_ICONS.chart, desc: "Gráficos e números do seu negócio" },
  { id: "tarefas", label: "Tarefas", icon: NAV_ICONS.check, desc: "Sua lista de tarefas e prazos" },
  { id: "agenda", label: "Agenda", icon: NAV_ICONS.cal, desc: "Compromissos, visitas técnicas e reuniões" },
];

export const INTELIGENCIA: NavItemData[] = [
  { id: "automacoes", label: "Automações", icon: NAV_ICONS.zap, desc: "O sistema faz tarefas sozinho quando algo acontece" },
  { id: "ai", label: "NEXFLOW AI", icon: NAV_ICONS.spark, tag: "Novo", desc: "Assistente que responde sobre seus números e te dá dicas" },
];

export const CONTA: NavItemData[] = [
  { id: "equipe", label: "Equipe", icon: NAV_ICONS.users, desc: "Convide e gerencie as pessoas da sua empresa" },
  { id: "historico", label: "Histórico", icon: NAV_ICONS.history, desc: "Tudo que foi criado, editado e excluído" },
  { id: "empresa", label: "Minha empresa", icon: NAV_ICONS.building, desc: "Dados da sua empresa (CNPJ, endereço…)" },
  { id: "planos", label: "Plano e pagamento", icon: NAV_ICONS.card, desc: "Sua assinatura e faturas" },
  { id: "importar", label: "Importar dados", icon: NAV_ICONS.upload, desc: "Trazer dados de uma planilha ou do sistema antigo" },
];
