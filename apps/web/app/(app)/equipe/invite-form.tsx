"use client";

import { useActionState } from "react";
import { convidarMembro, type ConviteState } from "./actions";

const ROLES = ["Admin", "Gerente", "Vendedor", "Tecnico", "Visualizador"];
const inp =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

export function InviteForm() {
  const [state, action, pending] = useActionState<ConviteState, FormData>(convidarMembro, {});
  return (
    <form action={action} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5" style={{ boxShadow: "var(--shadow)" }}>
      <h3 className="mb-1 text-[15px] font-bold">Convidar pessoa</h3>
      <p className="mb-4 text-[12px] text-[var(--muted)]">
        A pessoa se cadastra com esse e-mail e já entra direto na sua equipe — vendo só os dados de vocês.
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">E-mail</span>
          <input name="email" type="email" required placeholder="pessoa@empresa.com.br" className={inp} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Cargo</span>
          <select name="role" defaultValue="Vendedor" className={inp}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>

      {state.error && <p className="mt-3 text-sm text-[var(--bad)]">{state.error}</p>}
      {state.ok && <p className="mt-3 text-sm text-[var(--ok)]">Convite criado! Avise a pessoa para se cadastrar com esse e-mail.</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_-14px_rgba(37,99,235,.9)] transition hover:opacity-95 disabled:opacity-60"
        style={{ background: "linear-gradient(120deg,var(--accent),var(--brand-700,#1d4ed8))" }}
      >
        {pending ? "Convidando…" : "Convidar para a equipe"}
      </button>
    </form>
  );
}
