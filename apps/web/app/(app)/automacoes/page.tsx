import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@nexflow/db";
import { PageHeader, KpiCard, EmptyHint } from "@/components/ui";
import { labelGatilho, labelAcao, categoriaGatilho, OPERADORES, type Categoria, type Condicao } from "@/lib/automations/engine";
import { moneyFull } from "@/lib/format";
import { Builder } from "./builder";
import { toggleAutomacao, excluirAutomacao, toggleDryRun } from "./actions";

export const dynamic = "force-dynamic";

type Automacao = Tables<"automations">;
type Execucao = Tables<"automation_runs">;

const ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>
);

const CATEGORIA_STYLE: Record<Categoria, { cor: string; icone: React.ReactNode }> = {
  comercial: { cor: "var(--accent)", icone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" /></svg> },
  financeiro: { cor: "var(--ok)", icone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
  obras: { cor: "var(--warn)", icone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-1H2z" /><path d="M10 9V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4" /><path d="M4 16v-3a6 6 0 0 1 6-6" /><path d="M14 7a6 6 0 0 1 6 6v3" /></svg> },
  estoque: { cor: "var(--accent-2)", icone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="m3.3 7 8.7 5 8.7-5M12 22V12" /></svg> },
  geral: { cor: "var(--muted)", icone: ICON },
};

function quando(iso: string): string {
  const d = new Date(iso);
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "agora há pouco";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function AutomacoesPage() {
  const supabase = await createClient();
  const [{ data }, { data: runsData }] = await Promise.all([
    supabase.from("automations").select("*").order("created_at", { ascending: false }),
    supabase.from("automation_runs").select("*").order("created_at", { ascending: false }).limit(30),
  ]);
  const regras = (data ?? []) as Automacao[];
  const execucoesRecentes = (runsData ?? []) as Execucao[];
  const ativas = regras.filter((r) => r.ativo).length;
  const execucoes = regras.reduce((a, r) => a + (r.exec_count ?? 0), 0);
  const ok = execucoesRecentes.filter((e) => e.status === "ok").length;
  const taxaSucesso = execucoesRecentes.length ? Math.round((ok / execucoesRecentes.length) * 100) : 100;

  return (
    <div className="p-5 md:p-7">
      <PageHeader
        title="Automações"
        subtitle="Crie regras: quando algo acontecer em qualquer área do sistema, o NEXFLOW faz a tarefa sozinho."
        icon={ICON}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Regras" value={String(regras.length)} icon={ICON} />
        <KpiCard label="Ativas" value={String(ativas)} tone="green" />
        <KpiCard label="Execuções" value={String(execucoes)} hint="total disparado" />
        <KpiCard label="Taxa de sucesso" value={`${taxaSucesso}%`} tone={taxaSucesso >= 90 ? "green" : taxaSucesso >= 70 ? "amber" : "red"} hint="últimas 30 execuções" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <Builder />

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5" style={{ boxShadow: "var(--shadow)" }}>
            <h2 className="mb-3 text-[15px] font-bold">Execuções recentes</h2>
            {execucoesRecentes.length === 0 ? (
              <p className="text-[13px] text-[var(--muted)]">Nenhuma execução ainda. Assim que uma regra disparar, o resultado aparece aqui.</p>
            ) : (
              <ul className="space-y-2.5">
                {execucoesRecentes.slice(0, 12).map((e) => (
                  <li key={e.id} className="flex items-start gap-2.5">
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: e.status === "ok" ? "var(--ok)" : e.status === "simulado" ? "var(--warn)" : "var(--bad)" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold">
                        {e.nome}
                        {e.status === "simulado" && <span className="ml-1.5 rounded bg-[color-mix(in_srgb,var(--warn)_14%,transparent)] px-1.5 py-px text-[10px] font-bold text-[var(--warn)]">teste</span>}
                      </p>
                      <p className="truncate text-[11px] text-[var(--muted)]">
                        {labelGatilho(e.gatilho)} → {labelAcao(e.acao)} · {quando(e.created_at)}
                        {e.status !== "ok" && e.detalhe ? ` · ${e.detalhe}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div>
          <h2 className="mb-3 text-[15px] font-bold">Suas automações</h2>
          {regras.length === 0 ? (
            <EmptyHint title="Nenhuma automação ainda">Crie a primeira no construtor ao lado — ex.: quando um negócio é fechado, criar uma tarefa de entrega.</EmptyHint>
          ) : (
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {regras.map((r) => {
                const cat = CATEGORIA_STYLE[categoriaGatilho(r.gatilho)];
                return (
                  <li key={r.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4" style={{ boxShadow: "var(--shadow)" }}>
                    <div className="flex items-start gap-3">
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl [&_svg]:h-[18px] [&_svg]:w-[18px]"
                        style={{ color: cat.cor, background: `color-mix(in srgb, ${cat.cor} 14%, transparent)` }}
                      >
                        {cat.icone}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 truncate font-bold">{r.nome}</p>
                          <form action={toggleAutomacao}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="ativo" value={String(r.ativo)} />
                            <button
                              type="submit"
                              aria-label={r.ativo ? "Desativar" : "Ativar"}
                              title={r.ativo ? "Ativa — clique para pausar" : "Pausada — clique para ativar"}
                              className="relative h-6 w-11 shrink-0 rounded-full transition"
                              style={{ background: r.ativo ? "var(--accent)" : "var(--bg2)" }}
                            >
                              <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" style={{ left: r.ativo ? "22px" : "2px" }} />
                            </button>
                          </form>
                        </div>
                        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-[var(--muted)]">
                          <span className="rounded-md bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-1.5 py-0.5 font-semibold text-[var(--accent)]">{labelGatilho(r.gatilho)}{r.gatilho_valor ? ` · ${r.gatilho_valor}` : ""}</span>
                          <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                          <span className="rounded-md bg-[color-mix(in_srgb,var(--accent-2)_12%,transparent)] px-1.5 py-0.5 font-semibold text-[var(--accent-2)]">{labelAcao(r.acao)}</span>
                        </p>
                        {r.condicao != null && (() => {
                          const c = r.condicao as unknown as Partial<Condicao>;
                          const op = OPERADORES.find((o) => o.id === c.operador)?.label;
                          return c.campo === "valor" && op && typeof c.valor === "number" ? (
                            <p className="mt-1.5 text-[11px] text-[var(--muted)]">
                              <span className="rounded-md bg-[var(--bg2)] px-1.5 py-0.5 font-semibold">Só se valor {op} {moneyFull(c.valor)}</span>
                            </p>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2.5 text-[11px] text-[var(--muted)]">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: r.ativo ? "var(--ok)" : "var(--muted)" }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.ativo ? "var(--ok)" : "var(--muted)" }} />
                          {r.ativo ? "Ativa" : "Pausada"}
                        </span>
                        · {r.exec_count ?? 0} execuç{(r.exec_count ?? 0) === 1 ? "ão" : "ões"}
                        <form action={toggleDryRun} className="inline">
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="dry_run" value={String(r.dry_run)} />
                          <button
                            type="submit"
                            title={r.dry_run ? "Modo teste LIGADO — a regra registra no log sem criar nada. Clique para valer de verdade." : "Ligar modo teste (simula sem criar nada)"}
                            className="rounded px-1.5 py-px font-bold transition"
                            style={r.dry_run
                              ? { color: "var(--warn)", background: "color-mix(in srgb, var(--warn) 14%, transparent)" }
                              : { color: "var(--muted)", background: "var(--bg2)" }}
                          >
                            {r.dry_run ? "Modo teste" : "Testar"}
                          </button>
                        </form>
                      </span>
                      <form action={excluirAutomacao}>
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" aria-label="Excluir" className="grid h-7 w-7 place-items-center rounded-lg transition hover:bg-[var(--bg2)] hover:text-[var(--bad)]">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
