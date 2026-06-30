"use client";

import { useActionState, useEffect, useRef, useState } from "react";

export type FormState = { error?: string; ok?: boolean };

export type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "email" | "date" | "select";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
};

// Formulário inline genérico: recebe um Server Action (prevState, FormData) e
// fecha sozinho ao sucesso. Usado por Clientes, Orçamentos e Financeiro.
export function QuickCreate({
  action,
  fields,
  title,
  submitLabel = "Salvar",
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  fields: Field[];
  title: string;
  submitLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Abre sozinho quando vem do ⌘K (rota com ?novo=1).
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("novo") === "1") {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state.ok]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        {title}
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="w-full rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--panel)] p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((f) => (
          <label key={f.name} className="block">
            <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
              {f.label}
              {f.required && <span className="text-brand-600"> *</span>}
            </span>
            {f.type === "select" ? (
              <select
                name={f.name}
                required={f.required}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-brand-600"
              >
                {(f.options ?? []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name={f.name}
                type={f.type ?? "text"}
                step={f.type === "number" ? "0.01" : undefined}
                placeholder={f.placeholder}
                required={f.required}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-brand-600"
              />
            )}
          </label>
        ))}
      </div>

      {state.error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Salvando…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--bg2)]"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
