"use client";

import { useActionState, useState } from "react";
import { salvarEmpresa, type FormState } from "./actions";

export type EmpresaInicial = {
  nome: string;
  cnpj: string;
  nome_fantasia: string;
  situacao: string;
  abertura: string;
  cnae: string;
  natureza_juridica: string;
  porte: string;
  capital_social: string;
  endereco: string;
  telefone: string;
  email: string;
};

type BrasilAPICnpj = {
  razao_social?: string;
  nome_fantasia?: string;
  descricao_situacao_cadastral?: string;
  data_inicio_atividade?: string;
  cnae_fiscal?: number;
  cnae_fiscal_descricao?: string;
  natureza_juridica?: string;
  porte?: string;
  capital_social?: number;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  ddd_telefone_1?: string;
};

const inp =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";
const lbl = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={lbl}>{label}</span>
      {children}
    </label>
  );
}

export function CompanyForm({ inicial }: { inicial: EmpresaInicial }) {
  const [f, setF] = useState<EmpresaInicial>(inicial);
  const [dados, setDados] = useState<string>("");
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<FormState, FormData>(salvarEmpresa, {});

  const set = (k: keyof EmpresaInicial, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function buscarCnpj() {
    const digits = f.cnpj.replace(/\D/g, "");
    if (digits.length !== 14) {
      setAviso("Digite os 14 dígitos do CNPJ.");
      return;
    }
    setBuscando(true);
    setAviso(null);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) throw new Error("CNPJ não encontrado na base pública.");
      const d: BrasilAPICnpj = await res.json();
      const endereco = [
        [d.logradouro, d.numero].filter(Boolean).join(", "),
        d.complemento,
        d.bairro,
        [d.municipio, d.uf].filter(Boolean).join("/"),
        d.cep ? `CEP ${d.cep}` : "",
      ].filter(Boolean).join(" — ");

      setF({
        nome: d.razao_social ?? f.nome,
        cnpj: f.cnpj,
        nome_fantasia: d.nome_fantasia ?? "",
        situacao: d.descricao_situacao_cadastral ?? "",
        abertura: d.data_inicio_atividade ?? "",
        cnae: [d.cnae_fiscal, d.cnae_fiscal_descricao].filter(Boolean).join(" — "),
        natureza_juridica: d.natureza_juridica ?? "",
        porte: d.porte ?? "",
        capital_social: d.capital_social != null ? String(d.capital_social) : "",
        endereco,
        telefone: d.ddd_telefone_1 ?? "",
        email: "",
      });
      setDados(JSON.stringify(d));
      setAviso(`Dados encontrados: ${d.razao_social ?? ""}${d.municipio ? ` — ${d.municipio}/${d.uf}` : ""}. Confira e salve.`);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Falha ao consultar o CNPJ.");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <form action={formAction} className="max-w-2xl">
      <input type="hidden" name="dados" value={dados} />

      {/* CNPJ + busca */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5" style={{ boxShadow: "var(--shadow)" }}>
        <Campo label="CNPJ da empresa">
          <div className="flex gap-2">
            <input name="cnpj" value={f.cnpj} onChange={(e) => set("cnpj", e.target.value)} placeholder="00.000.000/0001-00" className={`flex-1 ${inp}`} />
            <button
              type="button"
              onClick={buscarCnpj}
              disabled={buscando}
              className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_-14px_rgba(37,99,235,.9)] transition hover:opacity-95 disabled:opacity-60"
              style={{ background: "linear-gradient(120deg,var(--accent),var(--brand-700,#1d4ed8))" }}
            >
              {buscando ? "Buscando…" : "Buscar CNPJ"}
            </button>
          </div>
        </Campo>
        {aviso && <p className="mt-3 rounded-lg bg-[var(--bg2)] px-3 py-2 text-xs text-[var(--muted)]">{aviso}</p>}
        <p className="mt-2 text-xs text-[var(--muted)]">Digite o CNPJ e clique em Buscar — preenchemos o resto pra você.</p>
      </div>

      {/* Dados da empresa */}
      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5" style={{ boxShadow: "var(--shadow)" }}>
        <h3 className="mb-4 text-[15px] font-bold">Dados da empresa</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Campo label="Razão social"><input name="nome" required value={f.nome} onChange={(e) => set("nome", e.target.value)} className={inp} /></Campo>
          </div>
          <Campo label="Nome fantasia"><input name="nome_fantasia" value={f.nome_fantasia} onChange={(e) => set("nome_fantasia", e.target.value)} className={inp} /></Campo>
          <Campo label="Situação"><input name="situacao" value={f.situacao} onChange={(e) => set("situacao", e.target.value)} placeholder="Ativa" className={inp} /></Campo>
          <Campo label="Porte"><input name="porte" value={f.porte} onChange={(e) => set("porte", e.target.value)} className={inp} /></Campo>
          <Campo label="Abertura"><input name="abertura" type="date" value={f.abertura} onChange={(e) => set("abertura", e.target.value)} className={inp} /></Campo>
          <div className="sm:col-span-2">
            <Campo label="Atividade principal (CNAE)"><input name="cnae" value={f.cnae} onChange={(e) => set("cnae", e.target.value)} className={inp} /></Campo>
          </div>
          <Campo label="Natureza jurídica"><input name="natureza_juridica" value={f.natureza_juridica} onChange={(e) => set("natureza_juridica", e.target.value)} className={inp} /></Campo>
          <Campo label="Capital social (R$)"><input name="capital_social" type="number" value={f.capital_social} onChange={(e) => set("capital_social", e.target.value)} className={inp} /></Campo>
          <div className="sm:col-span-2">
            <Campo label="Endereço"><input name="endereco" value={f.endereco} onChange={(e) => set("endereco", e.target.value)} className={inp} /></Campo>
          </div>
          <Campo label="Telefone"><input name="telefone" value={f.telefone} onChange={(e) => set("telefone", e.target.value)} placeholder="(11) 0000-0000" className={inp} /></Campo>
          <Campo label="E-mail"><input name="email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="contato@empresa.com.br" className={inp} /></Campo>
        </div>

        {state.error && <p className="mt-4 rounded-lg border border-[color-mix(in_srgb,var(--bad)_30%,transparent)] bg-[color-mix(in_srgb,var(--bad)_10%,transparent)] px-3 py-2 text-sm text-[var(--bad)]">{state.error}</p>}
        {state.ok && <p className="mt-4 rounded-lg border border-[color-mix(in_srgb,var(--ok)_30%,transparent)] bg-[color-mix(in_srgb,var(--ok)_10%,transparent)] px-3 py-2 text-sm text-[var(--ok)]">Dados da empresa salvos ✓</p>}

        <button type="submit" disabled={pending} className="mt-5 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_-14px_rgba(37,99,235,.9)] transition hover:opacity-95 disabled:opacity-60" style={{ background: "linear-gradient(120deg,var(--accent),var(--brand-700,#1d4ed8))" }}>
          {pending ? "Salvando…" : "Salvar empresa"}
        </button>
      </div>
    </form>
  );
}
