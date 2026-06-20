"use client";

import { useState, useTransition } from "react";
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
      <h1 className="text-2xl font-extrabold tracking-tight">
        Importar dados locais
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Migre os dados do NEXFLOW antigo (arquivo único HTML) para a sua conta na
        nuvem. Tudo entra no <strong>seu tenant</strong>, isolado por RLS.
      </p>

      <ol className="mt-4 list-decimal space-y-1 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg2)] p-4 pl-8 text-sm">
        <li>Abra o NEXFLOW antigo e pressione F12 (Console).</li>
        <li>
          Rode:{" "}
          <code className="rounded bg-[var(--panel)] px-1.5 py-0.5 text-xs">
            copy(JSON.stringify(localStorage))
          </code>{" "}
          ou exporte o backup em JSON.
        </li>
        <li>Cole abaixo (ou envie o arquivo) e clique em Importar.</li>
      </ol>

      <div className="mt-4">
        <input
          type="file"
          accept="application/json,.json"
          onChange={onFile}
          className="mb-3 block text-sm"
        />
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          placeholder='{ "leads": [...], "clientes": [...], "financeiro": [...] }'
          rows={10}
          className="w-full rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--panel)] p-3 font-mono text-xs outline-none focus:border-brand-600"
        />
      </div>

      <button
        onClick={run}
        disabled={pending || json.trim() === ""}
        className="mt-3 rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {pending ? "Importando…" : "Importar dados"}
      </button>

      {res?.error && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {res.error}
        </p>
      )}
      {res?.counts && (
        <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--panel)] p-4">
          <p className="font-semibold text-[var(--stage-aprovado)]">
            Importação concluída ✓
          </p>
          <ul className="mt-2 space-y-0.5 text-sm">
            {Object.entries(res.counts).map(([k, n]) => (
              <li key={k}>
                <strong>{n}</strong> {k}
              </li>
            ))}
            {Object.keys(res.counts).length === 0 && (
              <li className="text-[var(--muted)]">
                Nenhum registro reconhecido no JSON.
              </li>
            )}
          </ul>
          <a href="/crm" className="mt-3 inline-block text-sm text-brand-600 underline">
            Ver no CRM →
          </a>
        </div>
      )}
    </div>
  );
}
