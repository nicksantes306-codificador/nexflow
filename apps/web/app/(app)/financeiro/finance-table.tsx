"use client";

import type { FinanceEntry } from "@/lib/types";
import { StatusBadge } from "@/components/ui";
import { DataTable, type Coluna } from "@/components/data-table";
import { EditRecord } from "@/components/edit-record";
import { DeleteButton } from "@/components/delete-button";
import type { Field } from "@/components/quick-create";
import { moneyFull, dateBR } from "@/lib/format";
import { editarLancamento } from "./actions";

const CAMPOS: Field[] = [
  { name: "tipo", label: "Tipo", type: "select", required: true, options: [{ value: "Entrada", label: "Entrada" }, { value: "Saída", label: "Saída" }] },
  { name: "descricao", label: "Descrição", required: true },
  { name: "valor", label: "Valor (R$)", type: "number" },
  { name: "status", label: "Status", type: "select", options: [{ value: "Pendente", label: "Pendente" }, { value: "Recebido", label: "Recebido" }, { value: "Pago", label: "Pago" }, { value: "Atrasado", label: "Atrasado" }] },
  { name: "data", label: "Data", type: "date" },
  { name: "categoria", label: "Categoria" },
];

export function FinanceTable({ linhas }: { linhas: FinanceEntry[] }) {
  const colunas: Coluna<FinanceEntry>[] = [
    { chave: "data", titulo: "Data", ordenavel: true, valor: (e) => e.data ?? "", cell: (e) => <span className="text-[var(--muted)]">{dateBR(e.data)}</span> },
    { chave: "descricao", titulo: "Descrição", ordenavel: true, valor: (e) => e.descricao.toLowerCase(), cell: (e) => <span className="font-semibold">{e.descricao}</span> },
    { chave: "categoria", titulo: "Categoria", cell: (e) => <span className="text-[var(--muted)]">{e.categoria ?? "—"}</span> },
    { chave: "status", titulo: "Status", ordenavel: true, valor: (e) => e.status, cell: (e) => <StatusBadge status={e.status} /> },
    { chave: "valor", titulo: "Valor", alinhar: "dir", ordenavel: true, valor: (e) => Number(e.valor), cell: (e) => (
      <span className="font-mono font-bold" style={{ color: e.tipo === "Entrada" ? "var(--stage-aprovado)" : "var(--stage-perdido)" }}>{e.tipo === "Entrada" ? "+" : "−"}{moneyFull(Number(e.valor))}</span>
    ) },
    { chave: "acoes", titulo: "", largura: "w-20", cell: (e) => (
      <div className="flex items-center justify-end gap-1.5">
        <EditRecord action={editarLancamento} titulo="Editar lançamento" fields={CAMPOS} initial={{ id: e.id, tipo: e.tipo, descricao: e.descricao, valor: e.valor, status: e.status, data: e.data, categoria: e.categoria ?? "" }} />
        <DeleteButton tabela="finance_entries" id={e.id} path="/financeiro" nome={e.descricao} />
      </div>
    ) },
  ];

  return (
    <DataTable
      linhas={linhas}
      colunas={colunas}
      idDe={(e) => e.id}
      busca={(e) => `${e.descricao} ${e.categoria ?? ""} ${e.status} ${e.tipo}`}
      buscaPlaceholder="Buscar lançamento, categoria, status…"
      vazio="Nenhum lançamento encontrado."
    />
  );
}
