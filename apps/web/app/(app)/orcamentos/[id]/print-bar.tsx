"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { enviarAssinatura } from "./actions";

const TEMPLATES = [
  { id: "minimal", label: "Minimal" },
  { id: "corporate", label: "Corporate" },
  { id: "premium", label: "Premium" },
];

// Barra de ações (oculta na impressão via .no-print): troca o template e
// dispara window.print() — o usuário salva como PDF pelo próprio navegador.
export function PrintBar({ current, budgetId }: { current: string; budgetId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);

  function setTemplate(id: string) {
    const p = new URLSearchParams(params.toString());
    p.set("template", id);
    router.replace(`?${p.toString()}`);
  }

  function assinar() {
    setAviso(null);
    start(async () => {
      const res = await enviarAssinatura(budgetId);
      setAviso(res.ok ? "Documento enviado para assinatura ✓" : (res.error ?? "Falha."));
    });
  }

  return (
    <div className="no-print mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-[var(--muted)]">Template:</span>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTemplate(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              current === t.id
                ? "bg-brand-600 text-white"
                : "border border-[var(--border)] hover:bg-[var(--bg2)]"
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={assinar}
          disabled={pending}
          className="ml-auto rounded-lg border border-[var(--border)] px-4 py-1.5 text-sm font-semibold transition hover:bg-[var(--bg2)] disabled:opacity-60"
        >
          {pending ? "Enviando…" : "Enviar p/ assinatura"}
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Imprimir / Salvar PDF
        </button>
      </div>
      {aviso && (
        <p className="mt-2 rounded-md bg-[var(--bg2)] px-3 py-2 text-xs text-[var(--muted)]">
          {aviso}
        </p>
      )}
    </div>
  );
}
