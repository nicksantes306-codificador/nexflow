import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";
import { PageHeader, TableShell, EmptyHint } from "@/components/ui";
import { QuickCreate, type Field } from "@/components/quick-create";
import { criarCliente } from "./actions";

export const dynamic = "force-dynamic";

const CAMPOS: Field[] = [
  { name: "nome", label: "Nome / Razão social", required: true, placeholder: "Indústria Acme Ltda" },
  { name: "cnpj", label: "CNPJ", placeholder: "00.000.000/0001-00" },
  { name: "segmento", label: "Segmento", placeholder: "Metalurgia" },
  { name: "contato", label: "Contato", placeholder: "Eng. responsável" },
  { name: "telefone", label: "Telefone", placeholder: "(11) 90000-0000" },
  { name: "email", label: "E-mail", type: "email", placeholder: "compras@acme.com.br" },
];

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .order("nome", { ascending: true });
  const clientes = (data ?? []) as Client[];

  return (
    <div className="p-5 md:p-7">
      <PageHeader
        title="Clientes 360°"
        subtitle={`${clientes.length} clientes cadastrados`}
        action={
          <QuickCreate
            action={criarCliente}
            title="+ Novo cliente"
            fields={CAMPOS}
          />
        }
      />

      {clientes.length === 0 ? (
        <EmptyHint>
          Nenhum cliente ainda. Cadastre o primeiro ou use{" "}
          <strong>Importar dados</strong> para subir sua planilha.
        </EmptyHint>
      ) : (
        <TableShell
          head={
            <tr>
              <th className="px-4 py-2.5">Cliente</th>
              <th className="px-4 py-2.5">CNPJ</th>
              <th className="px-4 py-2.5">Segmento</th>
              <th className="px-4 py-2.5">Contato</th>
              <th className="px-4 py-2.5">Telefone</th>
            </tr>
          }
        >
          {clientes.map((c) => (
            <tr key={c.id} className="hover:bg-[var(--bg2)]">
              <td className="px-4 py-2.5 font-semibold">{c.nome}</td>
              <td className="px-4 py-2.5 text-[var(--muted)]">{c.cnpj ?? "—"}</td>
              <td className="px-4 py-2.5">{c.segmento ?? "—"}</td>
              <td className="px-4 py-2.5">{c.contato ?? "—"}</td>
              <td className="px-4 py-2.5 text-[var(--muted)]">
                {c.telefone ?? "—"}
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
