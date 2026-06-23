import { createClient } from "@/lib/supabase/server";
import type { Lead, Project, FinanceEntry } from "@/lib/types";
import { ESTAGIOS } from "@/lib/constants";
import { moneyFull } from "@/lib/format";
import { PageHeader, KpiCard, EmptyHint } from "@/components/ui";
import { Toolbar } from "./toolbar";

export const dynamic = "force-dynamic";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function brc(n: number): string {
  if (Math.abs(n) >= 1e6) return "R$ " + (n / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " mi";
  if (Math.abs(n) >= 1e3) return "R$ " + Math.round(n / 1e3).toLocaleString("pt-BR") + " mil";
  return "R$ " + Math.round(n).toLocaleString("pt-BR");
}

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5" style={{ boxShadow: "var(--shadow)" }}>
      <h3 className="text-[14.5px] font-bold">{title}</h3>
      {sub && <p className="mt-0.5 text-[12px] text-[var(--muted)]">{sub}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function BarH({ itens }: { itens: { nome: string; valor: number; legenda?: string }[] }) {
  const max = Math.max(...itens.map((i) => i.valor), 1);
  if (itens.length === 0) return <p className="text-sm text-[var(--muted)]">Sem dados.</p>;
  return (
    <div className="space-y-2.5">
      {itens.map((it, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-[12px] font-medium" title={it.nome}>{it.nome}</span>
          <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-[var(--bg2)]">
            <div className="absolute inset-y-0 left-0 rounded-lg" style={{ width: `${Math.max((it.valor / max) * 100, 3)}%`, background: "linear-gradient(90deg,var(--accent),var(--accent-2))" }} />
            <span className="absolute inset-y-0 right-2.5 flex items-center text-[11px] font-bold text-[var(--text)]">{it.legenda ?? brc(it.valor)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function RelatoriosPage() {
  const supabase = await createClient();
  const [leadsRes, prjRes, finRes] = await Promise.all([
    supabase.from("leads").select("*"),
    supabase.from("projects").select("*"),
    supabase.from("finance_entries").select("*"),
  ]);
  const leads = (leadsRes.data ?? []) as Lead[];
  const projects = (prjRes.data ?? []) as Project[];
  const finance = (finRes.data ?? []) as FinanceEntry[];

  const semDados = leads.length === 0 && projects.length === 0 && finance.length === 0;

  // Receita por mês (ano corrente, entradas recebidas)
  const ano = new Date().getFullYear();
  const receitaMes = Array(12).fill(0) as number[];
  for (const e of finance) {
    if (e.tipo !== "Entrada" || e.status !== "Recebido" || !e.data) continue;
    const d = new Date(String(e.data) + "T00:00:00");
    if (d.getFullYear() === ano) receitaMes[d.getMonth()] += Number(e.valor || 0);
  }
  const receitaTotal = receitaMes.reduce((a, b) => a + b, 0);
  const maxMes = Math.max(...receitaMes, 1);

  // Funil
  const funil = ESTAGIOS.map((s) => {
    const itens = leads.filter((l) => l.status === s);
    return { label: s, count: itens.length, valor: itens.reduce((a, l) => a + Number(l.valor || 0), 0) };
  });
  const ganhos = leads.filter((l) => l.status === "Aprovado");
  const conversao = leads.length ? Math.round((ganhos.length / leads.length) * 100) : 0;
  const ticket = leads.length ? leads.reduce((a, l) => a + Number(l.valor || 0), 0) / leads.length : 0;

  // Ranking de clientes
  const mapa = new Map<string, number>();
  for (const l of leads) {
    const k = (l.empresa || l.cliente || "—").trim();
    mapa.set(k, (mapa.get(k) ?? 0) + Number(l.valor || 0));
  }
  const ranking = [...mapa.entries()].map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor).slice(0, 6);

  // Margem por obra
  const margens = projects
    .map((p) => ({ nome: p.nome, valor: Number(p.valor || 0) - Number(p.custo_real || 0) }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 6);
  const margemTotal = projects.reduce((a, p) => a + (Number(p.valor || 0) - Number(p.custo_real || 0)), 0);

  // CSV
  const csv = [
    "NEXFLOW — Relatório",
    "",
    "Receita por mes (" + ano + ")",
    "Mes,Valor",
    ...MESES.map((m, i) => `${m},${receitaMes[i]}`),
    "",
    "Funil comercial",
    "Etapa,Quantidade,Valor",
    ...funil.map((f) => `${f.label},${f.count},${f.valor}`),
    "",
    "Ranking de clientes",
    "Cliente,Valor",
    ...ranking.map((r) => `"${r.nome}",${r.valor}`),
  ].join("\n");

  return (
    <div className="p-5 md:p-7">
      <PageHeader
        title="Relatórios & BI"
        subtitle="Visão analítica de vendas, financeiro e obras"
        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" rx="1" /><rect x="12" y="7" width="3" height="10" rx="1" /><rect x="17" y="13" width="3" height="4" rx="1" /></svg>}
        action={<div className="no-print"><Toolbar csv={csv} /></div>}
      />

      {semDados ? (
        <EmptyHint>Sem dados para relatórios ainda. Cadastre leads, obras e lançamentos.</EmptyHint>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label="Receita no ano" value={brc(receitaTotal)} tone="green" />
            <KpiCard label="Ticket médio" value={brc(ticket)} hint="por lead" />
            <KpiCard label="Conversão" value={`${conversao}%`} />
            <KpiCard label="Margem das obras" value={brc(margemTotal)} tone={margemTotal >= 0 ? "green" : "red"} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Receita por mês" sub={`Recebido em ${ano}`}>
              <div className="flex h-44 items-end gap-1.5">
                {receitaMes.map((v, i) => (
                  <div key={i} className="flex h-full flex-1 flex-col justify-end" title={`${MESES[i]}: ${moneyFull(v)}`}>
                    <div className="w-full rounded-t-md" style={{ height: `${(v / maxMes) * 100}%`, minHeight: v > 0 ? 4 : 0, background: "linear-gradient(to top,var(--accent),var(--accent-2))" }} />
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex gap-1.5">
                {MESES.map((m) => (
                  <span key={m} className="flex-1 text-center text-[10px] text-[var(--muted)]">{m}</span>
                ))}
              </div>
            </Card>

            <Card title="Funil comercial" sub={`${leads.length} leads · conversão ${conversao}%`}>
              <BarH itens={funil.map((f) => ({ nome: f.label, valor: f.count, legenda: `${f.count} · ${brc(f.valor)}` }))} />
            </Card>

            <Card title="Ranking de clientes" sub="Top 6 por valor em negócios">
              <BarH itens={ranking} />
            </Card>

            <Card title="Margem por obra" sub="Top 6 (contrato − custo)">
              <BarH itens={margens} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
