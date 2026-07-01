"use client";

import type { Tables } from "@nexflow/db";
import { DataTable, type Coluna } from "@/components/data-table";
import { EditRecord } from "@/components/edit-record";
import { DeleteButton } from "@/components/delete-button";
import type { Field } from "@/components/quick-create";
import { moneyFull } from "@/lib/format";
import { editarProduto } from "./actions";

type Produto = Tables<"products">;

const CAMPOS: Field[] = [
  { name: "nome", label: "Produto / material", required: true },
  { name: "sku", label: "Código (SKU)" },
  { name: "categoria", label: "Categoria" },
  { name: "unidade", label: "Unidade (un, m, cx…)" },
  { name: "quantidade", label: "Quantidade", type: "number" },
  { name: "minimo", label: "Estoque mínimo", type: "number" },
  { name: "custo", label: "Custo (R$)", type: "number" },
  { name: "preco", label: "Preço de venda (R$)", type: "number" },
];

export function EstoqueTable({ linhas }: { linhas: Produto[] }) {
  const colunas: Coluna<Produto>[] = [
    { chave: "nome", titulo: "Produto", ordenavel: true, valor: (p) => p.nome.toLowerCase(), cell: (p) => <span className="font-semibold">{p.nome}</span> },
    { chave: "sku", titulo: "Código", ordenavel: true, valor: (p) => p.sku ?? "", cell: (p) => <span className="font-mono text-[12px] text-[var(--muted)]">{p.sku ?? "—"}</span> },
    { chave: "categoria", titulo: "Categoria", ordenavel: true, valor: (p) => p.categoria ?? "", cell: (p) => <span className="text-[var(--muted)]">{p.categoria ?? "—"}</span> },
    { chave: "quantidade", titulo: "Quantidade", ordenavel: true, valor: (p) => Number(p.quantidade), cell: (p) => {
      const baixo = Number(p.quantidade) <= Number(p.minimo);
      return (
        <span className="inline-flex items-center gap-2">
          <span className="font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>{Number(p.quantidade)} {p.unidade}</span>
          {baixo && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: "var(--bad)", background: "color-mix(in srgb, var(--bad) 14%, transparent)" }}>baixo</span>}
        </span>
      );
    } },
    { chave: "custo", titulo: "Custo", alinhar: "dir", ordenavel: true, valor: (p) => Number(p.custo), cell: (p) => <span className="text-[var(--muted)]" style={{ fontVariantNumeric: "tabular-nums" }}>{moneyFull(Number(p.custo))}</span> },
    { chave: "preco", titulo: "Preço", alinhar: "dir", ordenavel: true, valor: (p) => Number(p.preco), cell: (p) => <span className="font-bold text-[var(--accent)]" style={{ fontVariantNumeric: "tabular-nums" }}>{moneyFull(Number(p.preco))}</span> },
    { chave: "acoes", titulo: "", largura: "w-20", cell: (p) => (
      <div className="flex items-center justify-end gap-1.5">
        <EditRecord action={editarProduto} titulo="Editar produto" fields={CAMPOS} initial={{ id: p.id, nome: p.nome, sku: p.sku ?? "", categoria: p.categoria ?? "", unidade: p.unidade, quantidade: p.quantidade, minimo: p.minimo, custo: p.custo, preco: p.preco }} />
        <DeleteButton tabela="products" id={p.id} path="/estoque" nome={p.nome} />
      </div>
    ) },
  ];

  return (
    <DataTable
      linhas={linhas}
      colunas={colunas}
      idDe={(p) => p.id}
      busca={(p) => `${p.nome} ${p.sku ?? ""} ${p.categoria ?? ""}`}
      buscaPlaceholder="Buscar produto, código, categoria…"
      vazio="Nenhum produto encontrado."
    />
  );
}
