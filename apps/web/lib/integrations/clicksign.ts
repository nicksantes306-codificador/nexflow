// Integração ClickSign (assinatura digital) — SOMENTE server-side, env-gated.
// Sem CLICKSIGN_TOKEN, retorna erro amigável. Cria um documento a partir de uma
// URL de PDF (a página /orcamentos/[id] gera o PDF imprimível) e adiciona o
// signatário. O retorno de "assinado" chega via webhook → seta budgets.assinado_em.

const BASE =
  process.env.CLICKSIGN_ENV === "production"
    ? "https://app.clicksign.com/api/v1"
    : "https://sandbox.clicksign.com/api/v1";

export function clicksignConfigured(): boolean {
  return Boolean(process.env.CLICKSIGN_TOKEN);
}

export type AssinaturaResult = {
  ok: boolean;
  signUrl?: string;
  documentKey?: string;
  error?: string;
};

export async function enviarParaAssinatura(input: {
  titulo: string;
  pdfUrl: string;
  signatarioEmail: string;
  signatarioNome: string;
}): Promise<AssinaturaResult> {
  if (!clicksignConfigured()) {
    return {
      ok: false,
      error:
        "Assinatura digital em modo de configuração: falta o CLICKSIGN_TOKEN nos secrets. O fluxo está pronto — assim que a chave entrar, o documento é enviado.",
    };
  }
  const token = process.env.CLICKSIGN_TOKEN!;

  try {
    // 1) cria o documento a partir da URL do PDF
    const docRes = await fetch(`${BASE}/documents?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        document: {
          path: `/nexflow/${input.titulo}.pdf`,
          content_base64: undefined,
          remote_url: input.pdfUrl,
        },
      }),
    });
    const doc = await docRes.json().catch(() => ({}));
    if (!docRes.ok) {
      return { ok: false, error: `ClickSign: ${docRes.status}` };
    }
    const documentKey = doc?.document?.key as string | undefined;

    // 2) cria o signatário
    const signerRes = await fetch(`${BASE}/signers?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        signer: {
          email: input.signatarioEmail,
          name: input.signatarioNome,
          auths: ["email"],
        },
      }),
    });
    const signer = await signerRes.json().catch(() => ({}));
    const signerKey = signer?.signer?.key as string | undefined;

    // 3) vincula signatário ao documento (lista de assinatura)
    if (documentKey && signerKey) {
      await fetch(`${BASE}/lists?access_token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          list: { document_key: documentKey, signer_key: signerKey, sign_as: "sign" },
        }),
      });
    }

    return {
      ok: true,
      documentKey,
      signUrl: documentKey ? `${BASE}/documents/${documentKey}` : undefined,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Falha no envio." };
  }
}
