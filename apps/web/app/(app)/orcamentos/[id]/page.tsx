import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@nexflow/db";
import { moneyFull, dateBR } from "@/lib/format";
import { PrintBar } from "./print-bar";

export const dynamic = "force-dynamic";

type Budget = Tables<"budgets">;
type Item = Tables<"budget_items">;
type Client = Tables<"clients">;
type Tenant = Tables<"tenants">;

const TEMPLATES = ["minimal", "corporate", "premium"] as const;

export default async function OrcamentoDetalhe({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ template?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const template = (TEMPLATES as readonly string[]).includes(sp.template ?? "")
    ? (sp.template as string)
    : "minimal";

  const supabase = await createClient();
  const { data: orc } = await supabase
    .from("budgets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!orc) notFound();
  const budget = orc as Budget;

  const [{ data: itemsData }, { data: tenantId }] = await Promise.all([
    supabase.from("budget_items").select("*").eq("budget_id", id).order("ordem"),
    supabase.rpc("current_tenant_id"),
  ]);
  const items = (itemsData ?? []) as Item[];

  const [{ data: cliData }, { data: tenData }] = await Promise.all([
    budget.client_id
      ? supabase.from("clients").select("*").eq("id", budget.client_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("tenants").select("*").eq("id", tenantId ?? "").maybeSingle(),
  ]);
  const cliente = cliData as Client | null;
  const tenant = tenData as Tenant | null;

  const subtotal = items.reduce(
    (a, it) => a + Number(it.quantidade) * Number(it.preco_unit),
    0,
  );
  const total = items.length > 0 ? subtotal : Number(budget.valor_total);

  // Estilos por template (paleta/escala/peso) — Minimal, Corporate, Premium.
  const skins: Record<string, { headerBg: string; accent: string; titulo: string }> = {
    minimal: { headerBg: "transparent", accent: "#0f172a", titulo: "text-2xl" },
    corporate: { headerBg: "#0f172a", accent: "#0f172a", titulo: "text-2xl" },
    premium: { headerBg: "#cc3600", accent: "#cc3600", titulo: "text-3xl" },
  };
  const skin = skins[template];
  const headerLight = template !== "minimal";

  return (
    <div className="p-5 md:p-7">
      <div className="no-print mb-3">
        <Link href="/orcamentos" className="text-sm text-brand-600 underline">
          ← Voltar
        </Link>
      </div>
      <PrintBar current={template} budgetId={budget.id} />

      {/* Documento (área impressa) */}
      <div
        id="doc"
        className="relative mx-auto max-w-3xl rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-8 text-[#0f172a] shadow-sm print:border-0 print:shadow-none"
      >
        {budget.assinado_em && (
          <div className="pointer-events-none absolute right-16 mt-2 rotate-12 rounded border-4 border-[var(--stage-aprovado)] px-3 py-1 text-lg font-extrabold text-[var(--stage-aprovado)] opacity-80">
            APROVADO
          </div>
        )}

        <header
          className="mb-6 flex items-center justify-between rounded-lg px-4 py-4"
          style={{ background: skin.headerBg, color: headerLight ? "#fff" : "#0f172a" }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg font-mono text-lg font-extrabold text-white"
              style={{ background: headerLight ? "rgba(255,255,255,.18)" : "#cc3600" }}
            >
              N
            </span>
            <div>
              <p className={`font-extrabold ${skin.titulo}`}>
                {tenant?.name ?? "NEXFLOW"}
              </p>
              {tenant?.cnpj && (
                <p className="text-xs opacity-80">CNPJ {tenant.cnpj}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase opacity-70">Orçamento</p>
            <p className="font-mono text-lg font-bold">{budget.numero ?? "—"}</p>
          </div>
        </header>

        <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#64748b]">Cliente</p>
            <p className="font-semibold">{cliente?.nome ?? "—"}</p>
            {cliente?.cnpj && <p className="text-xs text-[#64748b]">{cliente.cnpj}</p>}
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase text-[#64748b]">Validade</p>
            <p className="font-semibold">{dateBR(budget.validade)}</p>
          </div>
        </div>

        <h2 className="mb-3 text-lg font-bold" style={{ color: skin.accent }}>
          {budget.titulo}
        </h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2" style={{ borderColor: skin.accent }}>
              <th className="py-2 text-left">Descrição</th>
              <th className="py-2 text-right">Qtd.</th>
              <th className="py-2 text-right">Unit.</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr className="border-b border-[#e2e8f0]">
                <td className="py-2">{budget.titulo}</td>
                <td className="py-2 text-right">1</td>
                <td className="py-2 text-right">{moneyFull(total)}</td>
                <td className="py-2 text-right">{moneyFull(total)}</td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="border-b border-[#e2e8f0]">
                  <td className="py-2">{it.descricao}</td>
                  <td className="py-2 text-right">{it.quantidade}</td>
                  <td className="py-2 text-right">{moneyFull(Number(it.preco_unit))}</td>
                  <td className="py-2 text-right">
                    {moneyFull(Number(it.quantidade) * Number(it.preco_unit))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-56">
            <div
              className="flex justify-between rounded-lg px-4 py-2 font-bold text-white"
              style={{ background: skin.accent }}
            >
              <span>Total</span>
              <span className="font-mono">{moneyFull(total)}</span>
            </div>
          </div>
        </div>

        <footer className="mt-8 border-t border-[#e2e8f0] pt-4 text-[11px] text-[#64748b]">
          <p>
            ART/RRT em página anexa quando aplicável (NR-10/NR-12). Documento
            gerado pelo NEXFLOW.
          </p>
        </footer>
      </div>

      {/* Regras de impressão: esconde a UI, mostra só o documento */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            "@media print{.no-print{display:none!important}aside{display:none!important}#doc{max-width:none;margin:0}body{background:#fff}}",
        }}
      />
    </div>
  );
}
