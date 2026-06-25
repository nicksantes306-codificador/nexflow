"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Field, FormState } from "./quick-create";

/**
 * Modal genérico de edição: reaproveita os mesmos `fields` do formulário de
 * criar, já preenchidos com os valores atuais (`initial`). Envia para um
 * Server Action (prev, FormData) que faz o UPDATE pelo id. Fecha sozinho ao ok.
 */
export function EditRecord({
  action,
  fields,
  initial,
  titulo = "Editar",
  className,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  fields: Field[];
  initial: Record<string, string | number | null | undefined>;
  titulo?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state.ok, router]);

  const val = (name: string) => {
    const v = initial[name];
    return v == null ? "" : String(v);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Editar"
        title="Editar"
        className={
          className ??
          "grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] hover:text-[var(--accent)]"
        }
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
          <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/45 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <form
            action={formAction}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-2xl"
            style={{ boxShadow: "var(--shadow)" }}
          >
            <h3 className="mb-4 text-base font-bold">{titulo}</h3>
            <input type="hidden" name="id" value={val("id")} />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <label key={f.name} className="block">
                  <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                    {f.label}
                    {f.required && <span className="text-[var(--accent)]"> *</span>}
                  </span>
                  {f.type === "select" ? (
                    <select
                      name={f.name}
                      required={f.required}
                      defaultValue={val(f.name)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                    >
                      {(f.options ?? []).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={f.name}
                      type={f.type ?? "text"}
                      step={f.type === "number" ? "0.01" : undefined}
                      placeholder={f.placeholder}
                      required={f.required}
                      defaultValue={val(f.name)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                    />
                  )}
                </label>
              ))}
            </div>

            {state.error && (
              <p className="mt-3 rounded-md border border-[color-mix(in_srgb,var(--bad)_35%,transparent)] bg-[color-mix(in_srgb,var(--bad)_10%,transparent)] px-3 py-2 text-sm text-[var(--bad)]">
                {state.error}
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {pending ? "Salvando…" : "Salvar alterações"}
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
        </div>
      )}
    </>
  );
}
