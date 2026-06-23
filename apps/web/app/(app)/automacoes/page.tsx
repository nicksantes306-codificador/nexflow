import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@nexflow/db";
import { PageHeader, KpiCard, EmptyHint } from "@/components/ui";
import { labelGatilho, labelAcao } from "@/lib/automations/engine";
import { Builder } from "./builder";
import { toggleAutomacao, excluirAutomacao } from "./actions";

export const dynamic = "force-dynamic";

type Automacao = Tables<"automations">;

const ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>
);

export default async function AutomacoesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("automations").select("*").order("created_at", { ascending: false });
  const regras = (data ?? []) as Automacao[];
  const ativas = regras.filter((r) => r.ativo).length;
  const execucoes = regras.reduce((a, r) => a + (r.exec_count ?? 0), 0);

  return (
    <div className="p-5 md:p-7">
      <PageHeader
        title="Automações"
        subtitle="Crie regras no-code: quando algo acontece, o NEXFLOW age sozinho."
        icon={ICON}
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <KpiCard label="Regras" value={String(regras.length)} icon={ICON} />
        <KpiCard label="Ativas" value={String(ativas)} tone="green" />
        <KpiCard label="Execuções" value={String(execucoes)} hint="total disparado" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Builder />

        <div>
          <h2 className="mb-3 text-[15px] font-bold">Suas automações</h2>
          {regras.length === 0 ? (
            <EmptyHint>Nenhuma automação ainda. Crie a primeira no construtor ao lado — ex.: quando um lead é criado, criar uma tarefa de follow-up.</EmptyHint>
          ) : (
            <ul className="space-y-3">
              {regras.map((r) => (
                <li key={r.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4" style={{ boxShadow: "var(--shadow)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold">{r.nome}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--muted)]">
                        <span className="rounded-md bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-1.5 py-0.5 font-semibold text-[var(--accent)]">{labelGatilho(r.gatilho)}{r.gatilho_valor ? ` · ${r.gatilho_valor}` : ""}</span>
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                        <span className="rounded-md bg-[color-mix(in_srgb,var(--accent-2)_12%,transparent)] px-1.5 py-0.5 font-semibold text-[var(--accent-2)]">{labelAcao(r.acao)}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <form action={toggleAutomacao}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="ativo" value={String(r.ativo)} />
                        <button
                          type="submit"
                          aria-label={r.ativo ? "Desativar" : "Ativar"}
                          title={r.ativo ? "Ativa — clique para pausar" : "Pausada — clique para ativar"}
                          className="relative h-6 w-11 rounded-full transition"
                          style={{ background: r.ativo ? "var(--accent)" : "var(--bg2)" }}
                        >
                          <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" style={{ left: r.ativo ? "22px" : "2px" }} />
                        </button>
                      </form>
                      <form action={excluirAutomacao}>
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" aria-label="Excluir" className="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--bg2)] hover:text-[var(--bad)]">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                        </button>
                      </form>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 border-t border-[var(--border)] pt-2.5 text-[11px] text-[var(--muted)]">
                    <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: r.ativo ? "var(--ok)" : "var(--muted)" }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.ativo ? "var(--ok)" : "var(--muted)" }} />
                      {r.ativo ? "Ativa" : "Pausada"}
                    </span>
                    · {r.exec_count ?? 0} execuç{(r.exec_count ?? 0) === 1 ? "ão" : "ões"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
