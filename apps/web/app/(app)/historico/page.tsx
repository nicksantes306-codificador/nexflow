import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@nexflow/db";
import { PageHeader, EmptyHint } from "@/components/ui";

export const dynamic = "force-dynamic";

type Audit = Tables<"audit_log">;

const ACAO_COR: Record<string, string> = {
  Criou: "var(--ok)",
  Editou: "var(--accent)",
  Excluiu: "var(--bad)",
  Restaurou: "var(--warn)",
  Convidou: "var(--accent)",
  Moveu: "var(--accent)",
};

const ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" /></svg>
);

function quando(iso: string): string {
  const d = new Date(iso);
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "agora há pouco";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function HistoricoPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200);
  const eventos = (data ?? []) as Audit[];

  const ids = [...new Set(eventos.map((e) => e.user_id).filter(Boolean))] as string[];
  const nomePorId: Record<string, string> = {};
  if (ids.length) {
    const { data: profs } = await supabase.from("profiles").select("id,full_name").in("id", ids);
    for (const p of (profs ?? []) as { id: string; full_name: string | null }[]) {
      nomePorId[p.id] = (p.full_name ?? "").trim();
    }
  }

  return (
    <div className="p-5 md:p-7">
      <PageHeader
        title="Histórico de alterações"
        subtitle="Tudo que a equipe criou, editou e excluiu — em ordem"
        icon={ICON}
      />

      {eventos.length === 0 ? (
        <EmptyHint title="Sem movimentações ainda">
          Assim que alguém criar, editar ou excluir algo, o registro aparece aqui — com quem fez e quando.
        </EmptyHint>
      ) : (
        <ol className="relative ml-3 border-l border-[var(--border)]">
          {eventos.map((e) => {
            const cor = ACAO_COR[e.acao] ?? "var(--muted)";
            const quem = (e.user_id && nomePorId[e.user_id]) || "Alguém da equipe";
            return (
              <li key={e.id} className="relative mb-3 pl-6">
                <span className="absolute -left-[6.5px] top-1.5 h-3 w-3 rounded-full border-2 border-[var(--bg)]" style={{ background: cor }} />
                <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-2.5" style={{ boxShadow: "var(--shadow)" }}>
                  <p className="text-[13.5px] leading-snug">
                    <b>{quem}</b>{" "}
                    <span style={{ color: cor, fontWeight: 700 }}>{e.acao.toLowerCase()}</span>
                    {e.entidade ? ` ${e.entidade.toLowerCase()}` : ""}
                    {e.alvo ? (
                      <>
                        {" "}
                        <b>&ldquo;{e.alvo}&rdquo;</b>
                      </>
                    ) : ""}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--muted)]">{quando(e.created_at)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
