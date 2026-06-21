import { createClient } from "@/lib/supabase/server";
import type { Project, Client } from "@/lib/types";
import { PageHeader, TableShell, EmptyHint, KpiCard } from "@/components/ui";
import { QuickCreate, type Field } from "@/components/quick-create";
import { moneyFull, dateBR } from "@/lib/format";
import { criarProjeto } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProjetosPage() {
  const supabase = await createClient();
  const [{ data: prj }, { data: cli }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("id,nome").order("nome"),
  ]);
  const projetos = (prj ?? []) as Project[];
  const clientes = (cli ?? []) as Pick<Client, "id" | "nome">[];
  const nomePorId = new Map(clientes.map((c) => [c.id, c.nome]));

  const carteira = projetos.reduce((a, p) => a + Number(p.valor), 0);
  const custo = projetos.reduce((a, p) => a + Number(p.custo_real), 0);
  const margem = carteira - custo;
  const emAndamento = projetos.filter((p) => p.status !== "Concluído").length;

  const campos: Field[] = [
    { name: "nome", label: "Obra / projeto", required: true, placeholder: "Painel CCM — WEG" },
    {
      name: "client_id",
      label: "Cliente",
      type: "select",
      options: [
        { value: "", label: "— Sem cliente —" },
        ...clientes.map((c) => ({ value: c.id, label: c.nome })),
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "Em andamento", label: "Em andamento" },
        { value: "Aguardando material", label: "Aguardando material" },
        { value: "Pausado", label: "Pausado" },
        { value: "Concluído", label: "Concluído" },
      ],
    },
    { name: "valor", label: "Valor do contrato (R$)", type: "number" },
    { name: "custo_real", label: "Custo real (R$)", type: "number" },
    { name: "progresso", label: "Progresso (%)", type: "number" },
    { name: "responsavel", label: "Responsável", placeholder: "Carlos M." },
    { name: "inicio", label: "Início", type: "date" },
    { name: "fim", label: "Previsão de término", type: "date" },
  ];

  return (
    <div className="p-5 md:p-7">
      <PageHeader
        title="Obras e Serviços"
        subtitle={`${emAndamento} em andamento de ${projetos.length} projetos`}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-1H2z" /><path d="M10 9V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4" /><path d="M4 16v-3a6 6 0 0 1 6-6" /><path d="M14 7a6 6 0 0 1 6 6v3" /></svg>
        }
        action={
          <QuickCreate action={criarProjeto} title="+ Nova obra" fields={campos} />
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard label="Carteira (contratos)" value={moneyFull(carteira)} />
        <KpiCard label="Custo realizado" value={moneyFull(custo)} tone="red" />
        <KpiCard
          label="Margem"
          value={moneyFull(margem)}
          tone={margem >= 0 ? "green" : "red"}
          hint="carteira − custo"
        />
      </div>

      {projetos.length === 0 ? (
        <EmptyHint>Nenhuma obra cadastrada ainda.</EmptyHint>
      ) : (
        <TableShell
          head={
            <tr>
              <th className="px-4 py-2.5">Obra</th>
              <th className="px-4 py-2.5">Cliente</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 w-40">Progresso</th>
              <th className="px-4 py-2.5">Término</th>
              <th className="px-4 py-2.5 text-right">Valor</th>
            </tr>
          }
        >
          {projetos.map((p) => (
            <tr key={p.id} className="hover:bg-[var(--bg2)]">
              <td className="px-4 py-2.5 font-semibold">{p.nome}</td>
              <td className="px-4 py-2.5">
                {p.client_id ? (nomePorId.get(p.client_id) ?? "—") : "—"}
              </td>
              <td className="px-4 py-2.5 text-[var(--muted)]">{p.status}</td>
              <td className="px-4 py-2.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg2)]">
                  <div
                    className="h-full rounded-full bg-brand-600"
                    style={{ width: `${p.progresso}%` }}
                  />
                </div>
                <span className="mt-0.5 block text-[10px] text-[var(--muted)]">
                  {p.progresso}%
                </span>
              </td>
              <td className="px-4 py-2.5 text-[var(--muted)]">{dateBR(p.fim)}</td>
              <td className="px-4 py-2.5 text-right font-mono font-bold text-brand-600">
                {moneyFull(Number(p.valor))}
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
