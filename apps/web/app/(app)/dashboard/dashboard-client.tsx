"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { money } from "@/lib/format";
import type { DashData, RevSerie } from "@/lib/dashboard";

const PERIODOS = [
  { id: "hoje", label: "Hoje" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
  { id: "trimestre", label: "Trimestre" },
  { id: "ano", label: "Ano" },
];

function abrirBusca() {
  window.dispatchEvent(new Event("nexflow-command"));
}

// Painéis secundários que o usuário pode mostrar/ocultar e reordenar.
const PANEIS_INFO = [
  { id: "obras", titulo: "Obras em andamento" },
  { id: "funil", titulo: "Funil de vendas" },
  { id: "equipes", titulo: "Equipes nas obras" },
  { id: "avisos", titulo: "Avisos importantes" },
];
const ORDEM_PADRAO = PANEIS_INFO.map((p) => p.id);
const EyeOn = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>;
const EyeOff = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><path d="M9.9 4.2A9.8 9.8 0 0 1 12 4c6.5 0 10 7 10 7a13 13 0 0 1-2.2 3M6.1 6.1A13 13 0 0 0 2 11s3.5 7 10 7a9.5 9.5 0 0 0 3.9-.8" /><path d="m3 3 18 18M10 10a2.8 2.8 0 0 0 4 4" /></svg>;

/* ---------- formatadores ---------- */
function brCompact(n: number): string {
  if (n >= 1e6)
    return "R$ " + (n / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " mi";
  if (n >= 1e3) return "R$ " + Math.round(n / 1e3).toLocaleString("pt-BR") + " mil";
  return "R$ " + Math.round(n).toLocaleString("pt-BR");
}
function kfmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(".", ",") + "mi";
  if (n >= 1e3) return Math.round(n / 1e3) + "k";
  return String(Math.round(n));
}

/* ---------- count-up ---------- */
function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setD(value);
      return;
    }
    let raf = 0;
    const dur = 1200;
    const s = performance.now();
    const tick = (now: number) => {
      let p = Math.min((now - s) / dur, 1);
      p = 1 - Math.pow(1 - p, 3);
      setD(value * p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{format(d)}</>;
}

/* ---------- gráfico de receita (SVG puro, auto-escala) ---------- */
function RevChart({ serie }: { serie: RevSerie }) {
  const W = 600, x0 = 34, x1 = 590, yT = 14, yB = 186;
  const n = serie.labels.length;
  const all = [...serie.real, ...serie.proj].filter((v): v is number => v != null);
  const vMax = Math.max(1, ...all) * 1.14;
  const xAt = (i: number) => x0 + (i * (x1 - x0)) / (n - 1);
  const yAt = (v: number) => yB - (v / vMax) * (yB - yT);

  const smooth = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return pts.length ? `M ${pts[0].x},${pts[0].y}` : "";
    let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const cx = ((a.x + b.x) / 2).toFixed(1);
      d += ` C ${cx},${a.y.toFixed(1)} ${cx},${b.y.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
    }
    return d;
  };

  const realPts = serie.real
    .map((v, i) => (v == null ? null : { x: xAt(i), y: yAt(v) }))
    .filter((p): p is { x: number; y: number } => p != null);
  const projPts = serie.proj
    .map((v, i) => (v == null ? null : { x: xAt(i), y: yAt(v) }))
    .filter((p): p is { x: number; y: number } => p != null);

  const line = smooth(realPts);
  const area =
    realPts.length >= 1
      ? `${line} L ${realPts[realPts.length - 1].x.toFixed(1)},${yB} L ${realPts[0].x.toFixed(1)},${yB} Z`
      : "";
  const grid = [0, 1 / 3, 2 / 3, 1].map((f) => f * vMax);

  return (
    <svg viewBox={`0 0 ${W} 220`} preserveAspectRatio="none" role="img" aria-label="Receita realizada e projeção mensal">
      {grid.map((v) => (
        <g key={v}>
          <line className="rv-grid" x1={x0} x2={x1} y1={yAt(v)} y2={yAt(v)} />
          <text className="rv-lbl" x={2} y={yAt(v) + 3.5}>{kfmt(v)}</text>
        </g>
      ))}
      {area && <path className="rv-area" d={area} />}
      {line && <path className="rv-line" d={line} pathLength={1} />}
      {projPts.length >= 2 && <path className="rv-proj" d={smooth(projPts)} />}
      {serie.labels.map((m, i) => (
        <text key={m + i} className="rv-lbl" x={xAt(i)} y={208} textAnchor="middle">{m}</text>
      ))}
    </svg>
  );
}

const SPARK = [
  "M0,26 L13,24 L26,25 L39,19 L52,17 L65,13 L78,12 L91,8 L104,4",
  "M0,22 L13,23 L26,18 L39,20 L52,14 L65,16 L78,10 L91,12 L104,7",
  "M0,24 L17,24 L35,20 L52,20 L70,14 L87,14 L104,9",
  "M0,28 L13,25 L26,26 L39,22 L52,23 L65,17 L78,18 L91,12 L104,9",
];
function Spark({ i }: { i: number }) {
  const ln = SPARK[i % SPARK.length];
  return (
    <svg className="spark" viewBox="0 0 104 34" preserveAspectRatio="none">
      <path className="ar" d={`${ln} L104,34 L0,34 Z`} />
      <path className="ln" d={ln} />
    </svg>
  );
}

const ARROW_UP = (<svg viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8" /></svg>);
const ARROW_DN = (<svg viewBox="0 0 24 24"><path d="M7 7 17 17M15 17H7V9" /></svg>);

const ALERT_ICON: Record<string, React.ReactNode> = {
  bad: <svg className="ic" viewBox="0 0 24 24"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>,
  warn: <svg className="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  info: <svg className="ic" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>,
};

const ICON = {
  receita: <svg className="ic" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  mes: <svg className="ic" viewBox="0 0 24 24"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>,
  obra: <svg className="ic" viewBox="0 0 24 24"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-1H2z" /><path d="M10 9V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4" /><path d="M4 16v-3a6 6 0 0 1 6-6" /><path d="M14 7a6 6 0 0 1 6 6v3" /></svg>,
  conv: <svg className="ic" viewBox="0 0 24 24"><path d="M22 12A10 10 0 1 1 12 2" /><path d="M22 4 12 14l-3-3" /></svg>,
};

export function DashboardClient({ data, periodo, nome }: { data: DashData; periodo: string; nome: string }) {
  const router = useRouter();
  const [clock, setClock] = useState("—");
  const [saud, setSaud] = useState("Olá");
  useEffect(() => {
    const h = new Date().getHours();
    setSaud(h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite");
  }, []);
  const primeiroNome = (nome || "").trim().split(/\s+/)[0] ?? "";

  // Personalização do painel (mostrar/ocultar e reordenar) — salva por dispositivo.
  const [cfg, setCfg] = useState<{ ordem: string[]; ocultos: string[] }>({ ordem: ORDEM_PADRAO, ocultos: [] });
  const [editando, setEditando] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nexflow-dash");
      if (!raw) return;
      const p = JSON.parse(raw);
      const ordem = Array.isArray(p.ordem)
        ? [...new Set([...p.ordem.filter((x: string) => ORDEM_PADRAO.includes(x)), ...ORDEM_PADRAO])]
        : ORDEM_PADRAO;
      const ocultos = Array.isArray(p.ocultos) ? p.ocultos.filter((x: string) => ORDEM_PADRAO.includes(x)) : [];
      setCfg({ ordem, ocultos });
    } catch {}
  }, []);
  function salvarCfg(next: { ordem: string[]; ocultos: string[] }) {
    setCfg(next);
    try { localStorage.setItem("nexflow-dash", JSON.stringify(next)); } catch {}
  }
  function togglePainel(id: string) {
    salvarCfg({ ...cfg, ocultos: cfg.ocultos.includes(id) ? cfg.ocultos.filter((x) => x !== id) : [...cfg.ocultos, id] });
  }
  function moverPainel(id: string, dir: -1 | 1) {
    const i = cfg.ordem.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= cfg.ordem.length) return;
    const ordem = [...cfg.ordem];
    [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
    salvarCfg({ ...cfg, ordem });
  }
  useEffect(() => {
    const upd = () => {
      const d = new Date();
      const dd = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
      const tt = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setClock(dd.charAt(0).toUpperCase() + dd.slice(1) + " · " + tt);
    };
    upd();
    const id = setInterval(upd, 1000);
    return () => clearInterval(id);
  }, []);

  const maxFunil = Math.max(...data.funil.map((f) => f.count), 1);
  const mesDelta = data.receitaMesDeltaPct;

  type Kpi = {
    label: string; value: number; format: (n: number) => string;
    icon: React.ReactNode; sub: string; delta?: { v: string; up: boolean };
  };
  const KPIS: Kpi[] = [
    { label: "Faturamento no período", value: data.receitaAcum, format: brCompact, icon: ICON.receita, sub: "recebido no período", delta: data.demo ? { v: "18,4%", up: true } : undefined },
    { label: "Faturamento do mês", value: data.receitaMes, format: brCompact, icon: ICON.mes, sub: "este mês", delta: mesDelta !== 0 ? { v: (mesDelta > 0 ? "+" : "") + mesDelta + "%", up: mesDelta >= 0 } : data.demo ? { v: "6,2%", up: true } : undefined },
    { label: "Obras ativas", value: data.obrasAtivas, format: (n) => String(Math.round(n)), icon: ICON.obra, sub: `${data.obrasCriticas} precisam de atenção`, delta: data.demo ? { v: "+3", up: true } : undefined },
    { label: "Taxa de fechamento", value: data.conversao, format: (n) => Math.round(n) + "%", icon: ICON.conv, sub: "leads que viraram negócio", delta: data.demo ? { v: "+4 p.p.", up: true } : undefined },
  ];

  const PAINEIS: Record<string, React.ReactNode> = {
    obras: (
      <div className="card c-side reveal" style={{ ["--i" as string]: 5 }}>
        <div className="skel"><b style={{ width: "50%" }} /><b style={{ width: "100%" }} /><b style={{ width: "100%" }} /><b style={{ width: "100%" }} /></div>
        <div className="hdr">
          <div><h3>Obras em andamento</h3><div className="mut">{data.obrasAtivas} em andamento · {data.obrasCriticas} precisam de atenção</div></div>
          <Link href="/projetos" className="pill ghost">Ver todas</Link>
        </div>
        <div style={{ marginTop: 6 }}>
          {data.obras.map((o, i) => (
            <div className="obra" key={o.nome + i}>
              <div className="l1"><div><b>{o.nome}</b><small>{o.cli}</small></div><span className="pc">{o.pc}%</span></div>
              <div className={`bar ${o.cls}`}><i style={{ ["--w" as string]: `${o.pc}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    ),
    funil: (
      <div className="card c-pipe reveal" style={{ ["--i" as string]: 6 }}>
        <div className="skel"><b style={{ width: "45%" }} /><b style={{ width: "100%" }} /><b style={{ width: "100%" }} /><b style={{ width: "100%" }} /></div>
        <div className="hdr">
          <div><h3>Funil de vendas</h3><div className="mut">{data.oportunidades} negócios em aberto · {brCompact(data.pipelineValor)} em negociação</div></div>
          <Link href="/crm" className="pill ghost">Abrir CRM</Link>
        </div>
        <div style={{ marginTop: 4, paddingBottom: 8 }}>
          {data.funil.map((f) => (
            <div className="stage" key={f.label}>
              <span className="nm">{f.label}</span>
              <div className="track">
                <i style={{ ["--w" as string]: `${Math.max((f.count / maxFunil) * 100, 6)}%` }} />
                <span className="vv">{f.valor > 0 ? brCompact(f.valor) : money(0)}</span>
              </div>
              <span className="ct">{f.count}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    equipes: (
      <div className="card c-team reveal" style={{ ["--i" as string]: 7 }}>
        <div className="skel"><b style={{ width: "50%" }} /><b style={{ width: "100%" }} /><b style={{ width: "100%" }} /><b style={{ width: "100%" }} /></div>
        <div className="hdr"><div><h3>Equipes nas obras</h3><div className="mut">{data.responsaveis.length} em obras ativas</div></div></div>
        <div style={{ marginTop: 4 }}>
          {data.responsaveis.map((e, i) => (
            <div className="team" key={e.nome + i}>
              <div className="av">{e.av}</div>
              <div className="nm"><b>{e.nome}</b><small>{e.obra}</small></div>
              <span className={`st ${e.st}`}><span className="d" />{e.lbl}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    avisos: (
      <div className="card c-alert reveal" style={{ ["--i" as string]: 8 }}>
        <div className="skel"><b style={{ width: "55%" }} /><b style={{ width: "100%" }} /><b style={{ width: "100%" }} /><b style={{ width: "100%" }} /></div>
        <div className="hdr"><div><h3>Avisos importantes</h3><div className="mut">{data.alertas.length} {data.alertas.length === 1 ? "item precisa" : "itens precisam"} de atenção</div></div></div>
        <div style={{ marginTop: 4 }}>
          {data.alertas.map((a, i) => (
            <div className={`alert ${a.cls}`} key={a.txt + i}>
              <div className="ico">{ALERT_ICON[a.cls]}</div>
              <div className="tx"><b>{a.txt}</b><small>{a.meta}</small></div>
            </div>
          ))}
        </div>
      </div>
    ),
  };

  return (
    <div className="nxdash">
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <linearGradient id="nxspark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.45" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="nxrev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <header className="top">
        <div>
          <h1>Painel<span className="live"><span className="dot" />AO VIVO</span></h1>
          <p className="sub" suppressHydrationWarning>{clock}</p>
        </div>
        <label className="search" onClick={abrirBusca} style={{ cursor: "pointer" }}>
          <svg className="ic" viewBox="0 0 24 24" style={{ width: 17, height: 17 }}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          <input readOnly placeholder="Procurar obras, clientes…" style={{ cursor: "pointer" }} onClick={abrirBusca} />
          <kbd>⌘K</kbd>
        </label>
        <button className="ai-btn" onClick={() => router.push("/ai")}>
          <svg className="ic" viewBox="0 0 24 24"><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.4L12 17l-1.9-5.6L4.5 10l5.6-1.4z" /></svg>
          Perguntar ao assistente
        </button>
      </header>

      <div className="scroll">
        <div className="greet">
          <div>
            <h2 suppressHydrationWarning>{saud}{primeiroNome ? <>, <em>{primeiroNome}</em></> : "!"}</h2>
            <p>
              Veja como está a sua empresa hoje.
              {data.demo && " (dados de exemplo — cadastre seus clientes, obras e contas para ver os reais)"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="seg">
              {PERIODOS.map((p) => (
                <button key={p.id} className={periodo === p.id ? "on" : ""} onClick={() => router.push(`/dashboard?periodo=${p.id}`)}>{p.label}</button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setEditando((v) => !v)}
              title="Mostrar, ocultar e reordenar os blocos do painel"
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-semibold transition ${editando ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>
              Personalizar
            </button>
          </div>
        </div>

        <div className="grid">
          {editando && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4" style={{ gridColumn: "1 / -1", boxShadow: "var(--shadow)" }}>
              <div className="mb-2 flex items-center justify-between">
                <b className="text-sm">Personalizar painel</b>
                <button type="button" onClick={() => salvarCfg({ ordem: ORDEM_PADRAO, ocultos: [] })} className="text-[12px] font-semibold text-[var(--muted)] transition hover:text-[var(--accent)]">Restaurar padrão</button>
              </div>
              {cfg.ordem.map((id, idx) => {
                const info = PANEIS_INFO.find((p) => p.id === id);
                const visivel = !cfg.ocultos.includes(id);
                return (
                  <div key={id} className={`flex items-center gap-2.5 py-2 ${idx ? "border-t border-[var(--border)]" : ""}`}>
                    <button type="button" onClick={() => togglePainel(id)} aria-label={visivel ? "Ocultar bloco" : "Mostrar bloco"} className={`grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] transition hover:bg-[var(--bg2)] ${visivel ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>
                      {visivel ? EyeOn : EyeOff}
                    </button>
                    <span className={`flex-1 text-[13.5px] font-semibold ${visivel ? "" : "text-[var(--muted)] line-through"}`}>{info?.titulo}</span>
                    <button type="button" onClick={() => moverPainel(id, -1)} disabled={idx === 0} aria-label="Mover para cima" className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:bg-[var(--bg2)] disabled:opacity-30">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}><path d="m18 15-6-6-6 6" /></svg>
                    </button>
                    <button type="button" onClick={() => moverPainel(id, 1)} disabled={idx === cfg.ordem.length - 1} aria-label="Mover para baixo" className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:bg-[var(--bg2)] disabled:opacity-30">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}><path d="m6 9 6 6 6-6" /></svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {KPIS.map((k, i) => (
            <div className="card kpi lift reveal" style={{ ["--i" as string]: i }} key={k.label}>
              <div className="skel"><b style={{ width: "55%" }} /><b style={{ width: "80%", height: 26 }} /><b style={{ width: "40%" }} /></div>
              <div className="pad">
                <div className="hd"><span className="ico">{k.icon}</span>{k.label}</div>
                <div className="val"><CountUp value={k.value} format={k.format} /></div>
                <div className="rowd">
                  {k.delta && (
                    <span className={`delta ${k.delta.up ? "up" : "dn"}`}>{k.delta.up ? ARROW_UP : ARROW_DN}{k.delta.v}</span>
                  )}
                  <span className="subt">{k.sub}</span>
                </div>
              </div>
              <Spark i={i} />
            </div>
          ))}

          <div className="card c-main reveal" style={{ ["--i" as string]: 4 }}>
            <div className="skel"><b style={{ width: "40%" }} /><b style={{ width: "90%", height: 150 }} /><b style={{ width: "60%" }} /></div>
            <div className="hdr">
              <div><h3>Faturamento e previsão</h3><div className="mut">Mês a mês, com a tendência dos próximos</div></div>
              <span className="pill">Previsão do ano: {brCompact(data.rev.previsao)}</span>
            </div>
            <div className="legend">
              <span><i style={{ background: "var(--accent)" }} />Realizado</span>
              <span><i style={{ background: "repeating-linear-gradient(90deg,var(--muted) 0 5px,transparent 5px 9px)" }} />Projeção</span>
            </div>
            <div className="chartbox"><RevChart serie={data.rev} /></div>
          </div>

          {cfg.ordem
            .filter((id) => !cfg.ocultos.includes(id))
            .map((id) => (
              <Fragment key={id}>{PAINEIS[id]}</Fragment>
            ))}
        </div>
      </div>
    </div>
  );
}
