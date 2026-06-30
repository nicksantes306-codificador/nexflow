"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Notificacao } from "@/lib/notifications";

const COR = ["var(--bad)", "var(--warn)", "var(--accent)"];

function quando(iso: string): string {
  const d = new Date(iso);
  const diff = d.getTime() - Date.now();
  const absMin = Math.round(Math.abs(diff) / 60000);
  if (absMin < 60) return diff >= 0 ? "em breve" : "agora há pouco";
  const h = Math.round(absMin / 60);
  if (h < 24) return diff >= 0 ? `em ${h} h` : `há ${h} h`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function NotificationBell({ notificacoes }: { notificacoes: Notificacao[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const avisos = notificacoes.filter((n) => n.grupo === "Avisos");
  const atividade = notificacoes.filter((n) => n.grupo === "Atividade");
  const badge = avisos.length;

  function ir(href: string) {
    setOpen(false);
    router.push(href);
  }

  const Item = ({ n }: { n: Notificacao }) => (
    <button
      type="button"
      onClick={() => ir(n.href)}
      className="flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-[var(--bg2)]"
    >
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: COR[n.prioridade] }} />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-snug">{n.titulo}</span>
        <span className="mt-0.5 block text-[11px] text-[var(--muted)]">{[n.sub, quando(n.quando)].filter(Boolean).join(" · ")}</span>
      </span>
    </button>
  );

  const Grupo = ({ titulo, itens }: { titulo: string; itens: Notificacao[] }) => (
    <div className="mb-2">
      <p className="px-2.5 pb-1 pt-2 text-[10.5px] font-bold uppercase tracking-wider text-[var(--muted)]">{titulo}</p>
      {itens.map((n) => <Item key={n.id} n={n} />)}
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={badge > 0 ? `Notificações (${badge})` : "Notificações"}
        title="Notificações"
        className="relative grid h-9 w-9 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--bg2)] hover:text-[var(--text)]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
        {badge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-h-[16px] min-w-[16px] place-items-center rounded-full bg-[var(--bad)] px-1 text-[9px] font-bold leading-none text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Notificações">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="nx-drawer-r absolute right-0 top-0 flex h-full w-[360px] max-w-[88%] flex-col border-l border-[var(--border)] bg-[var(--panel)]">
            <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3.5">
              <div>
                <b className="text-[15px]">Notificações</b>
                {badge > 0 && <span className="ml-2 text-[12px] text-[var(--muted)]">{badge} {badge === 1 ? "item precisa" : "itens precisam"} de atenção</span>}
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--bg2)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 18, height: 18 }}><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-2">
              {notificacoes.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-16 text-center">
                  <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                  </span>
                  <p className="text-sm font-bold">Tudo em dia</p>
                  <p className="mt-1 text-[12.5px] text-[var(--muted)]">Sem avisos pendentes nem atividade recente.</p>
                </div>
              ) : (
                <>
                  {avisos.length > 0 && <Grupo titulo="Precisa de atenção" itens={avisos} />}
                  {atividade.length > 0 && <Grupo titulo="Atividade recente" itens={atividade} />}
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
