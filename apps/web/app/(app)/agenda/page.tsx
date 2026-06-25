import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@nexflow/db";
import { PageHeader, EmptyHint, KpiCard } from "@/components/ui";
import { QuickCreate, type Field } from "@/components/quick-create";
import { DeleteButton } from "@/components/delete-button";
import { EditRecord } from "@/components/edit-record";
import { criarEvento, editarEvento } from "./actions";

export const dynamic = "force-dynamic";

type Evento = Tables<"events">;

const CAMPOS: Field[] = [
  { name: "titulo", label: "Evento", required: true, placeholder: "Visita técnica — SUB" },
  { name: "data", label: "Data", type: "date", required: true },
  { name: "hora", label: "Hora", placeholder: "09:00" },
  { name: "tipo", label: "Tipo", type: "select", options: [{ value: "reunião", label: "Reunião" }, { value: "visita", label: "Visita" }, { value: "entrega", label: "Entrega" }, { value: "outro", label: "Outro" }] },
  { name: "cliente", label: "Cliente", placeholder: "Marcopolo SA" },
  { name: "local", label: "Local", placeholder: "Caxias do Sul" },
];

const TIPO: Record<string, { cor: string; icon: React.ReactNode }> = {
  reunião: { cor: "var(--stage-proposta)", icon: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /> },
  visita: { cor: "var(--stage-contato)", icon: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></> },
  entrega: { cor: "var(--stage-aprovado)", icon: <><path d="M16 3h5v13H3V3h5" /><path d="M8 3v6h8V3M3 16l4 5h10l4-5" /></> },
  outro: { cor: "var(--accent)", icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></> },
};

const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

export default async function AgendaPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").order("data", { ascending: true });
  const eventos = (data ?? []) as Evento[];

  const hoje = new Date().toISOString().slice(0, 10);
  const em7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const futuros = eventos.filter((e) => e.data >= hoje);
  const deHoje = eventos.filter((e) => e.data === hoje).length;
  const semana = eventos.filter((e) => e.data >= hoje && e.data <= em7).length;

  return (
    <div className="p-5 md:p-7">
      <PageHeader
        title="Agenda"
        subtitle={`${futuros.length} compromissos a partir de hoje`}
        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>}
        action={<QuickCreate action={criarEvento} title="+ Novo evento" fields={CAMPOS} />}
      />

      {eventos.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <KpiCard label="Hoje" value={String(deHoje)} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>} />
          <KpiCard label="Próximos 7 dias" value={String(semana)} tone="amber" />
          <KpiCard label="Total agendado" value={String(futuros.length)} />
        </div>
      )}

      {eventos.length === 0 ? (
        <EmptyHint>Nenhum evento agendado. Crie o primeiro no botão acima.</EmptyHint>
      ) : (
        <ul className="space-y-2.5">
          {eventos.map((e) => {
            const passado = e.data < hoje;
            const t = TIPO[e.tipo ?? "outro"] ?? TIPO.outro;
            const [, m, d] = e.data.split("-");
            return (
              <li
                key={e.id}
                className={`flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3.5 transition hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] ${passado ? "opacity-55" : ""}`}
                style={{ boxShadow: "var(--shadow)" }}
              >
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--bg2)]">
                  <span className="text-[19px] font-extrabold leading-none">{d}</span>
                  <span className="mt-0.5 text-[10px] font-bold tracking-wider text-[var(--muted)]">{MESES[+m - 1]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{e.titulo}</p>
                  <p className="mt-0.5 text-[12px] text-[var(--muted)]">
                    {[e.hora, e.cliente, e.local].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                {e.tipo && (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ color: t.cor, background: `color-mix(in srgb, ${t.cor} 14%, transparent)` }}>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{t.icon}</svg>
                    {e.tipo}
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <EditRecord
                    action={editarEvento}
                    titulo="Editar evento"
                    fields={CAMPOS}
                    initial={{ id: e.id, titulo: e.titulo, data: e.data, hora: e.hora ?? "", tipo: e.tipo ?? "", cliente: e.cliente ?? "", local: e.local ?? "" }}
                  />
                  <DeleteButton tabela="events" id={e.id} path="/agenda" nome={e.titulo} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
