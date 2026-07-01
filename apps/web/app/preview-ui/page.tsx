import { notFound } from "next/navigation";
import { PageHeader, KpiCard, StatusBadge, EmptyHint } from "@/components/ui";

// Vitrine de componentes SÓ para desenvolvimento (verificação visual local).
// Em produção devolve 404 — nunca expõe nada.
export default function PreviewUI() {
  if (process.env.NODE_ENV === "production") notFound();

  const ICON = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" rx="1" /><rect x="12" y="7" width="3" height="10" rx="1" /><rect x="17" y="13" width="3" height="4" rx="1" /></svg>
  );

  return (
    <main className="min-h-screen bg-[var(--bg)] p-8">
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Vitrine de componentes" subtitle="Página de desenvolvimento — verificação visual" icon={ICON} />
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Faturamento" value="R$ 1,2 mi" hint="no período" icon={ICON} />
          <KpiCard label="Recebido" value="R$ 480 mil" tone="green" icon={ICON} />
          <KpiCard label="Atrasado" value="R$ 32 mil" tone="red" icon={ICON} />
          <KpiCard label="Pendente" value="R$ 96 mil" tone="amber" icon={ICON} />
        </div>
        <div className="mb-6 flex gap-2">
          <StatusBadge status="aprovado" />
          <StatusBadge status="enviado" />
          <StatusBadge status="Pendente" />
          <StatusBadge status="Atrasado" />
        </div>
        <EmptyHint title="Estado vazio">Exemplo de bloco vazio ilustrado.</EmptyHint>
      </div>
    </main>
  );
}
