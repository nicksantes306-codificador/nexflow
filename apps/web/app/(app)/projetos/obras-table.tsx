"use client";

import Link from "next/link";
import type { Project, Client } from "@/lib/types";
import { DataTable, type Coluna } from "@/components/data-table";
import { EditRecord } from "@/components/edit-record";
import { DeleteButton } from "@/components/delete-button";
import type { Field } from "@/components/quick-create";
import { moneyFull, dateBR } from "@/lib/format";
import { editarProjeto } from "./actions";

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
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{s}
    </span>
  );
}

function Progresso({ pc }: { pc: number }) {
  const v = Math.max(0, Math.min(100, Math.round(pc)));
  const grad = v >= 85 ? "linear-gradient(90deg,#0e9f6e,var(--ok))" : v < 50 ? "linear-gradient(90deg,#b45309,var(--warn))" : "linear-gradient(90deg,var(--accent),var(--accent-2))";
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--bg2)]"><div className="h-full rounded-full" style={{ width: `${v}%`, background: grad }} /></div>
      <span className="w-9 text-[11px] font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>{v}%</span>
    </div>
  );
}

export function ObrasTable({ linhas, clientes }: { linhas: Project[]; clientes: Pick<Client, "id" | "nome">[] }) {
  const nomePorId = new Map(clientes.map((c) => [c.id, c.nome]));
  const campos: Field[] = [
    { name: "nome", label: "Obra / projeto", required: true },
    { name: "client_id", label: "Cliente", type: "select", options: [{ value: "", label: "— Sem cliente —" }, ...clientes.map((c) => ({ value: c.id, label: c.nome }))] },
    { name: "status", label: "Status", type: "select", options: [{ value: "Em andamento", label: "Em andamento" }, { value: "Aguardando material", label: "Aguardando material" }, { value: "Pausado", label: "Pausado" }, { value: "Concluído", label: "Concluído" }] },
    { name: "valor", label: "Valor do contrato (R$)", type: "number" },
    { name: "custo_real", label: "Custo real (R$)", type: "number" },
    { name: "progresso", label: "Progresso (%)", type: "number" },
    { name: "responsavel", label: "Responsável" },
    { name: "inicio", label: "Início", type: "date" },
    { name: "fim", label: "Previsão de término", type: "date" },
  ];

  const nomeCli = (p: Project) => (p.client_id ? nomePorId.get(p.client_id) ?? "" : "");

  const colunas: Coluna<Project>[] = [
    { chave: "nome", titulo: "Obra", ordenavel: true, valor: (p) => p.nome.toLowerCase(), cell: (p) => <Link href={`/projetos/${p.id}`} className="font-semibold transition hover:text-[var(--accent)]">{p.nome}</Link> },
    { chave: "cliente", titulo: "Cliente", ordenavel: true, valor: (p) => nomeCli(p).toLowerCase(), cell: (p) => <span className="text-[var(--muted)]">{nomeCli(p) || "—"}</span> },
    { chave: "status", titulo: "Status", ordenavel: true, valor: (p) => p.status, cell: (p) => <StatusObra s={p.status} /> },
    { chave: "progresso", titulo: "Progresso", ordenavel: true, valor: (p) => Number(p.progresso), cell: (p) => <Progresso pc={Number(p.progresso)} /> },
    { chave: "fim", titulo: "Término", ordenavel: true, valor: (p) => p.fim ?? "", cell: (p) => <span className="text-[var(--muted)]">{dateBR(p.fim)}</span> },
    { chave: "valor", titulo: "Valor", alinhar: "dir", ordenavel: true, valor: (p) => Number(p.valor), cell: (p) => <span className="font-bold text-[var(--accent)]" style={{ fontVariantNumeric: "tabular-nums" }}>{moneyFull(Number(p.valor))}</span> },
    { chave: "acoes", titulo: "", largura: "w-20", cell: (p) => (
      <div className="flex items-center justify-end gap-1.5">
        <EditRecord action={editarProjeto} titulo="Editar obra" fields={campos} initial={{ id: p.id, nome: p.nome, client_id: p.client_id ?? "", status: p.status, valor: p.valor, custo_real: p.custo_real, progresso: p.progresso, responsavel: p.responsavel ?? "", inicio: p.inicio ?? "", fim: p.fim ?? "" }} />
        <DeleteButton tabela="projects" id={p.id} path="/projetos" nome={p.nome} />
      </div>
    ) },
  ];

  return (
    <DataTable
      linhas={linhas}
      colunas={colunas}
      idDe={(p) => p.id}
      busca={(p) => `${p.nome} ${nomeCli(p)} ${p.status} ${p.responsavel ?? ""}`}
      buscaPlaceholder="Buscar obra, cliente, responsável…"
      vazio="Nenhuma obra encontrada."
    />
  );
}
