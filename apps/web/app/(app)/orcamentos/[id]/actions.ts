"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { enviarParaAssinatura, type AssinaturaResult } from "@/lib/integrations/clicksign";

export async function enviarAssinatura(budgetId: string): Promise<AssinaturaResult> {
  const supabase = await createClient();
  const { data: b } = await supabase
    .from("budgets")
    .select("*")
    .eq("id", budgetId)
    .maybeSingle();
  if (!b) return { ok: false, error: "Orçamento não encontrado." };

  let email = "";
  let nome = "Cliente";
  if (b.client_id) {
    const { data: c } = await supabase
      .from("clients")
      .select("nome,email")
      .eq("id", b.client_id)
      .maybeSingle();
    email = c?.email ?? "";
    nome = c?.nome ?? "Cliente";
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await enviarParaAssinatura({
    titulo: b.numero ?? "orcamento",
    pdfUrl: `${site}/orcamentos/${budgetId}?template=premium`,
    signatarioEmail: email || "cliente@exemplo.com",
    signatarioNome: nome,
  });

  // No fluxo real, o status "assinado" chega via webhook do ClickSign e seta
  // budgets.assinado_em. Aqui marcamos como "enviado" quando deu certo.
  if (res.ok) {
    await supabase.from("budgets").update({ status: "enviado" }).eq("id", budgetId);
    revalidatePath(`/orcamentos/${budgetId}`);
  }
  return res;
}
