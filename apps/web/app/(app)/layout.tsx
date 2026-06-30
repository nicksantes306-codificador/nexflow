import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/billing/entitlements";
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

  const [ent, notificacoes] = await Promise.all([getEntitlements(), buscarNotificacoes()]);

  return (
    <div className="flex min-h-screen">
      <a href="#conteudo" className="nx-skip">Pular para o conteúdo</a>
      <AppSidebar email={user.email ?? "conta@nexflow"} plan={ent.plan} notificacoes={notificacoes} />

      <main className="min-w-0 flex-1 bg-[var(--bg)]">
        <MobileNav plan={ent.plan} notificacoes={notificacoes} />
        {ent.access === "readonly" && (
          <div className="bg-[var(--bad)] px-5 py-2 text-center text-xs font-semibold text-white">
            Conta em suspensão suave (somente leitura) — regularize em Planos &
            Cobrança.
          </div>
        )}
        <div id="conteudo" tabIndex={-1} className="outline-none">
          <RouteTransition>{children}</RouteTransition>
        </div>
      </main>
      <CommandPalette />
      <Toaster />
    </div>
  );
}
