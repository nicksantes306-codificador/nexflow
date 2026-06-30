"use client";

import { useMemo, useState } from "react";

export type Coluna<T> = {
  chave: string;
  titulo: string;
  alinhar?: "dir";
  largura?: string; // classe de largura no <th> (ex.: "w-10")
  ordenavel?: boolean;
  valor?: (row: T) => string | number; // valor usado para ordenar
  cell: (row: T) => React.ReactNode;
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Tabela de dados reutilizável: busca + ordenação por coluna + paginação,
// tudo no cliente (rápido para o volume de uma PME). Mantém células sob medida.
export function DataTable<T>({
  linhas,
  colunas,
  busca,
  buscaPlaceholder = "Buscar nesta lista…",
  porPagina = 12,
  idDe,
  vazio = "Nada encontrado.",
}: {
  linhas: T[];
  colunas: Coluna<T>[];
  busca?: (row: T) => string;
  buscaPlaceholder?: string;
  porPagina?: number;
  idDe?: (row: T) => string;
  vazio?: React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const [ordem, setOrdem] = useState<{ chave: string; dir: 1 | -1 } | null>(null);
  const [pagina, setPagina] = useState(0);

  const filtradas = useMemo(() => {
    let r = linhas;
    const n = norm(q.trim());
    if (n && busca) r = r.filter((x) => norm(busca(x)).includes(n));
    if (ordem) {
      const col = colunas.find((c) => c.chave === ordem.chave);
      if (col?.valor) {
        r = [...r].sort((a, b) => {
          const va = col.valor!(a);
          const vb = col.valor!(b);
          if (va < vb) return -ordem.dir;
          if (va > vb) return ordem.dir;
          return 0;
        });
      }
    }
    return r;
  }, [linhas, q, ordem, colunas, busca]);

  const totalPag = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const pag = Math.min(pagina, totalPag - 1);
  const visiveis = filtradas.slice(pag * porPagina, pag * porPagina + porPagina);

  function ordenar(chave: string) {
    setOrdem((o) => (o?.chave === chave ? { chave, dir: o.dir === 1 ? -1 : 1 } : { chave, dir: 1 }));
    setPagina(0);
  }

  return (
    <div>
      {busca && (
        <label className="mb-3 flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3.5 py-2.5">
          <svg className="h-4 w-4 shrink-0 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPagina(0); }}
            placeholder={buscaPlaceholder}
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
          />
          {q && <button type="button" onClick={() => setQ("")} aria-label="Limpar" className="text-[var(--muted)] hover:text-[var(--text)]">✕</button>}
        </label>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)]" style={{ boxShadow: "var(--shadow)" }}>
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--bg2)] text-left text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            <tr>
              {colunas.map((c) => {
                const ativa = ordem?.chave === c.chave;
                return (
                  <th
                    key={c.chave}
                    className={`px-4 py-3 ${c.largura ?? ""} ${c.alinhar === "dir" ? "text-right" : ""} ${c.ordenavel ? "cursor-pointer select-none transition hover:text-[var(--text)]" : ""}`}
                    onClick={c.ordenavel ? () => ordenar(c.chave) : undefined}
                    aria-sort={ativa ? (ordem!.dir === 1 ? "ascending" : "descending") : undefined}
                  >
                    <span className={`inline-flex items-center gap-1 ${c.alinhar === "dir" ? "flex-row-reverse" : ""}`}>
                      {c.titulo}
                      {c.ordenavel && (
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: ativa ? 1 : 0.35 }}>
                          {!ativa ? <path d="m8 9 4-4 4 4M16 15l-4 4-4-4" /> : ordem!.dir === 1 ? <path d="m6 15 6-6 6 6" /> : <path d="m6 9 6 6 6-6" />}
                        </svg>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {visiveis.length === 0 ? (
              <tr><td colSpan={colunas.length} className="px-4 py-10 text-center text-sm text-[var(--muted)]">{vazio}</td></tr>
            ) : (
              visiveis.map((row, i) => (
                <tr key={idDe ? idDe(row) : i} className="transition hover:bg-[var(--bg2)]">
                  {colunas.map((c) => (
                    <td key={c.chave} className={`px-4 py-3 ${c.alinhar === "dir" ? "text-right" : ""}`}>{c.cell(row)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtradas.length > porPagina && (
        <div className="mt-3 flex items-center justify-between text-[13px] text-[var(--muted)]">
          <span>{filtradas.length} {filtradas.length === 1 ? "item" : "itens"}</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPagina((p) => Math.max(0, p - 1))} disabled={pag === 0} className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] transition hover:bg-[var(--bg2)] disabled:opacity-30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <span className="tabular-nums">{pag + 1} / {totalPag}</span>
            <button type="button" onClick={() => setPagina((p) => Math.min(totalPag - 1, p + 1))} disabled={pag >= totalPag - 1} className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] transition hover:bg-[var(--bg2)] disabled:opacity-30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
