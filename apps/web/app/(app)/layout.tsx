import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarNotificacoes } from "@/lib/notifications";
import { AppSidebar } from "./app-sidebar";
import { MobileNav } from "./mobile-nav";
import { CommandPalette } from "@/components/command-palette";
import { RouteTransition } from "@/components/route-transition";
import { Toaster } from "@/components/toaster";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2FA: conta com fator verificado precisa completar o código (aal2) antes de
  // usar o sistema. Só afeta quem ativou 2FA (nextLevel aal2) — falha aberta.
  let precisaMfa = false;
  try {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    precisaMfa = !!aal && aal.currentLevel === "aal1" && aal.nextLevel === "aal2";
  } catch {}
  if (precisaMfa) redirect("/mfa");

  const notificacoes = await buscarNotificacoes();

  return (
    <div className="flex min-h-screen">
      <a href="#conteudo" className="nx-skip">Pular para o conteúdo</a>
      <AppSidebar email={user.email ?? "conta@nexflow"} notificacoes={notificacoes} />

      <main className="min-w-0 flex-1 bg-[var(--bg)]">
        <MobileNav notificacoes={notificacoes} />
        <div id="conteudo" tabIndex={-1} className="outline-none">
          <RouteTransition>{children}</RouteTransition>
        </div>
      </main>
      <CommandPalette />
      <Toaster />
    </div>
  );
}
