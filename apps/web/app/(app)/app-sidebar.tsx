"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import { ThemeToggle } from "@/components/theme-toggle";

type Item = { id: string; label: string; icon: React.ReactNode; tag?: string };

const I = {
  dash: (
    <svg className="ic" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>
  ),
  crm: (
    <svg className="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" /></svg>
  ),
  users: (
    <svg className="ic" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  file: (
    <svg className="ic" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h8M8 9h2" /></svg>
  ),
  hardhat: (
    <svg className="ic" viewBox="0 0 24 24"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-1H2z" /><path d="M10 9V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4" /><path d="M4 16v-3a6 6 0 0 1 6-6" /><path d="M14 7a6 6 0 0 1 6 6v3" /></svg>
  ),
  wallet: (
    <svg className="ic" viewBox="0 0 24 24"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" /></svg>
  ),
  check: (
    <svg className="ic" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
  ),
  cal: (
    <svg className="ic" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
  ),
  building: (
    <svg className="ic" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M9 6h.01M15 6h.01M9 10h.01M15 10h.01M9 14h.01M15 14h.01" /></svg>
  ),
  card: (
    <svg className="ic" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
  ),
  upload: (
    <svg className="ic" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></svg>
  ),
  spark: (
    <svg className="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.4L12 17l-1.9-5.6L4.5 10l5.6-1.4z" /><path d="M19 4v3M20.5 5.5h-3" /></svg>
  ),
  settings: (
    <svg className="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 4.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V1a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></svg>
  ),
};

const PRINCIPAL: Item[] = [
  { id: "dashboard", label: "Dashboard", icon: I.dash },
  { id: "crm", label: "CRM / Vendas", icon: I.crm },
  { id: "clientes", label: "Clientes 360°", icon: I.users },
  { id: "orcamentos", label: "Orçamentos", icon: I.file },
  { id: "projetos", label: "Obras e Serviços", icon: I.hardhat },
  { id: "financeiro", label: "Financeiro", icon: I.wallet },
  { id: "tarefas", label: "Tarefas", icon: I.check },
  { id: "agenda", label: "Agenda", icon: I.cal },
];

const CONTA: Item[] = [
  { id: "empresa", label: "Minha empresa", icon: I.building },
  { id: "planos", label: "Planos & Cobrança", icon: I.card },
  { id: "importar", label: "Importar dados", icon: I.upload },
];

export function AppSidebar({ email, plan }: { email: string; plan: string }) {
  const pathname = usePathname();
  const isActive = (id: string) =>
    pathname === `/${id}` || pathname.startsWith(`/${id}/`);

  const NavItem = ({ item }: { item: Item }) => (
    <Link
      href={`/${item.id}`}
      aria-current={isActive(item.id) ? "page" : undefined}
      className={`group relative mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition ${
        isActive(item.id)
          ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)]"
          : "text-[var(--muted)] hover:bg-[var(--bg2)] hover:text-[var(--text)]"
      }`}
    >
      {isActive(item.id) && (
        <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[var(--accent)]" />
      )}
      <span className="[&_.ic]:h-[18.5px] [&_.ic]:w-[18.5px]">{item.icon}</span>
      {item.label}
      {item.tag && (
        <span className="ml-auto rounded-full bg-[color-mix(in_srgb,var(--accent-2)_14%,transparent)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent-2)]">
          {item.tag}
        </span>
      )}
    </Link>
  );

  return (
    <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--panel)] px-4 py-5 md:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 pb-5">
        <span
          className="grid h-[38px] w-[38px] place-items-center rounded-xl text-white"
          style={{
            background: "linear-gradient(140deg,var(--accent),var(--brand-700,#1d4ed8))",
            boxShadow: "0 10px 22px -8px color-mix(in srgb,var(--accent) 60%,transparent)",
          }}
        >
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19V5l16 14V5" />
          </svg>
        </span>
        <div>
          <b className="block text-[17px] font-extrabold tracking-tight">NEXFLOW</b>
          <span className="block text-[11px] font-semibold tracking-wide text-[var(--muted)]">
            Enterprise Suite
          </span>
        </div>
      </div>

      {/* Tenant */}
      <button className="mb-4 flex items-center gap-2.5 rounded-xl border border-[var(--border)] px-3 py-2.5 text-left transition hover:bg-[var(--bg2)]">
        <span className="grid h-[30px] w-[30px] place-items-center rounded-lg border border-[color-mix(in_srgb,var(--accent)_22%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[12px] font-bold text-[var(--accent)]">
          MX
        </span>
        <span className="min-w-0 flex-1">
          <b className="block truncate text-[13px] font-bold">MAXTEC Engenharia</b>
          <span className="block text-[11px] text-[var(--muted)]">Plano {plan}</span>
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </button>

      <nav className="flex-1 overflow-y-auto">
        <p className="px-3 pb-1.5 pt-2 text-[10.5px] font-bold uppercase tracking-wider text-[var(--muted)]">
          Principal
        </p>
        {PRINCIPAL.map((m) => (
          <NavItem key={m.id} item={m} />
        ))}

        <p className="px-3 pb-1.5 pt-4 text-[10.5px] font-bold uppercase tracking-wider text-[var(--muted)]">
          Inteligência
        </p>
        <Link
          href="/crm"
          className="group relative mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-[var(--muted)] transition hover:bg-[var(--bg2)] hover:text-[var(--text)]"
        >
          <span className="[&_.ic]:h-[18.5px] [&_.ic]:w-[18.5px]">{I.spark}</span>
          NEXFLOW AI
          <span className="ml-auto rounded-full bg-[color-mix(in_srgb,var(--accent-2)_14%,transparent)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent-2)]">
            Novo
          </span>
        </Link>

        <p className="px-3 pb-1.5 pt-4 text-[10.5px] font-bold uppercase tracking-wider text-[var(--muted)]">
          Conta
        </p>
        {CONTA.map((m) => (
          <NavItem key={m.id} item={m} />
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-2 border-t border-[var(--border)] pt-3">
        <div className="flex items-center gap-2.5 px-1">
          <span className="grid h-[34px] w-[34px] place-items-center rounded-lg bg-gradient-to-br from-[var(--navy-700)] to-[var(--text)] text-[12px] font-bold text-white">
            {email.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <b className="block truncate text-[12.5px]">{email.split("@")[0]}</b>
            <span className="block text-[10.5px] text-[var(--muted)]">Administrador</span>
          </span>
          <ThemeToggle />
        </div>
        <form action={logout}>
          <button className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-[var(--muted)] transition hover:bg-[var(--bg2)] hover:text-[var(--bad)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
