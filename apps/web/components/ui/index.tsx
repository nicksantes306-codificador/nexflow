// Componentes leves compartilhados (server-safe — sem hooks de client).
// Semente do que vira @nexflow/ui (shadcn) no Sprint 3.

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
        )}
      </div>
      {action}
    </header>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "green" | "red" | "amber";
}) {
  const cor =
    tone === "green"
      ? "var(--stage-aprovado)"
      : tone === "red"
        ? "var(--stage-perdido)"
        : tone === "amber"
          ? "var(--stage-negociacao)"
          : "var(--text)";
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--panel)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 font-mono text-xl font-extrabold" style={{ color: cor }}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

const BADGE_TONES: Record<string, string> = {
  rascunho: "var(--muted)",
  enviado: "var(--stage-orcamento)",
  aprovado: "var(--stage-aprovado)",
  recusado: "var(--stage-perdido)",
  expirado: "var(--stage-negociacao)",
  Pendente: "var(--stage-negociacao)",
  Pago: "var(--stage-aprovado)",
  Recebido: "var(--stage-aprovado)",
  Atrasado: "var(--stage-perdido)",
  Cancelado: "var(--muted)",
};

export function StatusBadge({ status }: { status: string }) {
  const cor = BADGE_TONES[status] ?? "var(--muted)";
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
      style={{ background: cor }}
    >
      {status}
    </span>
  );
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--border)] bg-[var(--panel)] p-8 text-center text-sm text-[var(--muted)]">
      {children}
    </div>
  );
}

export function TableShell({
  head,
  children,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--panel)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--bg2)] text-left text-[11px] uppercase tracking-wide text-[var(--muted)]">
          {head}
        </thead>
        <tbody className="divide-y divide-[var(--border)]">{children}</tbody>
      </table>
    </div>
  );
}
