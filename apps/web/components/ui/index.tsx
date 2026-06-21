// Componentes leves compartilhados (server-safe — sem hooks de client).
// Linguagem premium NEXFLOW: superfícies suaves, tokens claro/escuro, PT-BR.

export function PageHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        {icon && (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--accent)_22%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)] [&_svg]:h-5 [&_svg]:w-5">
            {icon}
          </span>
        )}
        <div>
          <h1 className="text-[22px] font-extrabold leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-[13px] text-[var(--muted)]">{subtitle}</p>}
        </div>
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
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "green" | "red" | "amber";
  icon?: React.ReactNode;
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
    <div
      className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
        {icon && <span className="text-[var(--muted)] [&_svg]:h-[18px] [&_svg]:w-[18px]">{icon}</span>}
      </div>
      <p
        className="mt-2 text-2xl font-extrabold tracking-tight"
        style={{ color: cor, fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] text-[var(--muted)]">{hint}</p>}
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
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ color: cor, background: `color-mix(in srgb, ${cor} 15%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cor }} />
      {status}
    </span>
  );
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--panel)] p-10 text-center text-sm text-[var(--muted)]">
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
    <div
      className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)]"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <table className="w-full text-sm">
        <thead className="border-b border-[var(--border)] bg-[var(--bg2)] text-left text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
          {head}
        </thead>
        <tbody className="divide-y divide-[var(--border)]">{children}</tbody>
      </table>
    </div>
  );
}
