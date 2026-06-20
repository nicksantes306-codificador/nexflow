"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPixInvoice, iuguConfigured } from "@/lib/billing/iugu";
import { planById } from "@/lib/billing/plans";
import {
  sendWhatsApp,
  whatsappConfigured,
  mensagemCobrancaPix,
} from "@/lib/integrations/whatsapp";

export type CheckoutResult = {
  error?: string;
  url?: string;
  pixCode?: string | null;
  expiresAt?: string | null;
};

export async function assinarPlano(planId: string): Promise<CheckoutResult> {
  const plan = planById(planId);
  if (!plan) return { error: "Plano inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const { data: tenant } = await supabase.rpc("current_tenant_id");
  if (!tenant) return { error: "Nenhum tenant ativo." };

  if (!iuguConfigured()) {
    return {
      error:
        "Cobrança em modo de configuração: as chaves da Iugu (sandbox) ainda não foram preenchidas. O fluxo está pronto — assim que IUGU_API_TOKEN entrar nos secrets, o PIX é gerado aqui.",
    };
  }

  try {
    const pix = await createPixInvoice({
      email: user.email ?? "",
      nome: user.user_metadata?.full_name ?? user.email ?? "Cliente NEXFLOW",
      descricao: `NEXFLOW ${plan.nome} — assinatura mensal`,
      priceCents: plan.priceCents,
    });

    // Registra a fatura local como pendente (o webhook confirma o pagamento).
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    await supabase.from("invoices").insert({
      tenant_id: tenant,
      subscription_id: sub?.id ?? null,
      amount_cents: plan.priceCents,
      status: "pending",
      gateway_invoice_id: pix.invoiceId,
      pix_qr_code: pix.pixCode,
      pix_expires_at: pix.expiresAt,
      due_date: pix.expiresAt,
    });

    // Aviso de cobrança por WhatsApp (não bloqueia o checkout se falhar).
    const phone = user.user_metadata?.phone as string | undefined;
    if (whatsappConfigured() && phone && pix.pixCode) {
      const nome = user.user_metadata?.full_name ?? user.email ?? "Cliente";
      await sendWhatsApp(phone, mensagemCobrancaPix(nome, plan.nome, pix.pixCode)).catch(
        () => {},
      );
    }

    revalidatePath("/planos");
    return { url: pix.url, pixCode: pix.pixCode, expiresAt: pix.expiresAt };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha ao gerar cobrança." };
  }
}
