"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { excluirTodosDados, type LimparState } from "./actions";
import { toast } from "@/components/toaster";

const FRASE = "EXCLUIR TUDO";

export function DangerZone({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");
  const [state, formAction, pending] = useActionState<LimparState, FormData>(excluirTodosDados, {});
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      toast("Todos os dados foram apagados");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <section className="rounded-2xl border border-[color-mix(in_srgb,var(--bad)_35%,var(--border))] bg-[color-mix(in_srgb,var(--bad)_5%,var(--panel))] p-5">
      <h3 className="text-[15px] font-bold text-[var(--bad)]">Zona de perigo</h3>
      <p className="mt-1 text-[13px] text-[var(--muted)]">
        Apaga clientes, obras, orçamentos, financeiro, tarefas, agenda, estoque, automações e documentos — tudo, de uma vez. Não dá para desfazer.
        Sua conta e o login continuam funcionando, só os dados cadastrados somem.
      </p>
      {!isAdmin ? (
        <p className="mt-4 text-[13px] text-[var(--muted)]">Só um administrador da equipe pode fazer isso.</p>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 rounded-lg border border-[var(--bad)] px-4 py-2 text-sm font-bold text-[var(--bad)] transition hover:bg-[var(--bad)] hover:text-white"
        >
          Excluir todos os dados
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => !pending && setOpen(false)}>
          <form
            action={formAction}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6"
            style={{ boxShadow: "var(--shadow)" }}
          >
            <h4 className="text-[16px] font-bold text-[var(--bad)]">Tem certeza?</h4>
            <p className="mt-2 text-[13.5px] text-[var(--muted)]">
              Isso vai apagar <strong className="text-[var(--text)]">permanentemente</strong> todos os dados da sua equipe. Não existe desfazer nem backup automático.
            </p>
            <p className="mt-3 text-[13px]">
              Para confirmar, digite <strong className="font-mono">{FRASE}</strong> abaixo:
            </p>
            <input
              name="confirmacao"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              autoFocus
              autoComplete="off"
              placeholder={FRASE}
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--bad)]"
            />
            {state.error && <p className="mt-2 text-sm text-[var(--bad)]">{state.error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={texto.trim() !== FRASE || pending}
                className="rounded-lg bg-[var(--bad)] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
              >
                {pending ? "Apagando…" : "Sim, apagar tudo"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--bg2)]"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
