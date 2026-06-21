import Link from "next/link";
import { LogoMark } from "@/components/logo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.nexflow.com.br";

const FEATURES = [
  {
    nome: "CRM & Funil comercial",
    desc: "Pipeline visual com arrastar-e-soltar, score automático de leads e próximas ações sugeridas.",
    icon: <path d="M12 3a9 9 0 1 0 9 9M12 3v9l6-3" />,
  },
  {
    nome: "Orçamentos & ART",
    desc: "Propostas em PDF com templates, assinatura digital e controle de ART/RRT (CREA/CFT).",
    icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 15l2 2 4-4" /></>,
  },
  {
    nome: "Obras & Equipes",
    desc: "Cronograma, medições físico-financeiras, RDO e acompanhamento das equipes em campo.",
    icon: <><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-1H2z" /><path d="M10 9V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4" /><path d="M4 16v-3a6 6 0 0 1 6-6" /><path d="M14 7a6 6 0 0 1 6 6v3" /></>,
  },
  {
    nome: "Financeiro (DRE)",
    desc: "Contas a pagar e receber, fluxo de caixa e cobrança via PIX recorrente, cartão ou boleto.",
    icon: <><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" /></>,
  },
  {
    nome: "NEXFLOW AI",
    desc: "Assistente que resume negociações, sugere prioridades, detecta riscos e gera insights.",
    icon: <><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.4L12 17l-1.9-5.6L4.5 10l5.6-1.4z" /><path d="M19 4v3M20.5 5.5h-3" /></>,
  },
  {
    nome: "Multi-tenant & LGPD",
    desc: "Dados de cada empresa isolados (RLS), em conformidade com a LGPD. Você no controle.",
    icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>,
  },
];

const PLANOS = [
  { nome: "Starter", preco: "R$ 149", resumo: "2 usuários · 50 orçamentos/mês", features: ["CRM + Clientes 360°", "Financeiro (DRE)", "Suporte por e-mail"], destaque: false },
  { nome: "Professional", preco: "R$ 449", resumo: "8 usuários · ilimitado", features: ["Tudo do Starter", "NEXFLOW AI + automações", "Obras, Agenda e Engenharia"], destaque: true },
  { nome: "Enterprise", preco: "R$ 1.499", resumo: "Usuários ilimitados", features: ["SSO/SAML + white-label", "SLA 99,5%", "Onboarding dedicado"], destaque: false },
];

const FAQ = [
  { q: "Funciona para a minha empresa de instalações elétricas?", a: "Sim. O NEXFLOW foi desenhado para engenharia elétrica e automação industrial: orçamento de painéis, gestão de obras, ART/RRT, medições e RDO." },
  { q: "Como funciona o pagamento?", a: "Assinatura mensal via PIX recorrente, cartão ou boleto (Iugu). Sem fidelidade — cancele quando quiser." },
  { q: "Meus dados estão seguros e em conformidade com a LGPD?", a: "Cada empresa tem seus dados isolados (multi-tenant com RLS no Supabase). Política de Privacidade e Termos disponíveis; DPO em dpo@nexflow.com.br." },
  { q: "Consigo migrar meus dados atuais?", a: "Sim, há importação de planilhas (CSV/Excel) e do app antigo no onboarding." },
];

