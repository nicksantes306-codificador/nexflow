"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buscarGlobal, type SearchHit } from "./command-search";

const NAV = [
  { label: "Dashboard", href: "/dashboard", kw: "inicio painel home" },
  { label: "CRM · Funil de vendas", href: "/crm", kw: "leads kanban pipeline" },
  { label: "Clientes 360°", href: "/clientes", kw: "" },
  { label: "Orçamentos", href: "/orcamentos", kw: "proposta pdf" },
  { label: "Obras e Serviços", href: "/projetos", kw: "projetos obra" },
  { label: "Financeiro", href: "/financeiro", kw: "dre caixa receita" },
  { label: "Relatórios & BI", href: "/relatorios", kw: "graficos dados" },
  { label: "Tarefas", href: "/tarefas", kw: "" },
  { label: "Agenda", href: "/agenda", kw: "eventos calendario" },
  { label: "Automações", href: "/automacoes", kw: "regras gatilho" },
  { label: "NEXFLOW AI", href: "/ai", kw: "assistente ia chat" },
  { label: "Equipe", href: "/equipe", kw: "membros convidar usuarios" },
  { label: "Histórico de alterações", href: "/historico", kw: "auditoria log mudancas" },
  { label: "Minha empresa", href: "/empresa", kw: "cnpj dados" },
  { label: "Planos & Cobrança", href: "/planos", kw: "assinatura fatura" },
  { label: "Importar dados", href: "/importar", kw: "migrar" },
];

type Item = { label: string; sub?: string; href?: string; tipo?: string; run?: () => void };

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function alternarTema() {
  try {
    const prox = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = prox;
    localStorage.setItem("nexflow-theme", prox);
  } catch {}
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const acaoItens = useMemo<Item[]>(() => {
    const base = [
      { label: "Novo cliente", kw: "adicionar cadastrar", run: () => router.push("/clientes?novo=1") },
      { label: "Nova obra", kw: "projeto servico", run: () => router.push("/projetos?novo=1") },
      { label: "Novo orçamento", kw: "proposta", run: () => router.push("/orcamentos?novo=1") },
      { label: "Novo lançamento", kw: "conta receita despesa", run: () => router.push("/financeiro?novo=1") },
      { label: "Nova tarefa", kw: "", run: () => router.push("/tarefas?novo=1") },
      { label: "Novo evento", kw: "agendar reuniao", run: () => router.push("/agenda?novo=1") },
      { label: "Alternar tema claro/escuro", kw: "tema dark light modo escuro claro", run: alternarTema },
    ];
    const n = norm(q.trim());
    const lista = n ? base.filter((a) => norm(a.label + " " + a.kw).includes(n)) : base;
    return lista.map((a) => ({ label: a.label, tipo: a.label.startsWith("Alternar") ? "Comando" : "Criar", run: a.run }));
  }, [q, router]);

  const navItens = useMemo<Item[]>(() => {
    const n = norm(q.trim());
    if (!n) return NAV.map((x) => ({ label: x.label, href: x.href, tipo: "Ir para" }));
    return NAV.filter((x) => norm(x.label + " " + x.kw).includes(n)).map((x) => ({ label: x.label, href: x.href, tipo: "Ir para" }));
  }, [q]);

  const itens = useMemo<Item[]>(
    () => [...acaoItens, ...navItens, ...hits.map((h) => ({ label: h.label, sub: h.sub, href: h.href, tipo: h.tipo }))],
    [acaoItens, navItens, hits],
  );

  // abre com ⌘K / Ctrl+K (e via evento custom de qualquer botão)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("nexflow-command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("nexflow-command", onOpen);
    };
  }, []);

  // ao abrir: reseta e foca
  useEffect(() => {
    if (open) {
      setQ("");
      setHits([]);
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  // busca de dados (debounce)
  useEffect(() => {
    if (!open) return;
    const termo = q.trim();
    if (termo.length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setHits(await buscarGlobal(termo));
      } catch {
        setHits([]);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q, open]);

  useEffect(() => setActive(0), [itens.length]);

  if (!open) return null;

  const escolher = (it?: Item) => {
    const alvo = it ?? itens[active];
    if (!alvo) return;
    setOpen(false);
    if (alvo.run) alvo.run();
    else if (alvo.href) router.push(alvo.href);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/45 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
        if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, itens.length - 1)); }
        if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
        if (e.key === "Enter") { e.preventDefault(); escolher(); }
      }}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)]"
        style={{ boxShadow: "0 30px 80px -20px rgba(0,0,0,.6)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
          <svg className="h-5 w-5 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar ou navegar…"
            className="flex-1 bg-transparent py-3.5 text-[15px] outline-none placeholder:text-[var(--muted)]"
          />
          <kbd className="rounded-md border border-[var(--border)] px-1.5 py-0.5 text-[11px] text-[var(--muted)]">esc</kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {itens.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-[var(--muted)]">Nada encontrado para “{q}”.</p>
          )}
          {itens.map((it, i) => (
            <button
              key={it.href + it.label + i}
              onMouseEnter={() => setActive(i)}
              onClick={() => escolher(it)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${i === active ? "bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]" : ""}`}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--bg2)] text-[var(--muted)]">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium">{it.label}</span>
                {it.sub && <span className="block truncate text-[12px] text-[var(--muted)]">{it.sub}</span>}
              </span>
              {it.tipo && <span className="shrink-0 rounded-md bg-[var(--bg2)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]">{it.tipo}</span>}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--border)] px-4 py-2 text-[11px] text-[var(--muted)]">
          <span>↑↓ navegar</span><span>↵ abrir</span><span>esc fechar</span>
        </div>
      </div>
    </div>
  );
}
