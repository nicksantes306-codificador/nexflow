import type { Metadata } from "next";
import "./globals.css";
import { CookieBanner } from "@/components/cookie-banner";

export const metadata: Metadata = {
  title: "NEXFLOW — CRM + ERP para engenharia elétrica",
  description:
    "Gestão comercial, obras e financeiro para empresas de instalações elétricas industriais.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Aplica o tema salvo antes do paint (evita flash claro→escuro).
  const noFlash = `(function(){try{var t=localStorage.getItem('nexflow-theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t;}catch(e){}})();`;

  return (
    <html lang="pt-BR" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
