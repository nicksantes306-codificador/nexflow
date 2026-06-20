import Link from "next/link";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.nexflow.com.br";

const PLANOS = [
  {
    nome: "Starter",
    preco: "R$ 149",
    resumo: "2 usuários · 50 orçamentos/mês",
    features: ["CRM + Clientes", "Financeiro (DRE)", "Suporte por e-mail"],
    destaque: false,
  },
  {
    nome: "Professional",
    preco: "R$ 449",
    resumo: "8 usuários · ilimitado",
    features: ["Tudo do Starter", "IA + automações", "Obras, Agenda, Engenharia"],
    destaque: true,
  },
  {
    nome: "Enterprise",
    preco: "R$ 1.499",
    resumo: "Usuários ilimitados",
    features: ["SSO/SAML + white-label", "SLA 99,5%", "Onboarding dedicado"],
    destaque: false,
  },
];

const FAQ = [
  {
    q: "Funciona para a minha empresa de instalações elétricas?",
    a: "Sim. O NEXFLOW foi desenhado para engenharia elétrica e automação industrial: orçamento de painéis, gestão de obras, ART/RRT, medições e RDO.",
  },
  {
    q: "Como funciona o pagamento?",
    a: "Assinatura mensal via PIX recorrente, cartão ou boleto (Iugu). Sem fidelidade — cancele quando quiser.",
  },
  {
    q: "Meus dados estão seguros e em conformidade com a LGPD?",
    a: "Cada empresa tem seus dados isolados (multi-tenant com RLS no Supabase). Política de Privacidade e Termos disponíveis; DPO em dpo@nexflow.com.br.",
  },
  {
    q: "Consigo migrar meus dados atuais?",
    a: "Sim, há importação de planilhas (CSV/Excel) e do app antigo no onboarding.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-5">
      {/* Nav */}
      <nav className="flex items-center justify-between py-5">
        <span className="flex items-center gap-2 font-extrabold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-mono text-sm text-white">
            N
          </span>
          NEXFLOW
        </span>
        <a
          href={APP_URL}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5"
        >
          Entrar
        </a>
      </nav>

      {/* Hero */}
      <section className="py-16 text-center md:py-24">
        <span className="inline-block rounded-full border border-brand-600/40 bg-brand-600/10 px-3 py-1 text-xs font-semibold text-brand-400">
          Feito para engenharia elétrica e automação industrial
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
          O CRM + ERP das empresas de{" "}
          <span className="text-brand-500">engenharia elétrica</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
          Centralize vendas, orçamentos, obras e financeiro num só lugar. Do
          primeiro lead à ART, sem planilhas espalhadas.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href={APP_URL}
            className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
          >
            Teste 14 dias grátis
          </a>
          <a
            href="#planos"
            className="rounded-xl border border-white/15 px-6 py-3 font-semibold hover:bg-white/5"
          >
            Ver planos
          </a>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Sem cartão para começar · Suporte em português
        </p>
      </section>

      {/* Prova social (logos de exemplo) */}
      <section className="border-y border-white/10 py-8 text-center">
        <p className="text-xs uppercase tracking-widest text-slate-400">
          Usado por equipes de engenharia que atendem a indústria
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 font-mono text-sm text-slate-500">
          <span>SUBESTAÇÕES</span>
          <span>PAINÉIS CCM</span>
          <span>SPDA</span>
          <span>NR-10 / NR-12</span>
          <span>RETROFIT</span>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-16">
        <h2 className="text-center text-3xl font-extrabold">Planos simples</h2>
        <p className="mt-2 text-center text-slate-300">
          Comece pequeno e cresça. Cancele quando quiser.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {PLANOS.map((p) => (
            <div
              key={p.nome}
              className={`relative rounded-2xl border p-6 ${
                p.destaque
                  ? "border-brand-600 bg-white/[0.04]"
                  : "border-white/10"
              }`}
            >
              {p.destaque && (
                <span className="absolute -top-3 left-6 rounded-full bg-brand-600 px-3 py-0.5 text-[10px] font-bold">
                  MAIS POPULAR
                </span>
              )}
              <h3 className="text-xl font-extrabold">{p.nome}</h3>
              <p className="mt-1 text-xs text-slate-400">{p.resumo}</p>
              <p className="mt-4 text-3xl font-extrabold text-brand-500">
                {p.preco}
                <span className="text-base font-medium text-slate-400">/mês</span>
              </p>
              <ul className="mt-5 space-y-2 text-sm text-slate-200">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-brand-500">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={APP_URL}
                className={`mt-6 block rounded-lg py-2.5 text-center text-sm font-semibold transition ${
                  p.destaque
                    ? "bg-brand-600 text-white hover:bg-brand-700"
                    : "border border-white/15 hover:bg-white/5"
                }`}
              >
                Começar
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <h2 className="text-center text-3xl font-extrabold">Perguntas frequentes</h2>
        <div className="mx-auto mt-8 max-w-2xl space-y-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
            >
              <summary className="cursor-pointer font-semibold">{f.q}</summary>
              <p className="mt-2 text-sm text-slate-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="rounded-2xl border border-brand-600/30 bg-brand-600/10 p-10 text-center">
        <h2 className="text-3xl font-extrabold">Pronto para organizar a operação?</h2>
        <p className="mt-2 text-slate-300">
          Comece hoje. Migre seus dados em minutos.
        </p>
        <a
          href={APP_URL}
          className="mt-6 inline-block rounded-xl bg-brand-600 px-7 py-3 font-semibold text-white transition hover:bg-brand-700"
        >
          Teste 14 dias grátis
        </a>
      </section>

      {/* Footer */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 py-8 text-xs text-slate-400">
        <span>© {new Date().getFullYear()} NEXFLOW</span>
        <div className="flex gap-4">
          <Link href="/privacidade" className="hover:text-white">
            Política de Privacidade
          </Link>
          <Link href="/termos" className="hover:text-white">
            Termos de Uso
          </Link>
          <a href="mailto:dpo@nexflow.com.br" className="hover:text-white">
            dpo@nexflow.com.br
          </a>
        </div>
      </footer>
    </main>
  );
}
