import type { Metadata } from "next";
import "./globals.css";
import { CookieBanner } from "@/components/cookie-banner";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexflow.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "NEXFLOW — O CRM + ERP das empresas de engenharia elétrica",
  description:
    "CRM, orçamentos, obras e financeiro para empresas de instalações elétricas e automação industrial. Teste 14 dias grátis.",
  keywords: [
    "CRM para engenharia elétrica",
    "orçamento de painel elétrico",
    "gestão de obras elétricas",
    "ERP industrial",
    "software para automação industrial",
  ],
  openGraph: {
    title: "NEXFLOW — CRM + ERP para engenharia elétrica",
    description:
      "Centralize vendas, obras e financeiro. Feito para empresas de instalações elétricas industriais.",
    url: SITE,
    siteName: "NEXFLOW",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
