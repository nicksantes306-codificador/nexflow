"use client";

import { useEffect, useRef, useState } from "react";
import { LogoGlyph } from "@/components/logo";
import type { ChatMsg } from "@/lib/ai/nexflow-ai";

const SUGESTOES = [
  "Resumo das vendas",
  "O que fazer hoje?",
  "Obras com problema",
  "Como está o financeiro?",
];

export function AiChat({
  send,
  configured,
}: {
  send: (history: ChatMsg[]) => Promise<{ reply: string }>;
  configured: boolean;
}) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, pending]);

  async function enviar(texto: string) {
    const t = texto.trim();
    if (!t || pending) return;
    const novo: ChatMsg[] = [...msgs, { role: "user", content: t }];
    setMsgs(novo);
    setInput("");
    setPending(true);
    try {
      const { reply } = await send(novo);
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Tive um problema ao responder. Tente novamente." }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-1px)] w-full max-w-3xl flex-col px-4 py-5 md:px-6">
      {/* header */}
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--accent)_22%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
          <LogoGlyph size={20} />
        </span>
        <div className="flex-1">
          <h1 className="text-[19px] font-extrabold tracking-tight">NEXFLOW AI</h1>
          <p className="text-[12px] text-[var(--muted)]">Pergunte e ele responde sobre suas vendas, obras e finanças</p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={
            configured
              ? { color: "var(--ok, #059669)", background: "color-mix(in srgb, var(--accent) 12%, transparent)" }
              : { color: "var(--muted)", background: "var(--bg2)" }
          }
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: configured ? "#10b981" : "var(--muted)" }} />
          {configured ? "Claude conectado" : "Modo local"}
        </span>
      </div>

      {/* mensagens */}
      <div className="flex-1 space-y-4 overflow-y-auto pb-2">
        {msgs.length === 0 && (
          <div className="grid h-full place-items-center text-center">
            <div>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--panel)] text-[var(--accent)]" style={{ boxShadow: "var(--shadow)" }}>
                <LogoGlyph size={26} />
              </span>
              <p className="mt-4 text-[15px] font-bold">Como posso ajudar?</p>
              <p className="mt-1 text-[13px] text-[var(--muted)]">
                Pergunte sobre suas vendas, obras, finanças ou o que fazer primeiro.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {SUGESTOES.map((s) => (
                  <button
                    key={s}
                    onClick={() => enviar(s)}
                    className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3.5 py-2 text-[13px] font-medium transition hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] hover:text-[var(--accent)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[var(--accent)] px-4 py-2.5 text-[14px] text-white">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[color-mix(in_srgb,var(--accent)_22%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
                <LogoGlyph size={16} />
              </span>
              <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-md border border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 text-[14px] leading-relaxed" style={{ boxShadow: "var(--shadow)" }}>
                {m.content}
              </div>
            </div>
          ),
        )}

        {pending && (
          <div className="flex gap-3">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[color-mix(in_srgb,var(--accent)_22%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
              <LogoGlyph size={16} />
            </span>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-[var(--border)] bg-[var(--panel)] px-4 py-3">
              <Dot /> <Dot d={0.15} /> <Dot d={0.3} />
            </div>
          </div>
        )}
        <div ref={fim} />
      </div>

      {/* entrada */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(input);
        }}
        className="mt-2 flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-2 focus-within:border-[var(--accent)]"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar(input);
            }
          }}
          rows={1}
          placeholder="Escreva sua pergunta…"
          className="max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-[14px] outline-none placeholder:text-[var(--muted)]"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          aria-label="Enviar"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white transition disabled:opacity-40"
          style={{ background: "linear-gradient(120deg,var(--accent),var(--brand-700,#1d4ed8))" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
        </button>
      </form>
      <p className="mt-2 text-center text-[11px] text-[var(--muted)]">
        {configured
          ? "Respostas geradas por IA a partir dos seus dados — confira antes de decisões críticas."
          : "Modo local ativo. Adicione ANTHROPIC_API_KEY para respostas com IA completa."}
      </p>
    </div>
  );
}

function Dot({ d = 0 }: { d?: number }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-[var(--muted)]"
      style={{ animation: "nx-blink 1s ease-in-out infinite", animationDelay: `${d}s` }}
    />
  );
}
