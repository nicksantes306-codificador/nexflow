"use client";

import Link from "next/link";
import type { Budget, Client } from "@/lib/types";
import { StatusBadge } from "@/components/ui";
import { DataTable, type Coluna } from "@/components/data-table";
import { EditRecord } from "@/components/edit-record";
import { DeleteButton } from "@/components/delete-button";
import type { Field } from "@/components/quick-create";
import { moneyFull, dateBR } from "@/lib/format";
import { editarOrcamento } from "./actions";

const STATUS_ORC = [
  { value: "rascunho", label: "Rascunho" },
  { value: "enviado", label: "Enviado" },
  { value: "aprovado", label: "Aprovado" },
  { value: "recusado", label: "Recusado" },
];

export function OrcTable({ linhas, clientes }: { linhas: Budget[]; clientes: Pick<Client, "id" | "nome">[] }) {
  const nomePorId = new Map(clientes.map((c) => [c.id, c.nome]));
  const campos: Field[] = [
    { name: "titulo", label: "Título", required: true },
    { name: "client_id", label: "Cliente", type: "select", options: [{ value: "", label: "— Sem cliente —" }, ...clientes.map((c) => ({ value: c.id, label: c.nome }))] },
    { name: "valor_total", label: "Valor (R$)", type: "number" },
    { name: "validade", label: "Validade", type: "date" },
    { name: "status", label: "Status", type: "select", options: STATUS_ORC },
  ];
  const nomeCli = (o: Budget) => (o.client_id ? nomePorId.get(o.client_id) ?? "" : "");

  const colunas: Coluna<Budget>[] = [
    { chave: "numero", titulo: "Nº", ordenavel: true, valor: (o) => o.numero ?? "", cell: (o) => <span className="rounded-md bg-[var(--bg2)] px-2 py-0.5 font-mono text-[11px] text-[var(--muted)]">{o.numero ?? "—"}</span> },
    { chave: "titulo", titulo: "Título", ordenavel: true, valor: (o) => o.titulo.toLowerCase(), cell: (o) => <Link href={`/orcamentos/${o.id}`} className="font-semibold transition hover:text-[var(--accent)]">{o.titulo}</Link> },
    { chave: "cliente", titulo: "Cliente", ordenavel: true, valor: (o) => nomeCli(o).toLowerCase(), cell: (o) => <span className="text-[var(--muted)]">{nomeCli(o) || "—"}</span> },
    { chave: "status", titulo: "Status", ordenavel: true, valor: (o) => o.status, cell: (o) => <StatusBadge status={o.status} /> },
    { chave: "validade", titulo: "Validade", ordenavel: true, valor: (o) => o.validade ?? "", cell: (o) => <span className="text-[var(--muted)]">{dateBR(o.validade)}</span> },
    { chave: "valor", titulo: "Valor", alinhar: "dir", ordenavel: true, valor: (o) => Number(o.valor_total), cell: (o) => <span className="font-bold text-[var(--accent)]" style={{ fontVariantNumeric: "tabular-nums" }}>{moneyFull(Number(o.valor_total))}</span> },
    { chave: "acoes", titulo: "", largura: "w-20", cell: (o) => (
      <div className="flex items-center justify-end gap-1.5">
        <EditRecord action={editarOrcamento} titulo="Editar orçamento" fields={campos} initial={{ id: o.id, titulo: o.titulo, client_id: o.client_id ?? "", valor_total: o.valor_total, validade: o.validade ?? "", status: o.status }} />
        <DeleteButton tabela="budgets" id={o.id} path="/orcamentos" nome={o.titulo} />
      </div>
    ) },
  ];

  return (
    <DataTable
      linhas={linhas}
      colunas={colunas}
      idDe={(o) => o.id}
      busca={(o) => `${o.numero ?? ""} ${o.titulo} ${nomeCli(o)} ${o.status}`}
      buscaPlaceholder="Buscar orçamento, cliente, nº…"
      vazio="Nenhum orçamento encontrado."
    />
  );
}
