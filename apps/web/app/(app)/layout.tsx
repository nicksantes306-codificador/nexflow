import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/billing/entitlements";
import { AppSidebar } from "./app-sidebar";

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

  const ent = await getEntitlements();

  return (
    <div className="flex min-h-screen">
      <AppSidebar email={user.email ?? "conta@nexflow"} plan={ent.plan} />

      <main className="min-w-0 flex-1 bg-[var(--bg)]">
        {ent.access === "readonly" && (
          <div className="bg-[var(--bad)] px-5 py-2 text-center text-xs font-semibold text-white">
            Conta em suspensão suave (somente leitura) — regularize em Planos &
            Cobrança.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
