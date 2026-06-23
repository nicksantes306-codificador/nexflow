import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@nexflow/db";
import { getEntitlements } from "@/lib/billing/entitlements";
import { iuguConfigured } from "@/lib/billing/iugu";
import { PageHeader, TableShell, EmptyHint, StatusBadge } from "@/components/ui";
import { formatBRLFromCents } from "@/lib/billing/plans";
import { dateBR } from "@/lib/format";
import { PlanCards } from "./plan-cards";

export const dynamic = "force-dynamic";

type Invoice = Tables<"invoices">;

const STATUS_LABEL: Record<string, string> = {
  trialing: "Em teste",
  active: "Ativa",
  past_due: "Pagamento pendente",
  canceled: "Cancelada",
  suspended: "Suspensa",
};

export default async function PlanosPage() {
  const ent = await getEntitlements();
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });
  const faturas = (data ?? []) as Invoice[];

  return (
    <div className="p-5 md:p-7">
      <PageHeader
        title="Planos & Cobrança"
        subtitle={
          <>
            Plano atual: <strong>{ent.plan}</strong> ·{" "}
            <span className="font-semibold">{STATUS_LABEL[ent.status] ?? ent.status}</span>
          </>
        }
        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>}
      />

      {!iuguConfigured() && (
        <p className="mb-4 rounded-xl border border-[color-mix(in_srgb,var(--warn)_30%,transparent)] bg-[color-mix(in_srgb,var(--warn)_10%,transparent)] px-4 py-3 text-sm text-[var(--warn)]">
          <strong>Modo de configuração.</strong> O fluxo de cobrança está pronto;
          falta preencher as chaves da Iugu (sandbox) nos secrets para gerar PIX
          real. Assim que <code>IUGU_API_TOKEN</code> entrar, os botões abaixo
          emitem a cobrança e o <code>billing-webhook</code> ativa a assinatura.
        </p>
      )}

      {ent.access === "readonly" && (
        <p className="mb-4 rounded-xl border border-[color-mix(in_srgb,var(--bad)_30%,transparent)] bg-[color-mix(in_srgb,var(--bad)_10%,transparent)] px-4 py-3 text-sm text-[var(--bad)]">
          Sua conta está em <strong>suspensão suave</strong> (somente leitura).
          Regularize o pagamento para reativar a edição.
        </p>
      )}

      <PlanCards currentPlan={ent.plan} />

      <h2 className="mb-3 mt-8 text-lg font-extrabold">Faturas</h2>
      {faturas.length === 0 ? (
        <EmptyHint>Nenhuma fatura ainda.</EmptyHint>
      ) : (
        <TableShell
          head={
            <tr>
              <th className="px-4 py-2.5">Data</th>
              <th className="px-4 py-2.5">Valor</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">NF-e</th>
              <th className="px-4 py-2.5">Vencimento</th>
            </tr>
          }
        >
          {faturas.map((f) => (
            <tr key={f.id} className="hover:bg-[var(--bg2)]">
              <td className="px-4 py-2.5 text-[var(--muted)]">
                {dateBR(f.created_at.slice(0, 10))}
              </td>
              <td className="px-4 py-2.5 font-mono font-bold">
                {formatBRLFromCents(f.amount_cents)}
              </td>
              <td className="px-4 py-2.5">
                <StatusBadge status={f.status === "paid" ? "Pago" : "Pendente"} />
              </td>
              <td className="px-4 py-2.5">
                {f.nfe_url ? (
                  <a href={f.nfe_url} className="text-brand-600 underline">
                    Baixar
                  </a>
                ) : (
                  <span className="text-[var(--muted)]">—</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-[var(--muted)]">{dateBR(f.due_date)}</td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
