import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@nexflow/db";
import { PageHeader, EmptyHint, KpiCard } from "@/components/ui";
import { QuickCreate, type Field } from "@/components/quick-create";
import { ExportButton } from "@/components/export-button";
import { EstoqueTable } from "./estoque-table";
import { moneyFull } from "@/lib/format";
import { criarProduto } from "./actions";

export const dynamic = "force-dynamic";

type Produto = Tables<"products">;

const I = {
  box: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="m3.3 7 8.7 5 8.7-5M12 22V12" /></svg>,
  money: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  alert: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>,
};

const CAMPOS: Field[] = [
  { name: "nome", label: "Produto / material", required: true, placeholder: "Cabo 10mm² · Disjuntor 63A…" },
  { name: "sku", label: "Código (SKU)" },
  { name: "categoria", label: "Categoria", placeholder: "Cabos, Proteção, Painéis…" },
  { name: "unidade", label: "Unidade (un, m, cx…)" },
  { name: "quantidade", label: "Quantidade", type: "number" },
  { name: "minimo", label: "Estoque mínimo", type: "number" },
  { name: "custo", label: "Custo (R$)", type: "number" },
  { name: "preco", label: "Preço de venda (R$)", type: "number" },
];

export default async function EstoquePage() {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").order("nome", { ascending: true });
  const produtos = (data ?? []) as Produto[];

  const valorEstoque = produtos.reduce((a, p) => a + Number(p.quantidade) * Number(p.custo), 0);
  const baixos = produtos.filter((p) => Number(p.quantidade) <= Number(p.minimo)).length;

  return (
    <div className="p-5 md:p-7">
      <PageHeader
        title="Estoque"
        subtitle={`${produtos.length} ${produtos.length === 1 ? "item cadastrado" : "itens cadastrados"}`}
        icon={I.box}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {produtos.length > 0 && <ExportButton tipo="estoque" />}
            <QuickCreate action={criarProduto} title="+ Novo produto" fields={CAMPOS} />
          </div>
        }
      />

      {produtos.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <KpiCard label="Itens cadastrados" value={String(produtos.length)} icon={I.box} />
          <KpiCard label="Valor em estoque" value={moneyFull(valorEstoque)} hint="quantidade × custo" icon={I.money} />
          <KpiCard label="Abaixo do mínimo" value={String(baixos)} tone={baixos > 0 ? "red" : "green"} icon={I.alert} />
        </div>
      )}

      {produtos.length === 0 ? (
        <EmptyHint title="Nenhum produto ainda">Cadastre o primeiro material ou produto no botão acima.</EmptyHint>
      ) : (
        <EstoqueTable linhas={produtos} />
      )}
    </div>
  );
}
