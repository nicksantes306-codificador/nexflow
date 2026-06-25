import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";
import type { Tables } from "@nexflow/db";
import { PageHeader, KpiCard, EmptyHint } from "@/components/ui";
import { moneyFull, dateBR } from "@/lib/format";
import { excluirDocumento } from "../../clientes/actions";
import { DocUploader } from "@/components/doc-uploader";

export const dynamic = "force-dynamic";

type Documento = Tables<"documents">;

function tamanhoFmt(b: number | null): string {
  if (b == null) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

const STATUS_COR: Record<string, string> = {
  "Em andamento": "var(--accent)",
  "Aguardando material": "var(--warn)",
  Pausado: "var(--bad)",
  Concluído: "var(--ok)",
};

const I = {
  hat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-1H2z" /><path d="M10 9V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4" /><path d="M4 16v-3a6 6 0 0 1 6-6" /><path d="M14 7a6 6 0 0 1 6 6v3" /></svg>,
  wallet: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" /></svg>,
  down: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l6 6 4-4 8 8" /><path d="M21 17v-4h-4" /></svg>,
  pct: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5 5 19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>,
};

export default async function ObraDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: prj } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (!prj) notFound();
  const obra = prj as Project;

  const [cliRes, docsRes] = await Promise.all([
    obra.client_id
      ? supabase.from("clients").select("id,nome").eq("id", obra.client_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("documents").select("*").eq("project_id", id).order("created_at", { ascending: false }),
  ]);

  const cliente = cliRes.data as { id: string; nome: string } | null;
  const docs = (docsRes.data ?? []) as Documento[];
  const linkPorPath: Record<string, string> = {};
  if (docs.length) {
    const { data: urls } = await supabase.storage.from("documentos").createSignedUrls(docs.map((d) => d.path), 3600);
    for (const u of urls ?? []) if (u.signedUrl && u.path) linkPorPath[u.path] = u.signedUrl;
  }

  const valor = Number(obra.valor || 0);
  const custo = Number(obra.custo_real || 0);
  const margem = valor - custo;
  const margemPct = valor > 0 ? Math.round((margem / valor) * 100) : 0;
  const pc = Math.max(0, Math.min(100, Math.round(Number(obra.progresso || 0))));
  const cor = STATUS_COR[obra.status] ?? "var(--muted)";

  const dados: { rotulo: string; valor: React.ReactNode }[] = [
    { rotulo: "Cliente", valor: cliente ? <Link href={`/clientes/${cliente.id}`} className="font-medium hover:text-[var(--accent)]">{cliente.nome}</Link> : "—" },
    { rotulo: "Responsável", valor: obra.responsavel || "—" },
    { rotulo: "Início", valor: dateBR(obra.inicio) },
    { rotulo: "Previsão de término", valor: dateBR(obra.fim) },
  ];

  return (
    <div className="p-5 md:p-7">
      <Link href="/projetos" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--accent)]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><path d="m15 18-6-6 6-6" /></svg>
        Voltar para obras
      </Link>

      <PageHeader
        title={obra.nome}
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: cor }} />
            <span style={{ color: cor }}>{obra.status}</span>
          </span>
        }
        icon={I.hat}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Valor do contrato" value={moneyFull(valor)} icon={I.wallet} />
        <KpiCard label="Custo realizado" value={moneyFull(custo)} tone="red" icon={I.down} />
        <KpiCard label="Margem" value={moneyFull(margem)} tone={margem >= 0 ? "green" : "red"} hint={`${margemPct}% do contrato`} icon={I.pct} />
        <KpiCard label="Progresso" value={`${pc}%`} icon={I.hat} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5" style={{ boxShadow: "var(--shadow)" }}>
            <h3 className="mb-3 text-sm font-bold">Dados da obra</h3>
            <dl className="space-y-2.5">
              {dados.map((d) => (
                <div key={d.rotulo} className="flex items-start justify-between gap-3 text-[13px]">
                  <dt className="text-[var(--muted)]">{d.rotulo}</dt>
                  <dd className="max-w-[60%] text-right">{d.valor}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-[var(--muted)]">
                <span>Andamento</span><span>{pc}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--bg2)]">
                <div className="h-full rounded-full" style={{ width: `${pc}%`, background: pc >= 85 ? "linear-gradient(90deg,#0e9f6e,var(--ok))" : pc < 50 ? "linear-gradient(90deg,#b45309,var(--warn))" : "linear-gradient(90deg,var(--accent),var(--accent-2))" }} />
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-2">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5" style={{ boxShadow: "var(--shadow)" }}>
            <h3 className="mb-3 text-sm font-bold">Documentos da obra</h3>
            <DocUploader projectId={obra.id} />
            <div className="mt-3">
              {docs.length === 0 ? (
                <EmptyHint>Nenhum documento. Anexe ART, projeto elétrico, diário de obra, fotos, nota fiscal…</EmptyHint>
              ) : (
                <ul className="space-y-2">
                  {docs.map((d) => (
                    <li key={d.id} className="flex items-center gap-2.5 rounded-lg border border-[var(--border)] px-3 py-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[var(--muted)]" style={{ width: 17, height: 17 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                      <div className="min-w-0 flex-1">
                        <a href={linkPorPath[d.path] ?? "#"} target="_blank" rel="noreferrer" className="block truncate text-[13px] font-semibold transition hover:text-[var(--accent)]">{d.nome}</a>
                        <p className="text-[11px] text-[var(--muted)]">{[tamanhoFmt(d.tamanho), dateBR(d.created_at.slice(0, 10))].filter(Boolean).join(" · ")}</p>
                      </div>
                      <form action={excluirDocumento}>
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="path" value={d.path} />
                        <input type="hidden" name="project_id" value={obra.id} />
                        <button type="submit" aria-label="Excluir documento" title="Excluir" className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-md text-[var(--muted)] transition hover:bg-[color-mix(in_srgb,var(--bad)_14%,transparent)] hover:text-[var(--bad)]">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
