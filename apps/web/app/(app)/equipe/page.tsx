import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@nexflow/db";
import { PageHeader, KpiCard, EmptyHint } from "@/components/ui";
import { InviteForm } from "./invite-form";
import { cancelarConvite } from "./actions";

export const dynamic = "force-dynamic";

type Membro = Tables<"memberships">;
type Convite = Tables<"invites">;

const ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);

function iniciais(email: string | null): string {
  const e = (email ?? "?").split("@")[0];
  return e.slice(0, 2).toUpperCase();
}

function RoleBadge({ role }: { role: string }) {
  const c = role === "Admin" ? "var(--accent)" : "var(--muted)";
  return (
    <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ color: c, background: `color-mix(in srgb, ${c} 14%, transparent)` }}>
      {role}
    </span>
  );
}

export default async function EquipePage() {
  const supabase = await createClient();
  const [{ data: m }, { data: i }] = await Promise.all([
    supabase.from("memberships").select("*").order("created_at", { ascending: true }),
    supabase.from("invites").select("*").is("used_at", null).order("created_at", { ascending: false }),
  ]);
  const membros = (m ?? []) as Membro[];
  const convites = (i ?? []) as Convite[];

  return (
    <div className="p-5 md:p-7">
      <PageHeader
        title="Equipe"
        subtitle="Convide as pessoas da sua empresa. Cada equipe vê apenas os próprios dados."
        icon={ICON}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard label="Pessoas na equipe" value={String(membros.length)} icon={ICON} />
        <KpiCard label="Convites pendentes" value={String(convites.length)} tone="amber" />
        <KpiCard label="Administradores" value={String(membros.filter((x) => x.role === "Admin").length)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <InviteForm />

        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-[15px] font-bold">Pessoas na equipe</h2>
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)]" style={{ boxShadow: "var(--shadow)" }}>
              {membros.map((mb) => (
                <div key={mb.id} className="flex items-center gap-3 border-b border-[var(--border)] p-3.5 last:border-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[12px] font-bold text-[var(--accent)]">{iniciais(mb.email)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{mb.email ?? "—"}</span>
                  <RoleBadge role={mb.role} />
                </div>
              ))}
            </div>
          </div>

          {convites.length > 0 && (
            <div>
              <h2 className="mb-3 text-[15px] font-bold">Convites pendentes</h2>
              <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)]" style={{ boxShadow: "var(--shadow)" }}>
                {convites.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 border-b border-[var(--border)] p-3.5 last:border-0">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--bg2)] text-[var(--muted)]">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {c.email}
                      <span className="ml-2 text-[11px] text-[var(--muted)]">aguardando cadastro</span>
                    </span>
                    <RoleBadge role={c.role} />
                    <form action={cancelarConvite}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" aria-label="Cancelar convite" className="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--bg2)] hover:text-[var(--bad)]">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          )}

          {membros.length <= 1 && convites.length === 0 && (
            <EmptyHint>Você ainda está sozinho. Convide sua equipe no formulário ao lado — cada pessoa entra vendo só os dados da sua empresa.</EmptyHint>
          )}
        </div>
      </div>
    </div>
  );
}
