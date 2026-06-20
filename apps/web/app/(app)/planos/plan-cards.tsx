"use client";

import { useState, useTransition } from "react";
import { PLANS, formatBRLFromCents } from "@/lib/billing/plans";
import { assinarPlano, type CheckoutResult } from "./actions";

export function PlanCards({ currentPlan }: { currentPlan: string }) {
  const [pending, start] = useTransition();
  const [sel, setSel] = useState<string | null>(null);
  const [res, setRes] = useState<CheckoutResult | null>(null);

  function assinar(planId: string) {
    setSel(planId);
    setRes(null);
    start(async () => setRes(await assinarPlano(planId)));
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const atual = p.id === currentPlan;
          return (
            <div
              key={p.id}
              className={`relative rounded-[var(--radius-card)] border bg-[var(--panel)] p-5 ${
                p.destaque
                  ? "border-brand-600 shadow-lg"
                  : "border-[var(--border)]"
              }`}
            >
              {p.destaque && (
                <span className="absolute -top-2.5 left-5 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  MAIS POPULAR
                </span>
              )}
              <h3 className="text-lg font-extrabold">{p.nome}</h3>
              <p className="mt-0.5 text-xs text-[var(--muted)]">{p.resumo}</p>
              <p className="mt-3 font-mono text-2xl font-extrabold text-brand-600">
                {formatBRLFromCents(p.priceCents)}
                <span className="text-sm font-medium text-[var(--muted)]">/mês</span>
              </p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-[var(--stage-aprovado)]">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                disabled={pending || atual}
                onClick={() => assinar(p.id)}
                className={`mt-5 w-full rounded-lg py-2.5 text-sm font-semibold transition ${
                  atual
                    ? "cursor-default bg-[var(--bg2)] text-[var(--muted)]"
                    : "bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
                }`}
              >
                {atual
                  ? "Plano atual"
                  : pending && sel === p.id
                    ? "Gerando PIX…"
                    : "Assinar"}
              </button>
            </div>
          );
        })}
      </div>

      {res?.error && (
        <p className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {res.error}
        </p>
      )}
      {res?.pixCode && (
        <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--panel)] p-4">
          <p className="font-semibold text-[var(--stage-aprovado)]">
            PIX gerado ✓ — pague para ativar
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Copia-e-cola (expira em {res.expiresAt}):
          </p>
          <code className="mt-1 block break-all rounded bg-[var(--bg2)] p-2 font-mono text-xs">
            {res.pixCode}
          </code>
          {res.url && (
            <a
              href={res.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm text-brand-600 underline"
            >
              Abrir fatura na Iugu →
            </a>
          )}
        </div>
      )}
    </>
  );
}
