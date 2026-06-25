"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { enviarDocumento, type FormState } from "@/app/(app)/clientes/actions";

// Upload de anexo reutilizável: serve para cliente (clientId) ou obra (projectId).
export function DocUploader({ clientId, projectId }: { clientId?: string; projectId?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(enviarDocumento, {});
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form ref={ref} action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="client_id" value={clientId ?? ""} />
      <input type="hidden" name="project_id" value={projectId ?? ""} />
      <input
        type="file"
        name="arquivo"
        required
        className="max-w-[230px] text-xs text-[var(--muted)] file:mr-2 file:cursor-pointer file:rounded-md file:border-0 file:bg-[var(--bg2)] file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--text)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Anexar"}
      </button>
      {state.error && <span className="text-xs text-[var(--bad)]">{state.error}</span>}
    </form>
  );
}
