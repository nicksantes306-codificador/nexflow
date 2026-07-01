"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GATILHOS, ACOES, OPERADORES, gatilhoTemValor } from "@/lib/automations/engine";
import { TODOS_STATUS } from "@/lib/constants";
import { toast } from "@/components/toaster";
import { criarAutomacao, sugerirAutomacao } from "./actions";
import type { SugestaoAutomacao } from "@/lib/automations/ai-flow";

const inp =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";
const lbl = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]";

export function Builder() {
  const [gatilho, setGatilho] = useState("lead_created");
  const [acao, setAcao] = useState("create_task");
  const [auto, setAuto] = useState(true);
  const [condAtiva, setCondAtiva] = useState(false);
  const [condOperador, setCondOperador] = useState(">=");
  const [condValor, setCondValor] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  // Painel "Criar com IA"
  const [iaTexto, setIaTexto] = useState("");
  const [iaPending, startIa] = useTransition();
  const [pendingFill, setPendingFill] = useState<SugestaoAutomacao | null>(null);

  function sugerirComIA() {
    if (!iaTexto.trim() || iaPending) return;
    startIa(async () => {
      const sug = await sugerirAutomacao(iaTexto);
      setGatilho(sug.gatilho);
      setAcao(sug.acao);
      setCondAtiva(!!sug.condicao);
      if (sug.condicao) {
        setCondOperador(sug.condicao.operador);
        setCondValor(String(sug.condicao.valor));
      }
      setPendingFill(sug); // preenche nome/param depois que os campos da ação renderizarem
      toast("Sugestão pronta — confira e crie a automação");
    });
  }

  // Preenche os campos de texto (não controlados) depois que a ação escolhida
  // pela IA já renderizou seus inputs específicos.
  useEffect(() => {
    if (!pendingFill) return;
    const form = formRef.current;
    if (!form) return;
    const set = (nome: string, valor: string) => {
      const el = form.elements.namedItem(nome) as HTMLInputElement | HTMLSelectElement | null;
      if (el) el.value = valor;
    };
    set("nome", pendingFill.nome);
    if (pendingFill.acao === "create_task") {
      set("p_titulo", String(pendingFill.param.titulo ?? ""));
      set("p_prioridade", String(pendingFill.param.prioridade ?? "Média"));
    } else if (pendingFill.acao === "create_finance") {
      set("p_descricao", String(pendingFill.param.descricao ?? ""));
      set("p_tipo", String(pendingFill.param.tipo ?? "Entrada"));
      setAuto(pendingFill.param.valorAuto !== false);
    } else if (pendingFill.acao === "create_event") {
      set("p_titulo", String(pendingFill.param.titulo ?? ""));
    }
    setPendingFill(null);
  }, [pendingFill, acao]);

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
        setCondAtiva(false);
        setCondOperador(">=");
        setCondValor("");
        setIaTexto("");
        toast("Automação criada");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Criar com IA */}
      <div className="rounded-2xl border border-[color-mix(in_srgb,var(--accent-2)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent-2)_6%,transparent)] p-4">
        <div className="mb-2 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.4L12 17l-1.9-5.6L4.5 10l5.6-1.4z" /></svg>
          <h3 className="text-[13.5px] font-bold">Criar com IA</h3>
        </div>
        <p className="mb-2.5 text-[12px] text-[var(--muted)]">Descreva em português — ex.: &ldquo;quando um orçamento for aprovado acima de R$ 50.000, criar uma tarefa para o financeiro&rdquo;.</p>
        <textarea
          value={iaTexto}
          onChange={(e) => setIaTexto(e.target.value)}
          rows={2}
          placeholder="Quando… então…"
          className={`${inp} resize-none`}
        />
        <button
          type="button"
          onClick={sugerirComIA}
          disabled={iaPending || !iaTexto.trim()}
          className="mt-2.5 w-full rounded-lg py-2 text-[13px] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--accent-2)" }}
        >
          {iaPending ? "Pensando…" : "Sugerir automação"}
        </button>
      </div>

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
            <select
              name="gatilho"
              value={gatilho}
              onChange={(e) => {
                setGatilho(e.target.value);
                if (!gatilhoTemValor(e.target.value)) setCondAtiva(false);
              }}
              className={inp}
            >
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

          {/* Condição opcional — só para gatilhos que carregam valor em R$ */}
          {gatilhoTemValor(gatilho) && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg2)] p-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="p_cond_ativo" checked={condAtiva} onChange={(e) => setCondAtiva(e.target.checked)} className="h-4 w-4" />
              Só executar se o valor…
            </label>
            {condAtiva && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Condição</label>
                  <select name="p_cond_operador" value={condOperador} onChange={(e) => setCondOperador(e.target.value)} className={inp}>
                    {OPERADORES.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Valor (R$)</label>
                  <input name="p_cond_valor" type="number" value={condValor} onChange={(e) => setCondValor(e.target.value)} placeholder="50000" className={inp} />
                </div>
              </div>
            )}
          </div>
          )}

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
            style={{ background: "linear-gradient(120deg,var(--accent),var(--brand-700,#003fa3))" }}
          >
            {pending ? "Criando…" : "Criar automação"}
          </button>
        </div>
      </form>
    </div>
  );
}
