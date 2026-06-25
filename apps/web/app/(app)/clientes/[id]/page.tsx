import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Client, Project, Budget, Lead } from "@/lib/types";
import type { Tables } from "@nexflow/db";
import { PageHeader, KpiCard, TableShell, EmptyHint, StatusBadge } from "@/components/ui";
import { moneyFull, dateBR } from "@/lib/format";
import { iniciais } from "../client-card";
import { excluirDocumento } from "../actions";
import { DocUploader } from "@/components/doc-uploader";

export const dynamic = "force-dynamic";

type Contato = Tables<"contacts">;
type Documento = Tables<"documents">;

function tamanhoFmt(b: number | null): string {
  if (b == null) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

const I = {
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  hat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-1H2z" /><path d="M10 9V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4" /><path d="M4 16v-3a6 6 0 0 1 6-6" /><path d="M14 7a6 6 0 0 1 6 6v3" /></svg>,
  file: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>,
  money: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
};

function norm(s: string | null | undefined) {
  return (s ?? "").trim().toLowerCase();
}

export default async function ClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cli } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (!cli) notFound();
  const cliente = cli as Client;

  const [contatosRes, orcRes, obrasRes, leadsRes, docsRes] = await Promise.all([
    supabase.from("contacts").select("*").eq("client_id", id),
    supabase.from("budgets").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("projects").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("leads").select("*").order("valor", { ascending: false }),
    supabase.from("documents").select("*").eq("client_id", id).order("created_at", { ascending: false }),
  ]);

  const docs = (docsRes.data ?? []) as Documento[];
  const linkPorPath: Record<string, string> = {};
  if (docs.length) {
    const { data: urls } = await supabase.storage.from("documentos").createSignedUrls(docs.map((d) => d.path), 3600);
    for (const u of urls ?? []) if (u.signedUrl && u.path) linkPorPath[u.path] = u.signedUrl;
  }

  const contatos = (contatosRes.data ?? []) as Contato[];
  const orcamentos = (orcRes.data ?? []) as Budget[];
  const obras = (obrasRes.data ?? []) as Project[];
  const alvo = norm(cliente.nome);
  const negocios = ((leadsRes.data ?? []) as Lead[]).filter(
    (l) => norm(l.empresa) === alvo || norm(l.cliente) === alvo,
  );

  const carteira = obras.reduce((a, o) => a + Number(o.valor), 0);
  const obrasAtivas = obras.filter((o) => o.status !== "Concluído").length;
  const emOrcamentos = orcamentos.reduce((a, o) => a + Number(o.valor_total), 0);
  const orcAprovados = orcamentos.filter((o) => o.status === "aprovado").length;

  const dados: { rotulo: string; valor: string | null }[] = [
    { rotulo: "CNPJ", valor: cliente.cnpj },
    { rotulo: "Segmento", valor: cliente.segmento },
    { rotulo: "Contato", valor: cliente.contato },
    { rotulo: "Telefone", valor: cliente.telefone },
    { rotulo: "E-mail", valor: cliente.email },
    { rotulo: "Endereço", valor: cliente.endereco },
  ];

  return (
    <div className="p-5 md:p-7">
      <Link href="/clientes" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--accent)]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><path d="m15 18-6-6 6-6" /></svg>
        Voltar para clientes
      </Link>

      <PageHeader title={cliente.nome} subtitle={cliente.segmento ?? "Ficha completa do cliente"} icon={I.user} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Obras" value={String(obras.length)} hint={`${obrasAtivas} em andamento`} icon={I.hat} />
        <KpiCard label="Valor contratado" value={moneyFull(carteira)} tone="green" icon={I.money} />
        <KpiCard label="Orçamentos" value={String(orcamentos.length)} hint={`${orcAprovados} aprovados`} icon={I.file} />
        <KpiCard label="Em orçamentos" value={moneyFull(emOrcamentos)} icon={I.money} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Dados + contatos */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5" style={{ boxShadow: "var(--shadow)" }}>
            <h3 className="mb-3 text-sm font-bold">Dados cadastrais</h3>
            <dl className="space-y-2.5">
              {dados.map((d) => (
                <div key={d.rotulo} className="flex items-start justify-between gap-3 text-[13px]">
                  <dt className="text-[var(--muted)]">{d.rotulo}</dt>
                  <dd className="max-w-[60%] text-right font-medium">{d.valor || "—"}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5" style={{ boxShadow: "var(--shadow)" }}>
            <h3 className="mb-3 text-sm font-bold">Pessoas de contato</h3>
            {contatos.length === 0 ? (
              <p className="text-[13px] text-[var(--muted)]">Nenhum contato cadastrado.</p>
            ) : (
              <ul className="space-y-2.5">
                {contatos.map((p) => (
                  <li key={p.id} className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[11px] font-bold text-[var(--accent)]">{iniciais(p.nome)}</span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold">{p.nome}</p>
                      <p className="truncate text-[11px] text-[var(--muted)]">{[p.cargo, p.telefone, p.email].filter(Boolean).join(" · ") || "—"}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5" style={{ boxShadow: "var(--shadow)" }}>
            <h3 className="mb-3 text-sm font-bold">Documentos</h3>
            <DocUploader clientId={cliente.id} />
            <div className="mt-3">
              {docs.length === 0 ? (
                <p className="text-[13px] text-[var(--muted)]">Nenhum documento. Anexe ART, projeto, nota fiscal, fotos da obra…</p>
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
                        <input type="hidden" name="client_id" value={cliente.id} />
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

        {/* Obras + orçamentos + negócios */}
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5" style={{ boxShadow: "var(--shadow)" }}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold">Obras e serviços</h3>
              <Link href="/projetos" className="text-xs font-semibold text-[var(--accent)]">Ver todas</Link>
            </div>
            {obras.length === 0 ? (
              <EmptyHint>Nenhuma obra deste cliente ainda.</EmptyHint>
            ) : (
              <TableShell head={<tr><th className="px-4 py-2.5">Obra</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5">Progresso</th><th className="px-4 py-2.5 text-right">Valor</th></tr>}>
                {obras.map((o) => (
                  <tr key={o.id} className="hover:bg-[var(--bg2)]">
                    <td className="px-4 py-2.5 font-semibold">{o.nome}</td>
                    <td className="px-4 py-2.5 text-[var(--muted)]">{o.status}</td>
                    <td className="px-4 py-2.5 text-[var(--muted)]">{Math.round(Number(o.progresso))}%</td>
                    <td className="px-4 py-2.5 text-right font-bold text-[var(--accent)]" style={{ fontVariantNumeric: "tabular-nums" }}>{moneyFull(Number(o.valor))}</td>
                  </tr>
                ))}
              </TableShell>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5" style={{ boxShadow: "var(--shadow)" }}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold">Orçamentos</h3>
              <Link href="/orcamentos" className="text-xs font-semibold text-[var(--accent)]">Ver todos</Link>
            </div>
            {orcamentos.length === 0 ? (
              <EmptyHint>Nenhum orçamento para este cliente.</EmptyHint>
            ) : (
              <TableShell head={<tr><th className="px-4 py-2.5">Nº</th><th className="px-4 py-2.5">Título</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5">Validade</th><th className="px-4 py-2.5 text-right">Valor</th></tr>}>
                {orcamentos.map((o) => (
                  <tr key={o.id} className="hover:bg-[var(--bg2)]">
                    <td className="px-4 py-2.5"><span className="rounded-md bg-[var(--bg2)] px-2 py-0.5 font-mono text-[11px] text-[var(--muted)]">{o.numero ?? "—"}</span></td>
                    <td className="px-4 py-2.5 font-semibold"><Link href={`/orcamentos/${o.id}`} className="hover:text-[var(--accent)]">{o.titulo}</Link></td>
                    <td className="px-4 py-2.5"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-2.5 text-[var(--muted)]">{dateBR(o.validade)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-[var(--accent)]" style={{ fontVariantNumeric: "tabular-nums" }}>{moneyFull(Number(o.valor_total))}</td>
                  </tr>
                ))}
              </TableShell>
            )}
          </section>

          {negocios.length > 0 && (
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5" style={{ boxShadow: "var(--shadow)" }}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold">Negócios no funil</h3>
                <Link href="/crm" className="text-xs font-semibold text-[var(--accent)]">Abrir funil</Link>
              </div>
              <TableShell head={<tr><th className="px-4 py-2.5">Negócio</th><th className="px-4 py-2.5">Etapa</th><th className="px-4 py-2.5 text-right">Valor</th></tr>}>
                {negocios.map((l) => (
                  <tr key={l.id} className="hover:bg-[var(--bg2)]">
                    <td className="px-4 py-2.5 font-semibold">{l.cliente}</td>
                    <td className="px-4 py-2.5 text-[var(--muted)]">{l.status}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-[var(--accent)]" style={{ fontVariantNumeric: "tabular-nums" }}>{moneyFull(Number(l.valor))}</td>
                  </tr>
                ))}
              </TableShell>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
