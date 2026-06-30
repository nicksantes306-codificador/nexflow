import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MfaForm } from "./mfa-form";

export const dynamic = "force-dynamic";

export default async function MfaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let precisa = false;
  try {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    precisa = !!aal && aal.currentLevel === "aal1" && aal.nextLevel === "aal2";
  } catch {}
  if (!precisa) redirect("/dashboard");

  return <MfaForm />;
}
