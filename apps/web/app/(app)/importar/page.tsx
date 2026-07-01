"use client";

import { useState, useTransition } from "react";
import { PageHeader } from "@/components/ui";
import { importData, type ImportResult } from "./actions";

export default function ImportarPage() {
  const [json, setJson] = useState("");
  const [res, setRes] = useState<ImportResult | null>(null);
  const [pending, start] = useTransition();

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(setJson);
  }

  function run() {
    setRes(null);
    start(async () => setRes(await importData(json)));
  }

  return (
    <div className="max-w-3xl p-5 md:p-7">
      <PageHeader
        title="Importar dados"
        subtitle="Migre os dados do NEXFLOW antigo para a nuvem. Tudo entra no seu tenant, isolado por RLS."
        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></svg>}
      />

      <ol className="list-decimal space-y-1.5 rounded-2xl border border-[var(--border)] bg-[var(--bg2)] p-4 pl-9 text-sm" style={{ boxShadow: "var(--shadow)" }}>
        <li>Abra o NEXFLOW antigo e pressione F12 (Console).</li>
        <li>
          Rode: <code className="rounded bg-[var(--panel)] px-1.5 py-0.5 text-xs">copy(JSON.stringify(localStorage))</code> ou exporte o backup em JSON.
        </li>
        <li>Cole abaixo (ou envie o arquivo) e clique em Importar.</li>
      </ol>

      <div className="mt-5">
        <input type="file" accept="application/json,.json" onChange={onFile} className="mb-3 block text-sm text-[var(--muted)] file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-[var(--border)] file:bg-[var(--panel)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[var(--text)]" />
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          placeholder='{ "leads": [...], "clientes": [...], "financeiro": [...] }'
          rows={10}
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3.5 font-mono text-xs outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      <button
        onClick={run}
        disabled={pending || json.trim() === ""}
        className="mt-4 rounded-xl px-5 py-2.5 font-bold text-white shadow-[0_12px_28px_-14px_rgba(37,99,235,.9)] transition hover:opacity-95 disabled:opacity-50"
        style={{ background: "linear-gradient(120deg,var(--accent),var(--brand-700,#003fa3))" }}
      >
        {pending ? "Importando…" : "Importar dados"}
      </button>

      {res?.error && (
        <p className="mt-4 rounded-xl border border-[color-mix(in_srgb,var(--bad)_30%,transparent)] bg-[color-mix(in_srgb,var(--bad)_10%,transparent)] px-4 py-3 text-sm text-[var(--bad)]">
          {res.error}
        </p>
      )}
      {res?.counts && (
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5" style={{ boxShadow: "var(--shadow)" }}>
          <p className="flex items-center gap-2 font-bold text-[var(--ok)]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14l-3-3" /></svg>
            Importação concluída
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {Object.entries(res.counts).map(([k, n]) => (
              <li key={k}><strong className="text-[var(--accent)]">{n}</strong> {k}</li>
            ))}
            {Object.keys(res.counts).length === 0 && (
              <li className="text-[var(--muted)]">Nenhum registro reconhecido no JSON.</li>
            )}
          </ul>
          <a href="/crm" className="mt-4 inline-block text-sm font-semibold text-[var(--accent)] hover:underline">Ver no CRM →</a>
        </div>
      )}
    </div>
  );
}
