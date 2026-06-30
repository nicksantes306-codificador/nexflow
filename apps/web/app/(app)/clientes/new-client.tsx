"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { criarCliente, type FormState } from "./actions";
import { toast } from "@/components/toaster";

type BrasilAPICnpj = {
  razao_social?: string;
  cnae_fiscal_descricao?: string;
  ddd_telefone_1?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
};

const inp =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";
const lbl = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]";

export function NewClientForm() {
  const [aberto, setAberto] = useState(false);
  const [cnpj, setCnpj] = useState("");
  const [nome, setNome] = useState("");
  const [segmento, setSegmento] = useState("");
  const [contato, setContato] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(criarCliente, {});
  const router = useRouter();

  // Abre sozinho quando vem do ⌘K (rota com ?novo=1).
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("novo") === "1") {
      setAberto(true);
    }
  }, []);

  useEffect(() => {
    if (state.ok) {
      toast("Cliente cadastrado");
      setCnpj(""); setNome(""); setSegmento(""); setContato(""); setTelefone(""); setEmail(""); setEndereco("");
      setAberto(false);
      router.refresh();
    }
  }, [state.ok, router]);

  async function buscarCnpj() {
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) { setAviso("Digite os 14 dígitos do CNPJ."); return; }
    setBuscando(true); setAviso(null);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) throw new Error("CNPJ não encontrado.");
      const d: BrasilAPICnpj = await res.json();
      setNome(d.razao_social ?? nome);
      setSegmento(d.cnae_fiscal_descricao ?? "");
      setTelefone(d.ddd_telefone_1 ?? "");
      setEndereco([
        [d.logradouro, d.numero].filter(Boolean).join(", "),
        d.bairro,
        [d.municipio, d.uf].filter(Boolean).join("/"),
        d.cep ? `CEP ${d.cep}` : "",
      ].filter(Boolean).join(" — "));
      setAviso(`Encontrado: ${d.razao_social ?? ""}${d.municipio ? ` — ${d.municipio}/${d.uf}` : ""}.`);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Falha ao consultar o CNPJ.");
    } finally {
      setBuscando(false);
    }
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="rounded-xl px-4 py-2 text-sm font-bold text-white shadow-[0_12px_28px_-14px_rgba(37,99,235,.9)] transition hover:opacity-95"
        style={{ background: "linear-gradient(120deg,var(--accent),var(--brand-700,#1d4ed8))" }}
      >
        + Novo cliente
      </button>
    );
  }

  return (
    <form action={action} className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 sm:w-[460px]" style={{ boxShadow: "var(--shadow)" }}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-bold">Novo cliente</h3>
        <button type="button" onClick={() => setAberto(false)} aria-label="Fechar" className="text-[var(--muted)] hover:text-[var(--text)]">✕</button>
      </div>

      <label className={lbl}>CNPJ (preenche o resto)</label>
      <div className="flex gap-2">
        <input name="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" className={`flex-1 ${inp}`} />
        <button type="button" onClick={buscarCnpj} disabled={buscando} className="shrink-0 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold transition hover:bg-[var(--bg2)] disabled:opacity-60">
          {buscando ? "…" : "Buscar"}
        </button>
      </div>
      {aviso && <p className="mt-2 rounded-lg bg-[var(--bg2)] px-3 py-2 text-xs text-[var(--muted)]">{aviso}</p>}

      <div className="mt-3 space-y-3">
        <div><label className={lbl}>Nome / razão social</label><input name="nome" required value={nome} onChange={(e) => setNome(e.target.value)} className={inp} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lbl}>Segmento</label><input name="segmento" value={segmento} onChange={(e) => setSegmento(e.target.value)} className={inp} /></div>
          <div><label className={lbl}>Telefone</label><input name="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} className={inp} /></div>
        </div>
        <div><label className={lbl}>Endereço</label><input name="endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} className={inp} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lbl}>Contato</label><input name="contato" value={contato} onChange={(e) => setContato(e.target.value)} placeholder="Eng. responsável" className={inp} /></div>
          <div><label className={lbl}>E-mail</label><input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inp} /></div>
        </div>
      </div>

      {state.error && <p className="mt-3 text-sm text-[var(--bad)]">{state.error}</p>}

      <button type="submit" disabled={pending} className="mt-4 w-full rounded-xl py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_-14px_rgba(37,99,235,.9)] transition hover:opacity-95 disabled:opacity-60" style={{ background: "linear-gradient(120deg,var(--accent),var(--brand-700,#1d4ed8))" }}>
        {pending ? "Salvando…" : "Cadastrar cliente"}
      </button>
    </form>
  );
}
