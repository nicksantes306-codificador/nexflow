"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { excluirRegistro } from "@/lib/actions/delete";

type Props = {
  tabela: "clients" | "leads" | "projects" | "finance_entries" | "budgets" | "tasks" | "events";
  id: string;
  path: string;
  /** Texto do confirm: "Excluir o cliente X?" */
  nome?: string | null;
  className?: string;
};

const Lixeira = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
    <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" />
  </svg>
);

export function DeleteButton({ tabela, id, path, nome, className }: Props) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function onClick() {
    const msg = nome ? `Excluir "${nome}"? Não dá para desfazer.` : "Excluir este item? Não dá para desfazer.";
    if (!window.confirm(msg)) return;
    const fd = new FormData();
    fd.set("tabela", tabela);
    fd.set("id", id);
    fd.set("path", path);
    start(async () => {
      const r = await excluirRegistro(fd);
      if (r.error) window.alert(r.error);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label="Excluir"
      title="Excluir"
      className={
        className ??
        "grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--bad)] hover:bg-[color-mix(in_srgb,var(--bad)_12%,transparent)] hover:text-[var(--bad)] disabled:opacity-50"
      }
    >
      {pending ? "…" : Lixeira}
    </button>
  );
}
