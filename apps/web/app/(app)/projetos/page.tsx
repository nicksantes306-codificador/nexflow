import { createClient } from "@/lib/supabase/server";
import type { Project, Client } from "@/lib/types";
import { PageHeader, TableShell, EmptyHint, KpiCard } from "@/components/ui";
import { QuickCreate, type Field } from "@/components/quick-create";
import { DeleteButton } from "@/components/delete-button";
import { EditRecord } from "@/components/edit-record";
import { moneyFull, dateBR } from "@/lib/format";
import { criarProjeto, editarProjeto } from "./actions";

export const dynamic = "force-dynamic";

const I = {
  hat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-1H2z" /><path d="M10 9V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4" /><path d="M4 16v-3a6 6 0 0 1 6-6" /><path d="M14 7a6 6 0 0 1 6 6v3" /></svg>,
  wallet: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" /></svg>,
  down: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l6 6 4-4 8 8" /><path d="M21 17v-4h-4" /></svg>,
  pct: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5 5 19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>,
};

const STATUS_COR: Record<string, string> = {
  "Em andamento": "var(--accent)",
  "Aguardando material": "var(--warn)",
  Pausado: "var(--bad)",
  Concluído: "var(--ok)",
};

function StatusObra({ s }: { s: string }) {
  const c = STATUS_COR[s] ?? "var(--muted)";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ color: c, background: `color-mix(in srgb, ${c} 14%, transparent)` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {s}
    </span>
  );
}

function Progresso({ pc }: { pc: number }) {
  const v = Math.max(0, Math.min(100, Math.round(pc)));
  const grad = v >= 85 ? "linear-gradient(90deg,#0e9f6e,var(--ok))" : v < 50 ? "linear-gradient(90deg,#b45309,var(--warn))" : "linear-gradient(90deg,var(--accent),var(--accent-2))";
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg2)]">
        <div className="h-full rounded-full" style={{ width: `${v}%`, background: grad }} />
      </div>
      <span className="w-9 text-right text-[11px] font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>{v}%</span>
    </div>
  );
}

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
        action={<QuickCreate action={criarProjeto} title="+ Nova obra" fields={campos} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Obras em andamento" value={String(emAndamento)} icon={I.hat} />
        <KpiCard label="Carteira (contratos)" value={moneyFull(carteira)} icon={I.wallet} />
        <KpiCard label="Custo realizado" value={moneyFull(custo)} tone="red" icon={I.down} />
        <KpiCard label="Margem" value={moneyFull(margem)} tone={margem >= 0 ? "green" : "red"} hint={`${margemPct}% da carteira`} icon={I.pct} />
      </div>

      {projetos.length === 0 ? (
        <EmptyHint>Nenhuma obra cadastrada ainda.</EmptyHint>
      ) : (
        <TableShell
          head={
            <tr>
              <th className="px-4 py-3">Obra</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Status</th>
              <th className="w-44 px-4 py-3">Progresso</th>
              <th className="px-4 py-3">Término</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          }
        >
          {projetos.map((p) => (
            <tr key={p.id} className="transition hover:bg-[var(--bg2)]">
              <td className="px-4 py-3 font-semibold">{p.nome}</td>
              <td className="px-4 py-3 text-[var(--muted)]">{p.client_id ? (nomePorId.get(p.client_id) ?? "—") : "—"}</td>
              <td className="px-4 py-3"><StatusObra s={p.status} /></td>
              <td className="px-4 py-3"><Progresso pc={Number(p.progresso)} /></td>
              <td className="px-4 py-3 text-[var(--muted)]">{dateBR(p.fim)}</td>
              <td className="px-4 py-3 text-right font-bold text-[var(--accent)]" style={{ fontVariantNumeric: "tabular-nums" }}>{moneyFull(Number(p.valor))}</td>
              <td className="px-2 py-3">
                <div className="flex items-center justify-end gap-1.5">
                  <EditRecord
                    action={editarProjeto}
                    titulo="Editar obra"
                    fields={campos}
                    initial={{ id: p.id, nome: p.nome, client_id: p.client_id ?? "", status: p.status, valor: p.valor, custo_real: p.custo_real, progresso: p.progresso, responsavel: p.responsavel ?? "", inicio: p.inicio ?? "", fim: p.fim ?? "" }}
                  />
                  <DeleteButton tabela="projects" id={p.id} path="/projetos" nome={p.nome} />
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
