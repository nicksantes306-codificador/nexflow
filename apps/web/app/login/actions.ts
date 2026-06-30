"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string };

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: traduzErro(error.message) };

  // Histórico de login (mesmo client, já com a sessão nova).
  try {
    const { data: tenant } = await supabase.rpc("current_tenant_id");
    const { data: { user } } = await supabase.auth.getUser();
    if (tenant) await supabase.from("audit_log").insert({ tenant_id: tenant, user_id: user?.id ?? null, acao: "Entrou", entidade: "Conta", alvo: email });
  } catch {}

  // Se a conta tem 2FA ativo, exige o código antes de liberar o sistema.
  let precisaMfa = false;
  try {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    precisaMfa = !!aal && aal.currentLevel === "aal1" && aal.nextLevel === "aal2";
  } catch {}
  if (precisaMfa) redirect("/mfa");

  redirect("/dashboard");
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const company = String(formData.get("company") ?? "").trim();
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { company } },
  });
  if (error) return { error: traduzErro(error.message) };

  // handle_new_user() já criou tenant + membership + profile.
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Espelha sbErr() do index.html — mensagens amigáveis em PT-BR.
function traduzErro(msg: string): string {
  if (/Invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/Email not confirmed/i.test(msg))
    return "Confirme seu e-mail antes de entrar (verifique o spam).";
  if (/User already registered/i.test(msg))
    return "Já existe uma conta com este e-mail.";
  if (/Password should be at least/i.test(msg))
    return "A senha precisa ter ao menos 6 caracteres.";
  if (/rate limit|too many/i.test(msg))
    return "Muitas tentativas. Aguarde alguns instantes.";
  return msg;
}
