import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/billing/entitlements";
import { logout } from "@/app/login/actions";
import { ThemeToggle } from "@/components/theme-toggle";

const MENU = [
  { id: "crm", label: "CRM / Vendas", ativo: true },
  { id: "clientes", label: "Clientes 360°", ativo: true },
  { id: "orcamentos", label: "Orçamentos", ativo: true },
  { id: "projetos", label: "Obras e Serviços", ativo: true },
  { id: "financeiro", label: "Financeiro", ativo: true },
  { id: "tarefas", label: "Tarefas", ativo: true },
  { id: "agenda", label: "Agenda", ativo: true },
  { id: "empresa", label: "Minha empresa", ativo: true },
  { id: "planos", label: "Planos & Cobrança", ativo: true },
  { id: "importar", label: "Importar dados", ativo: true },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ent = await getEntitlements();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--panel)] md:flex">
        <div className="flex items-center gap-2 px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-mono text-sm font-extrabold text-white">
            N
          </span>
          <span className="font-extrabold tracking-tight">NEXFLOW</span>
          <span className="ml-auto rounded-full bg-[var(--bg2)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]">
            {ent.plan}
          </span>
        </div>

        <nav className="flex-1 px-3">
          <p className="px-2 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Módulos
          </p>
          {MENU.map((m) => (
            <Link
              key={m.id}
              href={m.ativo ? `/${m.id}` : "#"}
              aria-disabled={!m.ativo}
              className={`mb-0.5 flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                m.ativo
                  ? "text-[var(--text)] hover:bg-[var(--bg2)]"
                  : "cursor-not-allowed text-[var(--muted)]/60"
              }`}
            >
              {m.label}
              {!m.ativo && (
                <span className="rounded bg-[var(--bg2)] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[var(--muted)]">
                  em breve
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="border-t border-[var(--border)] p-3">
          <div className="flex items-center justify-between px-2">
            <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
            <ThemeToggle />
          </div>
          <form action={logout}>
            <button className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--bg2)] hover:text-red-600">
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 bg-[var(--bg)]">
        {ent.access === "readonly" && (
          <div className="bg-red-600 px-5 py-2 text-center text-xs font-semibold text-white">
            Conta em suspensão suave (somente leitura) — regularize em Planos &
            Cobrança.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
