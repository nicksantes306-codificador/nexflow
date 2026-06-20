import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/lib/types";
import { ESTAGIOS } from "@/lib/constants";
import { money } from "@/lib/format";
import { KanbanBoard } from "./kanban-board";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const supabase = await createClient();

  // RLS filtra automaticamente pelos leads do tenant do usuário.
  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .order("valor", { ascending: false });

  const lista = (leads ?? []) as Lead[];
  const pipeline = lista
    .filter((l) => ESTAGIOS.includes(l.status as (typeof ESTAGIOS)[number]))
    .reduce((acc, l) => acc + Number(l.valor), 0);

  return (
    <div className="p-5 md:p-7">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">CRM · Funil de vendas</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {lista.length} leads · pipeline ativo{" "}
            <span className="font-mono font-bold text-brand-600">
              {money(pipeline)}
            </span>
          </p>
        </div>
      </header>

      {error && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Não foi possível carregar os leads: {error.message}
          <br />
          Dica: rode <code>supabase/seed.sql</code> e{" "}
          <code>select public.attach_me_to_demo();</code> para popular a demo.
        </p>
      )}

      <KanbanBoard leads={lista} />
    </div>
  );
}
