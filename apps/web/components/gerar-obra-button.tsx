"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { gerarObraDoOrcamento } from "@/app/(app)/orcamentos/actions";
import { toast } from "@/components/toaster";

// Transforma um orçamento aprovado em Obra + lançamento financeiro (1 clique).
export function GerarObraButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function onClick() {
    if (!window.confirm("Gerar uma obra e um lançamento financeiro (entrada prevista) a partir deste orçamento?")) return;
    const fd = new FormData();
    fd.set("id", id);
    start(async () => {
      const r = await gerarObraDoOrcamento(fd);
      if (r.error) {
        toast(r.error, "erro");
        return;
      }
      toast("Obra e financeiro criados a partir do orçamento");
      if (r.projectId) router.push(`/projetos/${r.projectId}`);
      else router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label="Gerar obra e financeiro"
      title="Gerar obra + financeiro"
      className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] hover:text-[var(--accent)] disabled:opacity-50"
    >
      {pending ? "…" : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
          <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-1H2z" /><path d="M10 9V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4" /><path d="M4 16v-3a6 6 0 0 1 6-6" /><path d="M14 7a6 6 0 0 1 6 6v3" />
        </svg>
      )}
    </button>
  );
}
