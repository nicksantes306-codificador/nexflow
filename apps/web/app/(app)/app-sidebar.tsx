"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoMark } from "@/components/logo";
import { PRINCIPAL, INTELIGENCIA, CONTA, type NavItemData } from "./nav-data";

export function AppSidebar({ email, plan }: { email: string; plan: string }) {
  const pathname = usePathname();
  const isActive = (id: string) =>
    pathname === `/${id}` || pathname.startsWith(`/${id}/`);

  // Favoritos (atalhos no topo) — salvos por dispositivo.
  const [favs, setFavs] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nexflow-favoritos");
      if (raw) setFavs(JSON.parse(raw));
    } catch {}
  }, []);
  function toggleFav(id: string) {
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem("nexflow-favoritos", JSON.stringify(next)); } catch {}
      return next;
    });
  }
  const TODOS = [...PRINCIPAL, ...INTELIGENCIA, ...CONTA];
  const favItens = favs.map((id) => TODOS.find((x) => x.id === id)).filter(Boolean) as NavItemData[];

  const NavItem = ({ item }: { item: NavItemData }) => {
    const fav = favs.includes(item.id);
    return (
      <div className="group relative">
        <Link
          href={`/${item.id}`}
          title={item.desc}
          aria-current={isActive(item.id) ? "page" : undefined}
          className={`relative mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition ${
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
            <span className="ml-auto mr-5 rounded-full bg-[color-mix(in_srgb,var(--accent-2)_14%,transparent)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent-2)]">
              {item.tag}
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => toggleFav(item.id)}
          aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          title={fav ? "Remover dos favoritos" : "Favoritar"}
          className={`absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md transition ${
            fav ? "text-[var(--accent-2)]" : "text-[var(--muted)] opacity-0 hover:text-[var(--accent-2)] group-hover:opacity-100"
          }`}
        >
          <svg viewBox="0 0 24 24" fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
            <path d="M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--panel)] px-4 py-5 md:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 pb-5">
        <LogoMark size={40} className="shrink-0" />
        <div>
          <b className="block text-[17px] font-extrabold tracking-tight">NEXFLOW</b>
          <span className="block text-[11px] font-semibold tracking-wide text-[var(--muted)]">
            Sistema de gestão
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

      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("nexflow-command"))}
        className="mb-3 flex items-center gap-2.5 rounded-xl border border-[var(--border)] px-3 py-2 text-left text-[13px] text-[var(--muted)] transition hover:bg-[var(--bg2)] hover:text-[var(--text)]"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
        Buscar…
        <kbd className="ml-auto rounded-md border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-semibold">⌘K</kbd>
      </button>

      <nav className="flex-1 overflow-y-auto">
        {favItens.length > 0 && (
          <>
            <p className="px-3 pb-1.5 pt-2 text-[10.5px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Favoritos
            </p>
            {favItens.map((m) => (
              <NavItem key={"fav-" + m.id} item={m} />
            ))}
          </>
        )}
        <p className="px-3 pb-1.5 pt-4 text-[10.5px] font-bold uppercase tracking-wider text-[var(--muted)]">
          Principal
        </p>
        {PRINCIPAL.map((m) => (
          <NavItem key={m.id} item={m} />
        ))}

        <p className="px-3 pb-1.5 pt-4 text-[10.5px] font-bold uppercase tracking-wider text-[var(--muted)]">
          Ajuda automática
        </p>
        {INTELIGENCIA.map((m) => (
          <NavItem key={m.id} item={m} />
        ))}

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
