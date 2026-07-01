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
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white [&_svg]:h-5 [&_svg]:w-5"
            style={{
              background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent-2) 65%, var(--accent)))",
              boxShadow: "0 8px 20px -8px color-mix(in srgb, var(--accent) 65%, transparent)",
            }}
          >
            {icon}
          </span>
        )}
        <div>
          <h1 className="text-[22px] font-extrabold leading-tight tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{title}</h1>
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
  const acento = tone === "default" ? "var(--accent)" : cor;
  return (
    <div
      className="nx-lift group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
      style={{ boxShadow: "var(--shadow)" }}
    >
      {/* barra de acento que cresce no hover */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
        style={{ background: `linear-gradient(90deg, ${acento}, color-mix(in srgb, var(--accent-2) 70%, ${acento}))` }}
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
        {icon && (
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors [&_svg]:h-[16px] [&_svg]:w-[16px]"
            style={{ color: acento, background: `color-mix(in srgb, ${acento} 11%, transparent)` }}
          >
            {icon}
          </span>
        )}
      </div>
      <p
        className="mt-2 text-2xl font-extrabold tracking-tight"
        style={{ color: cor, fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-display)" }}
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

export function EmptyHint({
  children,
  icon,
  title,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--panel)] px-6 py-12 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)] [&_svg]:h-7 [&_svg]:w-7">
        {icon ?? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v10l9 4 9-4V7" /><path d="M12 11v10" />
          </svg>
        )}
      </span>
      {title && <p className="mb-1.5 text-[15px] font-bold text-[var(--text)]">{title}</p>}
      <div className="max-w-md text-sm leading-relaxed text-[var(--muted)]">{children}</div>
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
