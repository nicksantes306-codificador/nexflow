import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Budget, Client } from "@/lib/types";
import { PageHeader, TableShell, EmptyHint, StatusBadge } from "@/components/ui";
import { QuickCreate, type Field } from "@/components/quick-create";
import { moneyFull, dateBR } from "@/lib/format";
import { criarOrcamento } from "./actions";

export const dynamic = "force-dynamic";

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

  const campos: Field[] = [
    { name: "titulo", label: "Título", required: true, placeholder: "Painel CCM 800A" },
    {
      name: "client_id",
      label: "Cliente",
      type: "select",
      options: [
        { value: "", label: "— Sem cliente —" },
        ...clientes.map((c) => ({ value: c.id, label: c.nome })),
      ],
    },
    { name: "valor_total", label: "Valor (R$)", type: "number", placeholder: "0,00" },
    { name: "validade", label: "Validade", type: "date" },
  ];

  return (
    <div className="p-5 md:p-7">
      <PageHeader
        title="Orçamentos"
        subtitle={
          <>
            {orcamentos.length} orçamentos · total{" "}
            <span className="font-mono font-bold text-brand-600">
              {moneyFull(total)}
            </span>
          </>
        }
        action={
          <QuickCreate
            action={criarOrcamento}
            title="+ Novo orçamento"
            fields={campos}
          />
        }
      />

      {orcamentos.length === 0 ? (
        <EmptyHint>
          Nenhum orçamento ainda. A geração de PDF (3 templates + ART) entra no
          Sprint 4.
        </EmptyHint>
      ) : (
        <TableShell
          head={
            <tr>
              <th className="px-4 py-2.5">Nº</th>
              <th className="px-4 py-2.5">Título</th>
              <th className="px-4 py-2.5">Cliente</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Validade</th>
              <th className="px-4 py-2.5 text-right">Valor</th>
            </tr>
          }
        >
          {orcamentos.map((o) => (
            <tr key={o.id} className="hover:bg-[var(--bg2)]">
              <td className="px-4 py-2.5 font-mono text-xs text-[var(--muted)]">
                {o.numero ?? "—"}
              </td>
              <td className="px-4 py-2.5 font-semibold">
                <Link href={`/orcamentos/${o.id}`} className="hover:text-brand-600 hover:underline">
                  {o.titulo}
                </Link>
              </td>
              <td className="px-4 py-2.5">
                {o.client_id ? (nomePorId.get(o.client_id) ?? "—") : "—"}
              </td>
              <td className="px-4 py-2.5">
                <StatusBadge status={o.status} />
              </td>
              <td className="px-4 py-2.5 text-[var(--muted)]">
                {dateBR(o.validade)}
              </td>
              <td className="px-4 py-2.5 text-right font-mono font-bold text-brand-600">
                {moneyFull(Number(o.valor_total))}
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
