"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { GATILHOS, ACOES } from "@/lib/automations/engine";
import { TODOS_STATUS } from "@/lib/constants";
import { criarAutomacao } from "./actions";

const inp =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";
const lbl = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]";

export function Builder() {
  const [gatilho, setGatilho] = useState("lead_created");
  const [acao, setAcao] = useState("create_task");
  const [auto, setAuto] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErr(null);
    start(async () => {
      const res = await criarAutomacao(fd);
      if (res.error) setErr(res.error);
      else {
        formRef.current?.reset();
        setGatilho("lead_created");
        setAcao("create_task");
        setAuto(true);
        router.refresh();
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <h2 className="mb-4 text-[15px] font-bold">Nova automação</h2>

      <div className="space-y-4">
        <div>
          <label className={lbl}>Nome</label>
          <input name="nome" required placeholder="Ex.: Follow-up automático de novos leads" className={inp} />
        </div>

        {/* Gatilho */}
        <div className="rounded-xl border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] p-4">
          <span className="mb-2 inline-block rounded-md bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-[var(--accent)]">Quando</span>
          <select name="gatilho" value={gatilho} onChange={(e) => setGatilho(e.target.value)} className={inp}>
            {GATILHOS.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
          {gatilho === "lead_stage" && (
            <div className="mt-3">
              <label className={lbl}>Estágio alvo</label>
              <select name="gatilho_valor" className={inp}>
                {TODOS_STATUS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Ação */}
        <div className="rounded-xl border border-[color-mix(in_srgb,var(--accent-2)_25%,transparent)] bg-[color-mix(in_srgb,var(--accent-2)_6%,transparent)] p-4">
          <span className="mb-2 inline-block rounded-md bg-[color-mix(in_srgb,var(--accent-2)_16%,transparent)] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-[var(--accent-2)]">Então</span>
          <select name="acao" value={acao} onChange={(e) => setAcao(e.target.value)} className={inp}>
            {ACOES.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>

          {(acao === "create_task" || acao === "create_event") && (
            <div className="mt-3">
              <label className={lbl}>Título</label>
              <input name="p_titulo" placeholder={acao === "create_task" ? "Follow-up: {cliente}" : "Contato com {cliente}"} className={inp} />
            </div>
          )}
          {acao === "create_task" && (
            <div className="mt-3">
              <label className={lbl}>Prioridade</label>
              <select name="p_prioridade" className={inp} defaultValue="Média">
                <option>Alta</option><option>Média</option><option>Baixa</option>
              </select>
            </div>
          )}
          {acao === "create_finance" && (
            <>
              <div className="mt-3">
                <label className={lbl}>Descrição</label>
                <input name="p_descricao" placeholder="Lançamento — {cliente}" className={inp} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Tipo</label>
                  <select name="p_tipo" className={inp} defaultValue="Entrada">
                    <option>Entrada</option><option>Saída</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Valor</label>
                  <input name="p_valor" type="number" disabled={auto} placeholder="0,00" className={`${inp} disabled:opacity-50`} />
                </div>
              </div>
              <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-sm text-[var(--muted)]">
                <input type="checkbox" name="p_auto" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="h-4 w-4" />
                Usar o valor do lead automaticamente
              </label>
            </>
          )}
        </div>

        {err && <p className="text-sm text-[var(--bad)]">{err}</p>}

        <p className="text-xs text-[var(--muted)]">
          Dica: use <code className="rounded bg-[var(--bg2)] px-1.5 py-0.5">{"{cliente}"}</code> no texto para inserir o nome do cliente.
        </p>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl py-3 font-bold text-white shadow-[0_12px_28px_-14px_rgba(37,99,235,.9)] transition hover:opacity-95 disabled:opacity-60"
          style={{ background: "linear-gradient(120deg,var(--accent),var(--brand-700,#1d4ed8))" }}
        >
          {pending ? "Criando…" : "Criar automação"}
        </button>
      </div>
    </form>
  );
}
