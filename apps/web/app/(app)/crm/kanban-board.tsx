"use client";

import { useState, useTransition } from "react";
import type { Lead } from "@/lib/types";
import { ESTAGIOS, ESTAGIO_COR } from "@/lib/constants";
import { money, moneyFull, dateBR, scoreBadgeColor } from "@/lib/format";
import { moveLead } from "./actions";

export function KanbanBoard({ leads: inicial }: { leads: Lead[] }) {
  // Estado local p/ mover otimista — o server action persiste no Supabase.
  const [leads, setLeads] = useState<Lead[]>(inicial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function onDrop(status: string) {
    const id = dragId;
    setOverCol(null);
    setDragId(null);
    if (!id) return;

    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.status === status) return;

    const anterior = lead.status;
    // 1) move otimista na UI
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: status as Lead["status"] } : l)),
    );
    // 2) persiste; em erro, reverte
    startTransition(async () => {
      const res = await moveLead(id, status);
      if (res?.error) {
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: anterior } : l)),
        );
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {ESTAGIOS.map((estagio) => {
        const col = leads.filter((l) => l.status === estagio);
        const total = col.reduce((a, l) => a + Number(l.valor), 0);
        const cor = ESTAGIO_COR[estagio];

        return (
          <section
            key={estagio}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(estagio);
            }}
            onDragLeave={() => setOverCol((c) => (c === estagio ? null : c))}
            onDrop={() => onDrop(estagio)}
            className={`rounded-[var(--radius-card)] border bg-[var(--bg2)] p-3 transition ${
              overCol === estagio
                ? "border-brand-600 ring-2 ring-brand-600/20"
                : "border-[var(--border)]"
            }`}
          >
            <header className="mb-2 flex items-center justify-between">
              <span
                className="text-[10.5px] font-extrabold uppercase tracking-wide"
                style={{ color: cor }}
              >
                {estagio}
              </span>
              <span className="rounded-full bg-[var(--panel)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                {col.length}
              </span>
            </header>
            <p className="mb-3 font-mono text-[10px] font-semibold text-[var(--muted)]">
              {money(total)}
            </p>

            <div className="space-y-2">
              {col.map((l) => (
                <article
                  key={l.id}
                  draggable
                  onDragStart={() => setDragId(l.id)}
                  onDragEnd={() => setDragId(null)}
                  className={`cursor-grab rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3 shadow-sm transition active:cursor-grabbing ${
                    dragId === l.id ? "opacity-40" : "hover:-translate-y-0.5 hover:shadow-md"
                  }`}
                  style={{ borderLeft: `3px solid ${cor}` }}
                >
                  <h3 className="text-[12.5px] font-bold leading-tight">
                    {l.cliente}
                  </h3>
                  <p className="mt-1 font-mono text-[11px] font-bold text-brand-600">
                    {moneyFull(Number(l.valor))}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                      style={{ background: scoreBadgeColor(l.score) }}
                    >
                      {l.score}
                    </span>
                    <span className="text-[10.5px] text-[var(--muted)]">
                      {dateBR(l.ultimo)}
                    </span>
                  </div>
                </article>
              ))}
              {col.length === 0 && (
                <p className="px-1 py-1.5 text-[11px] text-[var(--muted)]">
                  Arraste um lead para cá
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
