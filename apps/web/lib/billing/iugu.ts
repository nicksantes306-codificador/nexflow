// Client da Iugu (API v1) — SOMENTE server-side. Gated por env: sem
// IUGU_API_TOKEN, as funções retornam um erro amigável (nada quebra). Trocar
// para chaves de produção é só preencher os secrets — igual ao padrão do HTML.

const IUGU_BASE = "https://api.iugu.com/v1";

export function iuguConfigured(): boolean {
  return Boolean(process.env.IUGU_API_TOKEN);
}

function authHeader(): string {
  const token = process.env.IUGU_API_TOKEN ?? "";
  // Iugu usa Basic auth com o token como usuário e senha vazia.
  return "Basic " + Buffer.from(`${token}:`).toString("base64");
}

async function iuguFetch<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${IUGU_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
      ...(init.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (json as { errors?: unknown }).errors ?? `Iugu respondeu ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return json as T;
}

export type PixInvoice = {
  invoiceId: string;
  url: string;
  pixCode: string | null;
  expiresAt: string | null;
};

// Gera uma fatura avulsa com PIX (QR dinâmico que expira). Para assinatura
// recorrente com PIX a Iugu reaproveita o mesmo fluxo num plano — wiring final
// quando as chaves de sandbox estiverem nos secrets.
export async function createPixInvoice(input: {
  email: string;
  nome: string;
  descricao: string;
  priceCents: number;
  cpfCnpj?: string | null;
}): Promise<PixInvoice> {
  if (!iuguConfigured()) {
    throw new Error(
      "Cobrança ainda não configurada: faltam as chaves da Iugu (IUGU_API_TOKEN) nos secrets.",
    );
  }

  const dueDate = new Date(Date.now() + 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

  const inv = await iuguFetch<{
    id: string;
    secure_url: string;
    pix?: { qrcode_text?: string };
    due_date?: string;
  }>("/invoices", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      due_date: dueDate,
      ensure_workday_due_date: false,
      payable_with: ["pix"],
      items: [
        {
          description: input.descricao,
          quantity: 1,
          price_cents: input.priceCents,
        },
      ],
      payer: { name: input.nome, cpf_cnpj: input.cpfCnpj ?? undefined },
    }),
  });

  return {
    invoiceId: inv.id,
    url: inv.secure_url,
    pixCode: inv.pix?.qrcode_text ?? null,
    expiresAt: inv.due_date ?? dueDate,
  };
}