function Check() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="relative">
      {/* Nav flutuante */}
      <header className="sticky top-0 z-50 px-4 pt-4">
        <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-white/10 bg-[rgba(14,20,34,.6)] px-4 py-2.5 backdrop-blur-xl">
          <span className="flex items-center gap-2.5 font-extrabold tracking-tight">
            <LogoMark size={34} />
            NEXFLOW
          </span>
          <div className="flex items-center gap-2">
            <a href="#planos" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:text-white sm:block">
              Planos
            </a>
            <a href={APP_URL} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:text-white">
              Entrar
            </a>
            <a href={APP_URL} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-[0_10px_26px_-12px_rgba(37,99,235,.9)] transition hover:bg-brand-700">
              Teste grátis
            </a>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5">
        {/* Hero */}
        <section className="pt-16 text-center md:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-600/40 bg-brand-600/10 px-3.5 py-1.5 text-xs font-bold text-brand-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Feito para engenharia elétrica e automação industrial
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-[40px] font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            O CRM + ERP das empresas de{" "}
            <span className="bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">engenharia elétrica</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Centralize vendas, orçamentos, obras e financeiro num só lugar. Do primeiro lead à ART, sem planilhas espalhadas.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a href={APP_URL} className="rounded-xl bg-brand-600 px-6 py-3 font-bold text-white shadow-[0_16px_36px_-16px_rgba(37,99,235,1)] transition hover:bg-brand-700">
              Teste 14 dias grátis
            </a>
            <a href="#planos" className="rounded-xl border border-white/15 px-6 py-3 font-semibold transition hover:bg-white/5">
              Ver planos
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-400">Sem cartão para começar · Suporte em português</p>

          {/* Preview do produto */}
          <div className="relative mx-auto mt-14 max-w-4xl">
            <div className="absolute inset-x-10 -top-6 h-24 rounded-full bg-brand-500/20 blur-3xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[rgba(14,20,34,.7)] p-2.5 shadow-[0_40px_80px_-30px_rgba(0,0,0,.9)] backdrop-blur-xl">
              <div className="flex items-center gap-2 px-2 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="ml-2 text-[11px] font-semibold text-slate-400">app.nexflow.com.br · Console Executivo</span>
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />AO VIVO
                </span>
              </div>
              <div className="grid gap-2.5 rounded-xl bg-[#080c16] p-3 sm:grid-cols-3">
                {[
                  { l: "Receita acumulada", v: "R$ 4,82 mi", d: "+18,4%" },
                  { l: "Pipeline ativo", v: "R$ 2,10 mi", d: "+6,2%" },
                  { l: "Taxa de conversão", v: "32%", d: "+4 p.p." },
                ].map((k) => (
                  <div key={k.l} className="rounded-lg border border-white/10 bg-[rgba(17,26,43,.6)] p-3 text-left">
                    <p className="text-[11px] font-semibold text-slate-400">{k.l}</p>
                    <p className="mt-1 text-xl font-extrabold tracking-tight">{k.v}</p>
                    <span className="text-[11px] font-bold text-emerald-400">↗ {k.d}</span>
                  </div>
                ))}
                <div className="rounded-lg border border-white/10 bg-[rgba(17,26,43,.6)] p-3 sm:col-span-3">
                  <svg viewBox="0 0 600 120" preserveAspectRatio="none" className="h-24 w-full" role="img" aria-label="Gráfico de receita">
                    <defs>
                      <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#3B82F6" stopOpacity="0.45" />
                        <stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,96 C80,90 120,70 200,64 C280,58 320,40 400,34 C480,28 520,18 600,10 L600,120 L0,120 Z" fill="url(#lg)" />
                    <path d="M0,96 C80,90 120,70 200,64 C280,58 320,40 400,34 C480,28 520,18 600,10" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Prova social */}
        <section className="mt-20 border-y border-white/10 py-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Para equipes de engenharia que atendem a indústria
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-bold tracking-wide text-slate-500">
            <span>SUBESTAÇÕES</span><span>PAINÉIS CCM</span><span>SPDA</span><span>NR-10 / NR-12</span><span>RETROFIT</span>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Tudo que sua operação precisa</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-300">Do comercial ao campo, num sistema só — pensado para o setor elétrico.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.nome} className="group rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition hover:border-brand-600/40 hover:bg-white/[0.04]">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-brand-600/25 bg-brand-600/10 text-brand-400">
                  <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>
                </span>
                <h3 className="mt-4 text-[17px] font-bold">{f.nome}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="planos" className="py-12 scroll-mt-24">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Planos simples</h2>
            <p className="mt-3 text-slate-300">Comece pequeno e cresça. Cancele quando quiser.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {PLANOS.map((p) => (
              <div key={p.nome} className={`relative rounded-2xl border p-6 ${p.destaque ? "border-2 border-brand-600 bg-white/[0.05]" : "border-white/10 bg-white/[0.02]"}`}>
                {p.destaque && (
                  <span className="absolute -top-3 left-6 rounded-full bg-brand-600 px-3 py-0.5 text-[10px] font-bold text-white">MAIS POPULAR</span>
                )}
                <h3 className="text-xl font-extrabold">{p.nome}</h3>
                <p className="mt-1 text-xs text-slate-400">{p.resumo}</p>
                <p className="mt-5 text-4xl font-extrabold tracking-tight">
                  {p.preco}<span className="text-base font-semibold text-slate-400">/mês</span>
                </p>
                <ul className="mt-6 space-y-2.5 text-sm text-slate-200">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2"><Check />{f}</li>
                  ))}
                </ul>
                <a href={APP_URL} className={`mt-7 block rounded-xl py-3 text-center text-sm font-bold transition ${p.destaque ? "bg-brand-600 text-white shadow-[0_14px_30px_-14px_rgba(37,99,235,1)] hover:bg-brand-700" : "border border-white/15 hover:bg-white/5"}`}>
                  Começar agora
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20">
          <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">Perguntas frequentes</h2>
          <div className="mx-auto mt-10 max-w-2xl space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-xl border border-white/10 bg-white/[0.02] p-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between font-semibold">
                  {f.q}
                  <svg className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="relative overflow-hidden rounded-3xl border border-brand-600/30 bg-gradient-to-b from-brand-600/15 to-transparent p-10 text-center md:p-14">
          <div className="absolute left-1/2 top-0 h-32 w-2/3 -translate-x-1/2 rounded-full bg-brand-500/25 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <LogoMark size={48} className="mx-auto" />
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight md:text-4xl">Pronto para organizar a operação?</h2>
            <p className="mt-3 text-slate-300">Comece hoje. Migre seus dados em minutos.</p>
            <a href={APP_URL} className="mt-7 inline-block rounded-xl bg-brand-600 px-7 py-3.5 font-bold text-white shadow-[0_16px_36px_-16px_rgba(37,99,235,1)] transition hover:bg-brand-700">
              Teste 14 dias grátis
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-8 text-xs text-slate-400">
          <span className="flex items-center gap-2 font-bold text-slate-300">
            <LogoMark size={22} /> NEXFLOW · © {new Date().getFullYear()}
          </span>
          <div className="flex flex-wrap gap-5">
            <Link href="/privacidade" className="transition hover:text-white">Política de Privacidade</Link>
            <Link href="/termos" className="transition hover:text-white">Termos de Uso</Link>
            <a href="mailto:dpo@nexflow.com.br" className="transition hover:text-white">dpo@nexflow.com.br</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
