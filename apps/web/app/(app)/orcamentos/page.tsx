import { createClient } from "@/lib/supabase/server";
import type { Budget, Client } from "@/lib/types";
import { PageHeader, EmptyHint, KpiCard } from "@/components/ui";
import { QuickCreate, type Field } from "@/components/quick-create";
import { ExportButton } from "@/components/export-button";
import { OrcTable } from "./orc-table";
import { moneyFull } from "@/lib/format";
import { criarOrcamento } from "./actions";

export const dynamic = "force-dynamic";

const I = {
  file: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h6" /></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14l-3-3" /></svg>,
  money: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
};

export default async function OrcamentosPage() {
  const supabase = await createClient();
  const [{ data: orc }, { data: cli }] = await Promise.all([
    supabase.from("budgets").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("id,nome").order("nome"),
  ]);
  const orcamentos = (orc ?? []) as Budget[];
  const clientes = (cli ?? []) as Pick<Client, "id" | "nome">[];

  const total = orcamentos.reduce((a, o) => a + Number(o.valor_total), 0);
  const aprovados = orcamentos.filter((o) => o.status === "aprovado").length;
  const taxa = orcamentos.length ? Math.round((aprovados / orcamentos.length) * 100) : 0;

  const campos: Field[] = [
    { name: "titulo", label: "Título", required: true, placeholder: "Painel CCM 800A" },
    { name: "client_id", label: "Cliente", type: "select", options: [{ value: "", label: "— Sem cliente —" }, ...clientes.map((c) => ({ value: c.id, label: c.nome }))] },
    { name: "valor_total", label: "Valor (R$)", type: "number", placeholder: "0,00" },
    { name: "validade", label: "Validade", type: "date" },
  ];

  return (
    <div className="p-5 md:p-7">
      <PageHeader
        title="Orçamentos"
        subtitle={`${orcamentos.length} orçamentos cadastrados`}
        icon={I.file}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {orcamentos.length > 0 && <ExportButton tipo="orcamentos" />}
            <QuickCreate action={criarOrcamento} title="+ Novo orçamento" fields={campos} />
          </div>
        }
      />

      {orcamentos.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Total de orçamentos" value={String(orcamentos.length)} icon={I.file} />
          <KpiCard label="Aprovados" value={String(aprovados)} tone="green" icon={I.check} />
          <KpiCard label="Valor total" value={moneyFull(total)} icon={I.money} />
          <KpiCard label="Taxa de aprovação" value={`${taxa}%`} hint="aprovados / total" />
        </div>
      )}

      {orcamentos.length === 0 ? (
        <EmptyHint title="Nenhum orçamento ainda">Crie o primeiro e gere o PDF (3 modelos + ART).</EmptyHint>
      ) : (
        <OrcTable linhas={orcamentos} clientes={clientes} />
      )}
    </div>
  );
}
