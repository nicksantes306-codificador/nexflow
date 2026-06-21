import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";
import { PageHeader, KpiCard, EmptyHint } from "@/components/ui";
import { QuickCreate, type Field } from "@/components/quick-create";
import { criarCliente } from "./actions";
import { ClientCard } from "./client-card";

export const dynamic = "force-dynamic";

const CAMPOS: Field[] = [
  { name: "nome", label: "Nome / Razão social", required: true, placeholder: "Indústria Acme Ltda" },
  { name: "cnpj", label: "CNPJ", placeholder: "00.000.000/0001-00" },
  { name: "segmento", label: "Segmento", placeholder: "Metalurgia" },
  { name: "contato", label: "Contato", placeholder: "Eng. responsável" },
  { name: "telefone", label: "Telefone", placeholder: "(11) 90000-0000" },
  { name: "email", label: "E-mail", type: "email", placeholder: "compras@acme.com.br" },
];

const I = {
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  tag: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20.6 13.4 12 22l-9-9V3h10z" /><circle cx="7.5" cy="7.5" r="1.2" /></svg>,
  phone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" /></svg>,
  doc: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>,
};

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("*").order("nome", { ascending: true });
  const clientes = (data ?? []) as Client[];

  const segmentos = new Set(clientes.map((c) => c.segmento).filter(Boolean)).size;
  const comContato = clientes.filter((c) => c.contato || c.telefone).length;
  const comCnpj = clientes.filter((c) => c.cnpj).length;

  return (
    <div className="p-5 md:p-7">
      <PageHeader
        title="Clientes 360°"
        subtitle={`${clientes.length} ${clientes.length === 1 ? "cliente cadastrado" : "clientes cadastrados"}`}
        icon={I.users}
        action={<QuickCreate action={criarCliente} title="+ Novo cliente" fields={CAMPOS} />}
      />

      {clientes.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Total de clientes" value={String(clientes.length)} icon={I.users} />
          <KpiCard label="Segmentos" value={String(segmentos)} icon={I.tag} hint="setores atendidos" />
          <KpiCard label="Com contato" value={String(comContato)} icon={I.phone} tone="green" />
          <KpiCard label="Com CNPJ" value={String(comCnpj)} icon={I.doc} />
        </div>
      )}

      {clientes.length === 0 ? (
        <EmptyHint>
          Nenhum cliente ainda. Cadastre o primeiro no botão acima ou use{" "}
          <strong className="text-[var(--text)]">Importar dados</strong> para subir sua planilha.
        </EmptyHint>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clientes.map((c) => (
            <ClientCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}
