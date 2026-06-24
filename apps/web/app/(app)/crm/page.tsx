import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/lib/types";
import { ESTAGIOS } from "@/lib/constants";
import { money } from "@/lib/format";
import { PageHeader, KpiCard } from "@/components/ui";
import { KanbanBoard } from "./kanban-board";

export const dynamic = "force-dynamic";

const ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" /></svg>
);

export default async function CrmPage() {
  const supabase = await createClient();
  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .order("valor", { ascending: false });

  const lista = (leads ?? []) as Lead[];
  const noPipeline = lista.filter((l) => ESTAGIOS.includes(l.status as (typeof ESTAGIOS)[number]));
  const pipeline = noPipeline.reduce((a, l) => a + Number(l.valor), 0);
  const ganhos = lista.filter((l) => l.status === "Aprovado").length;
  const conversao = lista.length ? Math.round((ganhos / lista.length) * 100) : 0;

  return (
    <div className="p-5 md:p-7">
      <PageHeader
        title="Funil de vendas"
        subtitle="Acompanhe cada cliente em potencial até fechar o negócio. Arraste os cartões entre as etapas."
        icon={ICON}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Negócios em aberto" value={String(noPipeline.length)} hint={`${lista.length} no total`} />
        <KpiCard label="Em negociação" value={money(pipeline)} tone="green" hint="valor somado" />
        <KpiCard label="Negócios fechados" value={String(ganhos)} />
        <KpiCard label="Taxa de fechamento" value={`${conversao}%`} hint="quantos viraram negócio" />
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--muted)]">
          Não foi possível carregar os leads: {error.message}
          <br />
          Dica: rode <code>supabase/seed.sql</code> e <code>select public.attach_me_to_demo();</code> para popular a demo.
        </p>
      )}

      <KanbanBoard leads={lista} />
    </div>
  );
}
