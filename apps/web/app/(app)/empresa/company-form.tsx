"use client";

import { useActionState, useState } from "react";
import { salvarEmpresa, type FormState } from "./actions";

type BrasilAPICnpj = {
  razao_social?: string;
  nome_fantasia?: string;
  cnae_fiscal_descricao?: string;
  municipio?: string;
  uf?: string;
};

export function CompanyForm({
  nomeInicial,
  cnpjInicial,
}: {
  nomeInicial: string;
  cnpjInicial: string;
}) {
  const [nome, setNome] = useState(nomeInicial);
  const [cnpj, setCnpj] = useState(cnpjInicial);
  const [segmento, setSegmento] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    salvarEmpresa,
    {},
  );

  async function buscarCnpj() {
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) {
      setAviso("Digite os 14 dígitos do CNPJ.");
      return;
    }
    setBuscando(true);
    setAviso(null);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) throw new Error("CNPJ não encontrado.");
      const d: BrasilAPICnpj = await res.json();
      setNome(d.razao_social ?? nome);
      setSegmento(d.cnae_fiscal_descricao ?? "");
      setAviso(
        `Encontrado: ${d.razao_social ?? ""}${
          d.municipio ? ` — ${d.municipio}/${d.uf}` : ""
        }`,
      );
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Falha ao consultar o CNPJ.");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <form action={formAction} className="max-w-lg space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
          CNPJ
        </span>
        <div className="flex gap-2">
          <input
            name="cnpj"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            placeholder="00.000.000/0001-00"
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-brand-600"
          />
          <button
            type="button"
            onClick={buscarCnpj}
            disabled={buscando}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--bg2)] disabled:opacity-60"
          >
            {buscando ? "Buscando…" : "Buscar CNPJ"}
          </button>
        </div>
      </label>

      {aviso && (
        <p className="rounded-md bg-[var(--bg2)] px-3 py-2 text-xs text-[var(--muted)]">
          {aviso}
        </p>
      )}

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
          Razão social
        </span>
        <input
          name="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-brand-600"
        />
      </label>

      {segmento && (
        <p className="text-xs text-[var(--muted)]">Atividade: {segmento}</p>
      )}

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-md bg-[var(--bg2)] px-3 py-2 text-sm text-[var(--stage-aprovado)]">
          Dados da empresa salvos ✓
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}
