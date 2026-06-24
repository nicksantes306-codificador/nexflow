import { createClient } from "@/lib/supabase/server";
import type { FinanceEntry } from "@/lib/types";
import {
  PageHeader,
  TableShell,
  EmptyHint,
  StatusBadge,
  KpiCard,
} from "@/components/ui";
import { QuickCreate, type Field } from "@/components/quick-create";
import { moneyFull, dateBR } from "@/lib/format";
import { criarLancamento } from "./actions";

export const dynamic = "force-dynamic";

const CAMPOS: Field[] = [
  {
    name: "tipo",
    label: "Tipo",
    type: "select",
    required: true,
    options: [
      { value: "Entrada", label: "Entrada" },
      { value: "Saída", label: "Saída" },
    ],
  },
  { name: "descricao", label: "Descrição", required: true, placeholder: "Sinal obra X" },
  { name: "valor", label: "Valor (R$)", type: "number", placeholder: "0,00" },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "Pendente", label: "Pendente" },
      { value: "Recebido", label: "Recebido" },
      { value: "Pago", label: "Pago" },
      { value: "Atrasado", label: "Atrasado" },
    ],
  },
  { name: "data", label: "Data", type: "date" },
  { name: "categoria", label: "Categoria", placeholder: "Serviços" },
];

export default async function FinanceiroPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("finance_entries")
    .select("*")
    .order("data", { ascending: false });
  const entradas = (data ?? []) as FinanceEntry[];

  // DRE simplificado (regime de caixa + previsto).
  const soma = (filtro: (e: FinanceEntry) => boolean) =>
    entradas.filter(filtro).reduce((a, e) => a + Number(e.valor), 0);

  const recebido = soma((e) => e.tipo === "Entrada" && e.status === "Recebido");
  const aReceber = soma(
    (e) => e.tipo === "Entrada" && (e.status === "Pendente" || e.status === "Atrasado"),
  );
  const pago = soma((e) => e.tipo === "Saída" && e.status === "Pago");
  const saldo = recebido - pago;

  return (
    <div className="p-5 md:p-7">
      <PageHeader
        title="Financeiro"
        subtitle="Contas a pagar, a receber e o caixa da empresa"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" /></svg>
        }
        action={
          <QuickCreate
            action={criarLancamento}
            title="+ Novo lançamento"
            fields={CAMPOS}
          />
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Recebido" value={moneyFull(recebido)} tone="green" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>} />
        <KpiCard label="A receber" value={moneyFull(aReceber)} tone="amber" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>} />
        <KpiCard label="Saídas pagas" value={moneyFull(pago)} tone="red" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l6 6 4-4 8 8" /><path d="M21 17v-4h-4" /></svg>} />
        <KpiCard
          label="Saldo de caixa"
          value={moneyFull(saldo)}
          tone={saldo >= 0 ? "green" : "red"}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" /></svg>}
          hint="recebido − pago"
        />
      </div>

      {entradas.length === 0 ? (
        <EmptyHint>Nenhum lançamento ainda.</EmptyHint>
      ) : (
        <TableShell
          head={
            <tr>
              <th className="px-4 py-2.5">Data</th>
              <th className="px-4 py-2.5">Descrição</th>
              <th className="px-4 py-2.5">Categoria</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Valor</th>
            </tr>
          }
        >
          {entradas.map((e) => (
            <tr key={e.id} className="hover:bg-[var(--bg2)]">
              <td className="px-4 py-2.5 text-[var(--muted)]">{dateBR(e.data)}</td>
              <td className="px-4 py-2.5 font-semibold">{e.descricao}</td>
              <td className="px-4 py-2.5 text-[var(--muted)]">
                {e.categoria ?? "—"}
              </td>
              <td className="px-4 py-2.5">
                <StatusBadge status={e.status} />
              </td>
              <td
                className="px-4 py-2.5 text-right font-mono font-bold"
                style={{
                  color:
                    e.tipo === "Entrada"
                      ? "var(--stage-aprovado)"
                      : "var(--stage-perdido)",
                }}
              >
                {e.tipo === "Entrada" ? "+" : "−"}
                {moneyFull(Number(e.valor))}
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
