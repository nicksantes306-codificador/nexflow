"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoMark } from "@/components/logo";
import { PRINCIPAL, INTELIGENCIA, CONTA, type NavItemData } from "./nav-data";

// Navegação no celular: barra superior fixa + menu lateral deslizante.
// (No desktop a sidebar normal assume; este componente é md:hidden.)
export function MobileNav({ plan }: { plan: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha ao trocar de página.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Trava o scroll do fundo com o menu aberto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (id: string) => pathname === `/${id}` || pathname.startsWith(`/${id}/`);

  const NavLink = ({ item }: { item: NavItemData }) => (
    <Link
      href={`/${item.id}`}
      aria-current={isActive(item.id) ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold transition ${
        isActive(item.id)
          ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)]"
          : "text-[var(--muted)] hover:bg-[var(--bg2)] hover:text-[var(--text)]"
      }`}
    >
      <span className="[&_.ic]:h-5 [&_.ic]:w-5">{item.icon}</span>
      {item.label}
      {item.tag && (
        <span className="ml-auto rounded-full bg-[color-mix(in_srgb,var(--accent-2)_14%,transparent)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent-2)]">
          {item.tag}
        </span>
      )}
    </Link>
  );

  return (
    <>
      {/* Barra superior (mobile) */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--panel)] px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--border)] text-[var(--text)] transition hover:bg-[var(--bg2)]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 18, height: 18 }}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <LogoMark size={28} />
          <b className="text-[15px] font-extrabold tracking-tight">NEXFLOW</b>
        </Link>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("nexflow-command"))}
          aria-label="Buscar"
          className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:bg-[var(--bg2)]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 17, height: 17 }}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
        </button>
        <ThemeToggle />
      </header>

      {/* Menu lateral deslizante */}
      {open && (
        <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <nav className="nx-drawer absolute left-0 top-0 flex h-full w-[284px] max-w-[86%] flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--panel)] px-4 py-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <LogoMark size={34} />
                <div>
                  <b className="block text-[15px] font-extrabold tracking-tight">NEXFLOW</b>
                  <span className="block text-[10.5px] text-[var(--muted)]">MAXTEC · Plano {plan}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--bg2)]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 18, height: 18 }}><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1">
              <p className="px-3 pb-1 pt-2 text-[10.5px] font-bold uppercase tracking-wider text-[var(--muted)]">Principal</p>
              {PRINCIPAL.map((m) => <NavLink key={m.id} item={m} />)}
              <p className="px-3 pb-1 pt-3 text-[10.5px] font-bold uppercase tracking-wider text-[var(--muted)]">Ajuda automática</p>
              {INTELIGENCIA.map((m) => <NavLink key={m.id} item={m} />)}
              <p className="px-3 pb-1 pt-3 text-[10.5px] font-bold uppercase tracking-wider text-[var(--muted)]">Conta</p>
              {CONTA.map((m) => <NavLink key={m.id} item={m} />)}
            </div>

            <form action={logout} className="mt-2 border-t border-[var(--border)] pt-3">
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-[15px] font-medium text-[var(--muted)] transition hover:bg-[var(--bg2)] hover:text-[var(--bad)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                Sair
              </button>
            </form>
          </nav>
        </div>
      )}
    </>
  );
}
