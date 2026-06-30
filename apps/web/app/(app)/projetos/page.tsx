import { createClient } from "@/lib/supabase/server";
import type { Project, Client } from "@/lib/types";
import { PageHeader, EmptyHint, KpiCard } from "@/components/ui";
import { QuickCreate, type Field } from "@/components/quick-create";
import { ExportButton } from "@/components/export-button";
import { ObrasTable } from "./obras-table";
import { moneyFull } from "@/lib/format";
import { criarProjeto } from "./actions";

export const dynamic = "force-dynamic";

const I = {
  hat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-1H2z" /><path d="M10 9V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4" /><path d="M4 16v-3a6 6 0 0 1 6-6" /><path d="M14 7a6 6 0 0 1 6 6v3" /></svg>,
  wallet: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" /></svg>,
  down: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l6 6 4-4 8 8" /><path d="M21 17v-4h-4" /></svg>,
  pct: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5 5 19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>,
};

export default async function ProjetosPage() {
  const supabase = await createClient();
  const [{ data: prj }, { data: cli }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("id,nome").order("nome"),
  ]);
  const projetos = (prj ?? []) as Project[];
  const clientes = (cli ?? []) as Pick<Client, "id" | "nome">[];

  const carteira = projetos.reduce((a, p) => a + Number(p.valor), 0);
  const custo = projetos.reduce((a, p) => a + Number(p.custo_real), 0);
  const margem = carteira - custo;
  const emAndamento = projetos.filter((p) => p.status !== "Concluído").length;
  const margemPct = carteira > 0 ? Math.round((margem / carteira) * 100) : 0;

  const campos: Field[] = [
    { name: "nome", label: "Obra / projeto", required: true, placeholder: "Painel CCM — WEG" },
    { name: "client_id", label: "Cliente", type: "select", options: [{ value: "", label: "— Sem cliente —" }, ...clientes.map((c) => ({ value: c.id, label: c.nome }))] },
    { name: "status", label: "Status", type: "select", options: [{ value: "Em andamento", label: "Em andamento" }, { value: "Aguardando material", label: "Aguardando material" }, { value: "Pausado", label: "Pausado" }, { value: "Concluído", label: "Concluído" }] },
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
        subtitle={`${emAndamento} obras em andamento de ${projetos.length} no total`}
        icon={I.hat}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {projetos.length > 0 && <ExportButton tipo="obras" />}
            <QuickCreate action={criarProjeto} title="+ Nova obra" fields={campos} />
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Obras em andamento" value={String(emAndamento)} icon={I.hat} />
        <KpiCard label="Carteira (contratos)" value={moneyFull(carteira)} icon={I.wallet} />
        <KpiCard label="Custo realizado" value={moneyFull(custo)} tone="red" icon={I.down} />
        <KpiCard label="Margem" value={moneyFull(margem)} tone={margem >= 0 ? "green" : "red"} hint={`${margemPct}% da carteira`} icon={I.pct} />
      </div>

      {projetos.length === 0 ? (
        <EmptyHint title="Nenhuma obra cadastrada">Cadastre a primeira obra no botão acima.</EmptyHint>
      ) : (
        <ObrasTable linhas={projetos} clientes={clientes} />
      )}
    </div>
  );
}
