import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Budget, Client } from "@/lib/types";
import { PageHeader, TableShell, EmptyHint, StatusBadge, KpiCard } from "@/components/ui";
import { QuickCreate, type Field } from "@/components/quick-create";
import { DeleteButton } from "@/components/delete-button";
import { moneyFull, dateBR } from "@/lib/format";
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
  const nomePorId = new Map(clientes.map((c) => [c.id, c.nome]));

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
        action={<QuickCreate action={criarOrcamento} title="+ Novo orçamento" fields={campos} />}
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
        <EmptyHint>Nenhum orçamento ainda. Crie o primeiro e gere o PDF (3 templates + ART).</EmptyHint>
      ) : (
        <TableShell
          head={
            <tr>
              <th className="px-4 py-3">Nº</th>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Validade</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          }
        >
          {orcamentos.map((o) => (
            <tr key={o.id} className="transition hover:bg-[var(--bg2)]">
              <td className="px-4 py-3">
                <span className="rounded-md bg-[var(--bg2)] px-2 py-0.5 font-mono text-[11px] text-[var(--muted)]">{o.numero ?? "—"}</span>
              </td>
              <td className="px-4 py-3 font-semibold">
                <Link href={`/orcamentos/${o.id}`} className="transition hover:text-[var(--accent)]">{o.titulo}</Link>
              </td>
              <td className="px-4 py-3 text-[var(--muted)]">{o.client_id ? (nomePorId.get(o.client_id) ?? "—") : "—"}</td>
              <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
              <td className="px-4 py-3 text-[var(--muted)]">{dateBR(o.validade)}</td>
              <td className="px-4 py-3 text-right font-bold text-[var(--accent)]" style={{ fontVariantNumeric: "tabular-nums" }}>{moneyFull(Number(o.valor_total))}</td>
              <td className="px-2 py-3"><DeleteButton tabela="budgets" id={o.id} path="/orcamentos" nome={o.titulo} /></td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
