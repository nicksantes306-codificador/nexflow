"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ConviteState = { ok?: boolean; error?: string };

type Cargo = "Admin" | "Gerente" | "Vendedor" | "Tecnico" | "Visualizador";
const ROLES: Cargo[] = ["Admin", "Gerente", "Vendedor", "Tecnico", "Visualizador"];

export async function convidarMembro(
  _prev: ConviteState,
  formData: FormData,
): Promise<ConviteState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "Vendedor") as Cargo;
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Informe um e-mail válido." };
  if (!ROLES.includes(role)) return { error: "Cargo inválido." };

  const supabase = await createClient();
  const { data: tenant } = await supabase.rpc("current_tenant_id");
  if (!tenant) return { error: "Nenhuma equipe ativa." };

  // já é membro?
  const { data: jaMembro } = await supabase.from("memberships").select("id").eq("email", email).maybeSingle();
  if (jaMembro) return { error: "Essa pessoa já está na sua equipe." };

  // já convidado (pendente)?
  const { data: jaConvite } = await supabase.from("invites").select("id").eq("email", email).is("used_at", null).maybeSingle();
  if (jaConvite) {
    await supabase.from("invites").update({ role }).eq("id", jaConvite.id);
    revalidatePath("/equipe");
    return { ok: true };
  }

  const { error } = await supabase.from("invites").insert({ tenant_id: tenant, email, role });
  if (error) return { error: error.message };

  revalidatePath("/equipe");
  return { ok: true };
}

export async function cancelarConvite(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("invites").delete().eq("id", id);
  revalidatePath("/equipe");
}
