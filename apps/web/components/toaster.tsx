"use client";

import { useEffect, useState } from "react";

type Tipo = "ok" | "erro" | "info";
type T = { id: number; msg: string; tipo: Tipo };

const COR: Record<Tipo, string> = { ok: "var(--ok)", erro: "var(--bad)", info: "var(--accent)" };

// Dispare de qualquer componente client: toast("Salvo!") / toast("Erro", "erro")
export function toast(msg: string, tipo: Tipo = "ok") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nexflow-toast", { detail: { msg, tipo } }));
  }
}

export function Toaster() {
  const [list, setList] = useState<T[]>([]);

  useEffect(() => {
    function on(e: Event) {
      const d = (e as CustomEvent).detail as { msg: string; tipo?: Tipo };
      const id = Date.now() + Math.random();
      setList((l) => [...l, { id, msg: d.msg, tipo: d.tipo ?? "ok" }]);
      setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 3500);
    }
    window.addEventListener("nexflow-toast", on);
    return () => window.removeEventListener("nexflow-toast", on);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-[120] flex flex-col gap-2">
      {list.map((t) => (
        <div
          key={t.id}
          className="nx-toast flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm font-medium"
          style={{ boxShadow: "0 18px 40px -16px rgba(0,0,0,.5)" }}
        >
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${COR[t.tipo]} 16%, transparent)`, color: COR[t.tipo] }}>
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              {t.tipo === "erro" ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M20 6 9 17l-5-5" />}
            </svg>
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
