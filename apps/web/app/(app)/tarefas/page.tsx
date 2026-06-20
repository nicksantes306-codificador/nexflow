import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@nexflow/db";
import { PageHeader, TableShell, EmptyHint } from "@/components/ui";
import { QuickCreate, type Field } from "@/components/quick-create";
import { dateBR } from "@/lib/format";
import { criarTarefa, toggleTarefa } from "./actions";

export const dynamic = "force-dynamic";

type Task = Tables<"tasks">;

const CAMPOS: Field[] = [
  { name: "titulo", label: "Tarefa", required: true, placeholder: "Enviar proposta WEG" },
  { name: "cliente", label: "Cliente", placeholder: "WEG SA" },
  {
    name: "prioridade",
    label: "Prioridade",
    type: "select",
    options: [
      { value: "Alta", label: "Alta" },
      { value: "Média", label: "Média" },
      { value: "Baixa", label: "Baixa" },
    ],
  },
  { name: "prazo", label: "Prazo", type: "date" },
];

const PRIORIDADE_COR: Record<string, string> = {
  Alta: "var(--stage-perdido)",
  Média: "var(--stage-negociacao)",
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

  return (
    <div className="p-5 md:p-7">
      <PageHeader
        title="Tarefas"
        subtitle={
          <>
            {abertas} abertas
            {vencidas > 0 && (
              <span className="ml-2 font-semibold text-[var(--stage-perdido)]">
                · {vencidas} vencidas
              </span>
            )}
          </>
        }
        action={<QuickCreate action={criarTarefa} title="+ Nova tarefa" fields={CAMPOS} />}
      />

      {tarefas.length === 0 ? (
        <EmptyHint>Nenhuma tarefa ainda.</EmptyHint>
      ) : (
        <TableShell
          head={
            <tr>
              <th className="px-4 py-2.5 w-10"></th>
              <th className="px-4 py-2.5">Tarefa</th>
              <th className="px-4 py-2.5">Cliente</th>
              <th className="px-4 py-2.5">Prioridade</th>
              <th className="px-4 py-2.5">Prazo</th>
            </tr>
          }
        >
          {tarefas.map((t) => (
            <tr key={t.id} className="hover:bg-[var(--bg2)]">
              <td className="px-4 py-2.5">
                <form action={toggleTarefa}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="done" value={String(t.done)} />
                  <button
                    type="submit"
                    aria-label={t.done ? "Reabrir tarefa" : "Concluir tarefa"}
                    className={`flex h-5 w-5 items-center justify-center rounded border text-[11px] ${
                      t.done
                        ? "border-[var(--stage-aprovado)] bg-[var(--stage-aprovado)] text-white"
                        : "border-[var(--border)] text-transparent hover:border-brand-600"
                    }`}
                  >
                    ✓
                  </button>
                </form>
              </td>
              <td
                className={`px-4 py-2.5 font-semibold ${
                  t.done ? "text-[var(--muted)] line-through" : ""
                }`}
              >
                {t.titulo}
              </td>
              <td className="px-4 py-2.5 text-[var(--muted)]">{t.cliente ?? "—"}</td>
              <td className="px-4 py-2.5">
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                  style={{ background: PRIORIDADE_COR[t.prioridade ?? "Média"] }}
                >
                  {t.prioridade ?? "Média"}
                </span>
              </td>
              <td
                className="px-4 py-2.5"
                style={{
                  color: atrasada(t.prazo, t.done)
                    ? "var(--stage-perdido)"
                    : "var(--muted)",
                }}
              >
                {dateBR(t.prazo)}
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
