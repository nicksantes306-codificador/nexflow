// Integração WhatsApp (Z-API) — SOMENTE server-side, env-gated.
// Sem ZAPI_INSTANCE/ZAPI_TOKEN, vira no-op silencioso (não bloqueia o fluxo).
// Usado para avisos de cobrança, follow-up de leads e notificação de proposta.

export function whatsappConfigured(): boolean {
  return Boolean(process.env.ZAPI_INSTANCE && process.env.ZAPI_TOKEN);
}

// Normaliza para o formato E.164 sem símbolos (ex: 5511999999999).
export function normalizaTelefone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length <= 11 && !d.startsWith("55")) return "55" + d;
  return d;
}

export async function sendWhatsApp(
  telefone: string,
  mensagem: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!whatsappConfigured()) {
    return { ok: false, error: "WhatsApp não configurado (Z-API)." };
  }
  const instance = process.env.ZAPI_INSTANCE;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN ?? "";

  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${instance}/token/${token}/send-text`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Client-Token": clientToken,
        },
        body: JSON.stringify({
          phone: normalizaTelefone(telefone),
          message: mensagem,
        }),
      },
    );
    if (!res.ok) return { ok: false, error: `Z-API respondeu ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Falha no envio." };
  }
}

// Mensagem pronta de cobrança com PIX (copia-e-cola).
export function mensagemCobrancaPix(
  nome: string,
  plano: string,
  pixCode: string,
): string {
  return (
    `Olá, ${nome}! 👋\n\n` +
    `Sua assinatura NEXFLOW ${plano} está quase ativa.\n` +
    `Pague via PIX (copia-e-cola) para liberar o acesso:\n\n${pixCode}\n\n` +
    `Assim que o pagamento cair, sua conta é ativada automaticamente. Qualquer dúvida, é só responder aqui.`
  );
}
