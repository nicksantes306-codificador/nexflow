// ============================================================================
// NEXFLOW · Edge Function — billing-webhook (Iugu)
// ----------------------------------------------------------------------------
// Recebe eventos da Iugu e sincroniza public.invoices / public.subscriptions.
// Autenticação por token próprio no query string (?token=IUGU_WEBHOOK_TOKEN) —
// a Iugu não envia JWT. A Iugu pode mandar form-urlencoded OU json; tratamos os
// dois. Pagamento confirmado → fatura paid + assinatura active. Falha → past_due
// + grace de 7 dias. Cancelamento/expiração → suspended/canceled.
// ============================================================================
import { createClient } from "jsr:@supabase/supabase-js@2";

const GRACE_DAYS = 7;

function isoPlusDays(days: number): string {
  return new Date(Date.now() + days * 86400_000).toISOString();
}

// NFe.io — emite NF de serviço (gated). Retorna a URL da NF ou null.
async function emitirNfse(amountCents: number): Promise<string | null> {
  const apiKey = Deno.env.get("NFEIO_API_KEY");
  const companyId = Deno.env.get("NFEIO_COMPANY_ID");
  if (!apiKey || !companyId) return null; // não configurado → segue sem NF
  try {
    const res = await fetch(
      `https://api.nfe.io/v1/companies/${companyId}/serviceinvoices`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa(`${apiKey}:`),
        },
        body: JSON.stringify({
          cityServiceCode: Deno.env.get("NFEIO_SERVICE_CODE") ?? "",
          description: "Assinatura SaaS NEXFLOW",
          servicesAmount: amountCents / 100,
        }),
      },
    );
    const json = await res.json().catch(() => ({}));
    return (json?.id ? `https://api.nfe.io/serviceinvoices/${json.id}` : null);
  } catch (_e) {
    return null;
  }
}

async function parseBody(req: Request): Promise<Record<string, string>> {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const j = await req.json().catch(() => ({}));
    // achata data[...] em chaves planas
    const flat: Record<string, string> = {};
    const d = (j.data ?? {}) as Record<string, unknown>;
    for (const [k, v] of Object.entries(d)) flat[k] = String(v);
    if (j.event) flat["event"] = String(j.event);
    return flat;
  }
  const form = await req.formData().catch(() => null);
  const out: Record<string, string> = {};
  if (form) {
    for (const [k, v] of form.entries()) {
      // normaliza data[id] → id, data[status] → status
      const m = k.match(/^data\[(.+)\]$/);
      out[m ? m[1] : k] = String(v);
    }
  }
  return out;
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  if (url.searchParams.get("token") !== Deno.env.get("IUGU_WEBHOOK_TOKEN")) {
    return new Response("unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const p = await parseBody(req);
  const event = p["event"] ?? "";
  const invoiceId = p["id"] ?? p["invoice_id"] ?? "";
  const subscriptionId = p["subscription_id"] ?? "";

  try {
    if (event === "invoice.status_changed" && p["status"] === "paid") {
      // marca fatura paga e ativa a assinatura do mesmo tenant
      const { data: inv } = await supabase
        .from("invoices")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("gateway_invoice_id", invoiceId)
        .select("tenant_id, subscription_id, amount_cents")
        .maybeSingle();

      if (inv) {
        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            current_period_end: isoPlusDays(30),
            grace_until: null,
          })
          .eq("tenant_id", inv.tenant_id);

        // Emite NF-e de serviço (se NFe.io estiver configurado) e guarda a URL.
        const nfeUrl = await emitirNfse(inv.amount_cents ?? 0);
        if (nfeUrl) {
          await supabase
            .from("invoices")
            .update({ nfe_url: nfeUrl })
            .eq("gateway_invoice_id", invoiceId);
        }
      }
    } else if (
      event === "invoice.payment_failed" ||
      (event === "invoice.status_changed" && p["status"] === "expired")
    ) {
      const { data: inv } = await supabase
        .from("invoices")
        .update({ status: "failed" })
        .eq("gateway_invoice_id", invoiceId)
        .select("tenant_id")
        .maybeSingle();
      if (inv) {
        await supabase
          .from("subscriptions")
          .update({ status: "past_due", grace_until: isoPlusDays(GRACE_DAYS) })
          .eq("tenant_id", inv.tenant_id);
      }
    } else if (event === "subscription.suspended" || event === "subscription.expired") {
      await supabase
        .from("subscriptions")
        .update({ status: subscriptionId ? "suspended" : "suspended" })
        .eq("gateway_subscription_id", subscriptionId);
    } else if (event === "subscription.canceled") {
      await supabase
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("gateway_subscription_id", subscriptionId);
    } else if (event === "subscription.renewed" || event === "subscription.activated") {
      await supabase
        .from("subscriptions")
        .update({ status: "active", current_period_end: isoPlusDays(30), grace_until: null })
        .eq("gateway_subscription_id", subscriptionId);
    }
  } catch (e) {
    console.error("billing-webhook erro:", e);
    return new Response("error", { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, event }), {
    headers: { "content-type": "application/json" },
  });
});
