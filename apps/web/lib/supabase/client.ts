"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@nexflow/db";

// Client de browser (componentes "use client"). Usa apenas a anon key.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
