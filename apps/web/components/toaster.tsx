"use client";

import { useEffect, useState } from "react";

type Tipo = "ok" | "erro" | "info";
type Acao = { label: string; onClick: () => void };
type Opts = { tipo?: Tipo; action?: Acao; duration?: number };
type T = { id: number; msg: string; tipo: Tipo; action?: Acao };

const COR: Record<Tipo, string> = { ok: "var(--ok)", erro: "var(--bad)", info: "var(--accent)" };

// toast("Salvo!")  ·  toast("Erro", "erro")  ·  toast("Excluído", { action: { label: "Desfazer", onClick } })
export function toast(msg: string, opts: Tipo | Opts = {}) {
  if (typeof window === "undefined") return;
  const o: Opts = typeof opts === "string" ? { tipo: opts } : opts;
  window.dispatchEvent(new CustomEvent("nexflow-toast", { detail: { msg, ...o } }));
}

export function Toaster() {
  const [list, setList] = useState<T[]>([]);

  useEffect(() => {
    function on(e: Event) {
      const d = (e as CustomEvent).detail as { msg: string } & Opts;
      const id = Date.now() + Math.random();
      setList((l) => [...l, { id, msg: d.msg, tipo: d.tipo ?? "ok", action: d.action }]);
      const dur = d.duration ?? (d.action ? 6000 : 3500);
      setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), dur);
    }
    window.addEventListener("nexflow-toast", on);
    return () => window.removeEventListener("nexflow-toast", on);
  }, []);

  function fechar(id: number) {
    setList((l) => l.filter((x) => x.id !== id));
  }

  return (
    <div className="fixed bottom-5 right-5 z-[120] flex flex-col gap-2">
      {list.map((t) => (
        <div
          key={t.id}
          className="nx-toast flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm font-medium"
          style={{ boxShadow: "0 18px 40px -16px rgba(0,0,0,.5)" }}
        >
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${COR[t.tipo]} 16%, transparent)`, color: COR[t.tipo] }}>
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              {t.tipo === "erro" ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M20 6 9 17l-5-5" />}
            </svg>
          </span>
          <span className="flex-1">{t.msg}</span>
          {t.action && (
            <button
              type="button"
              onClick={() => { t.action!.onClick(); fechar(t.id); }}
              className="shrink-0 rounded-lg px-2.5 py-1 text-[13px] font-bold text-[var(--accent)] transition hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
