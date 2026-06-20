import { accessLevel, type AccessLevel, type SubStatus } from "@nexflow/core";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@nexflow/db";

export type Subscription = Tables<"subscriptions">;

export type Entitlements = {
  plan: string;
  status: SubStatus;
  access: AccessLevel;
  graceUntil: string | null;
  subscription: Subscription | null;
};

// Lê a assinatura do tenant e deriva o nível de acesso (regra pura em
// @nexflow/core). Sem assinatura → trata como DEMO/trial (full).
export async function getEntitlements(): Promise<Entitlements> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sub = (data as Subscription | null) ?? null;
  const status = (sub?.status ?? "trialing") as SubStatus;
  const graceUntil = sub?.grace_until ?? null;

  return {
    plan: sub?.plan ?? "DEMO",
    status,
    access: accessLevel(status, graceUntil),
    graceUntil,
    subscription: sub,
  };
}
