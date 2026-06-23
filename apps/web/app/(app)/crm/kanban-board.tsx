"use client";

import { useState, useTransition } from "react";
import type { Lead } from "@/lib/types";
import { ESTAGIOS, ESTAGIO_COR } from "@/lib/constants";
import { money, moneyFull, dateBR, scoreBadgeColor } from "@/lib/format";
import { moveLead } from "./actions";

function iniciais(nome: string | null): string {
  const ps = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (ps.length === 0) return "—";
  if (ps.length === 1) return ps[0].slice(0, 2).toUpperCase();
  return (ps[0][0] + ps[ps.length - 1][0]).toUpperCase();
}

function ScoreRing({ score }: { score: number }) {
  const cor = scoreBadgeColor(score);
  const deg = Math.max(0, Math.min(100, score)) * 3.6;
  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(${cor} ${deg}deg, var(--bg2) 0deg)` }}
      title={`Score ${score}`}
    >
      <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-[var(--panel)] text-[11px] font-extrabold" style={{ color: cor }}>
        {score}
      </span>
    </span>
  );
}

export function KanbanBoard({ leads: inicial }: { leads: Lead[] }) {
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
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: status as Lead["status"] } : l)));
    startTransition(async () => {
      const res = await moveLead(id, status);
      if (res?.error) {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: anterior } : l)));
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
            className={`flex flex-col rounded-2xl border bg-[var(--bg2)] p-2.5 transition ${
              overCol === estagio
                ? "border-[var(--accent)] ring-2 ring-[var(--ring)]"
                : "border-[var(--border)]"
            }`}
          >
            <header className="mb-2.5 px-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide">
                  <span className="h-2 w-2 rounded-full" style={{ background: cor }} />
                  <span style={{ color: cor }}>{estagio}</span>
                </span>
                <span className="rounded-full bg-[var(--panel)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                  {col.length}
                </span>
              </div>
              <p className="mt-1.5 pl-4 text-[11px] font-bold text-[var(--muted)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                {money(total)}
              </p>
            </header>

            <div className="space-y-2">
              {col.map((l) => (
                <article
                  key={l.id}
                  draggable
                  onDragStart={() => setDragId(l.id)}
                  onDragEnd={() => setDragId(null)}
                  className={`cursor-grab rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 transition active:cursor-grabbing ${
                    dragId === l.id ? "opacity-40" : "hover:-translate-y-0.5"
                  }`}
                  style={{ borderLeft: `3px solid ${cor}`, boxShadow: "var(--shadow)" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-[13px] font-bold leading-tight">{l.cliente}</h3>
                      {l.empresa && <p className="truncate text-[11px] text-[var(--muted)]">{l.empresa}</p>}
                    </div>
                    <ScoreRing score={l.score} />
                  </div>

                  <p className="mt-2.5 text-[15px] font-extrabold tracking-tight text-[var(--accent)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {moneyFull(Number(l.valor))}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between border-t border-[var(--border)] pt-2">
                    <span className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                      <span className="grid h-5 w-5 place-items-center rounded-md bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[9px] font-bold text-[var(--accent)]">
                        {iniciais(l.responsavel)}
                      </span>
                      {l.responsavel ?? "—"}
                    </span>
                    <span className="text-[10.5px] text-[var(--muted)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {dateBR(l.ultimo)}
                    </span>
                  </div>
                </article>
              ))}
              {col.length === 0 && (
                <p className="rounded-lg border border-dashed border-[var(--border)] px-2 py-4 text-center text-[11px] text-[var(--muted)]">
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
