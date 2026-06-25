// Baixa a lista atual em CSV (abre no Excel). Anexo gerado em /api/export.
export function ExportButton({ tipo }: { tipo: "clientes" | "financeiro" | "obras" | "orcamentos" }) {
  return (
    <a
      href={`/api/export?tipo=${tipo}`}
      title="Baixar em Excel/CSV"
      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3.5 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
      </svg>
      Exportar
    </a>
  );
}
