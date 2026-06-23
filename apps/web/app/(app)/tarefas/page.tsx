import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@nexflow/db";
import { PageHeader, TableShell, EmptyHint, KpiCard } from "@/components/ui";
import { QuickCreate, type Field } from "@/components/quick-create";
import { dateBR } from "@/lib/format";
import { criarTarefa, toggleTarefa } from "./actions";

export const dynamic = "force-dynamic";

type Task = Tables<"tasks">;

const CAMPOS: Field[] = [
  { name: "titulo", label: "Tarefa", required: true, placeholder: "Enviar proposta WEG" },
  { name: "cliente", label: "Cliente", placeholder: "WEG SA" },
  { name: "prioridade", label: "Prioridade", type: "select", options: [{ value: "Alta", label: "Alta" }, { value: "Média", label: "Média" }, { value: "Baixa", label: "Baixa" }] },
  { name: "prazo", label: "Prazo", type: "date" },
];

const PRIORIDADE_COR: Record<string, string> = {
  Alta: "var(--bad)",
  Média: "var(--warn)",
  Baixa: "var(--muted)",
};

function atrasada(prazo: string | null, done: boolean) {
  return !done && prazo != null && prazo < new Date().toISOString().slice(0, 10);
}

export default async function TarefasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .order("done", { ascending: true })
    .order("prazo", { ascending: true });
  const tarefas = (data ?? []) as Task[];
  const abertas = tarefas.filter((t) => !t.done).length;
  const vencidas = tarefas.filter((t) => atrasada(t.prazo, t.done)).length;
  const concluidas = tarefas.filter((t) => t.done).length;

  return (
    <div className="p-5 md:p-7">
      <PageHeader
        title="Tarefas"
        subtitle={`${abertas} abertas${vencidas > 0 ? ` · ${vencidas} vencidas` : ""}`}
        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>}
        action={<QuickCreate action={criarTarefa} title="+ Nova tarefa" fields={CAMPOS} />}
      />

      {tarefas.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <KpiCard label="Abertas" value={String(abertas)} />
          <KpiCard label="Vencidas" value={String(vencidas)} tone="red" />
          <KpiCard label="Concluídas" value={String(concluidas)} tone="green" />
        </div>
      )}

      {tarefas.length === 0 ? (
        <EmptyHint>Nenhuma tarefa ainda.</EmptyHint>
      ) : (
        <TableShell
          head={
            <tr>
              <th className="w-12 px-4 py-3"></th>
              <th className="px-4 py-3">Tarefa</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Prioridade</th>
              <th className="px-4 py-3">Prazo</th>
            </tr>
          }
        >
          {tarefas.map((t) => {
            const venc = atrasada(t.prazo, t.done);
            const cor = PRIORIDADE_COR[t.prioridade ?? "Média"];
            return (
              <tr key={t.id} className="transition hover:bg-[var(--bg2)]">
                <td className="px-4 py-3">
                  <form action={toggleTarefa}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="done" value={String(t.done)} />
                    <button
                      type="submit"
                      aria-label={t.done ? "Reabrir tarefa" : "Concluir tarefa"}
                      className={`grid h-5 w-5 cursor-pointer place-items-center rounded-md border transition ${t.done ? "border-[var(--ok)] bg-[var(--ok)] text-white" : "border-[var(--border)] text-transparent hover:border-[var(--accent)]"}`}
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </button>
                  </form>
                </td>
                <td className={`px-4 py-3 font-semibold ${t.done ? "text-[var(--muted)] line-through" : ""}`}>{t.titulo}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{t.cliente ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ color: cor, background: `color-mix(in srgb, ${cor} 14%, transparent)` }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: cor }} />
                    {t.prioridade ?? "Média"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: venc ? "var(--bad)" : "var(--muted)" }}>
                  {venc && "⚠ "}{dateBR(t.prazo)}
                </td>
              </tr>
            );
          })}
        </TableShell>
      )}
    </div>
  );
}
