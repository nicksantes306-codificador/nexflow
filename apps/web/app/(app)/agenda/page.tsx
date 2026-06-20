import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@nexflow/db";
import { PageHeader, EmptyHint } from "@/components/ui";
import { QuickCreate, type Field } from "@/components/quick-create";
import { dateBR } from "@/lib/format";
import { criarEvento } from "./actions";

export const dynamic = "force-dynamic";

type Evento = Tables<"events">;

const CAMPOS: Field[] = [
  { name: "titulo", label: "Evento", required: true, placeholder: "Visita técnica — SUB" },
  { name: "data", label: "Data", type: "date", required: true },
  { name: "hora", label: "Hora", placeholder: "09:00" },
  {
    name: "tipo",
    label: "Tipo",
    type: "select",
    options: [
      { value: "reunião", label: "Reunião" },
      { value: "visita", label: "Visita" },
      { value: "entrega", label: "Entrega" },
      { value: "outro", label: "Outro" },
    ],
  },
  { name: "cliente", label: "Cliente", placeholder: "Marcopolo SA" },
  { name: "local", label: "Local", placeholder: "Caxias do Sul" },
];

const TIPO_COR: Record<string, string> = {
  reunião: "var(--stage-proposta)",
  visita: "var(--stage-contato)",
  entrega: "var(--stage-aprovado)",
};

export default async function AgendaPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("data", { ascending: true });
  const eventos = (data ?? []) as Evento[];

  const hoje = new Date().toISOString().slice(0, 10);
  const futuros = eventos.filter((e) => e.data >= hoje);

  return (
    <div className="p-5 md:p-7">
      <PageHeader
        title="Agenda"
        subtitle={`${futuros.length} eventos a partir de hoje`}
        action={<QuickCreate action={criarEvento} title="+ Novo evento" fields={CAMPOS} />}
      />

      {eventos.length === 0 ? (
        <EmptyHint>
          Nenhum evento agendado. Sync com Google Calendar/Outlook entra no
          backlog (pós-Sprint 5).
        </EmptyHint>
      ) : (
        <ul className="space-y-2">
          {eventos.map((e) => {
            const passado = e.data < hoje;
            return (
              <li
                key={e.id}
                className={`flex items-center gap-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--panel)] p-3 ${
                  passado ? "opacity-55" : ""
                }`}
              >
                <div className="w-16 shrink-0 text-center">
                  <p className="font-mono text-sm font-extrabold text-brand-600">
                    {dateBR(e.data)}
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">{e.hora ?? "—"}</p>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{e.titulo}</p>
                  <p className="text-[12px] text-[var(--muted)]">
                    {[e.cliente, e.local].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                {e.tipo && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ background: TIPO_COR[e.tipo] ?? "var(--muted)" }}
                  >
                    {e.tipo}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
