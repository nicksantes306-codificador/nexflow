import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade — NEXFLOW",
  description: "Como o NEXFLOW coleta, usa e protege seus dados, em conformidade com a LGPD.",
};

export default function Privacidade() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/" className="text-sm text-brand-400 hover:underline">
        ← Voltar
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold">Política de Privacidade</h1>
      <p className="mt-1 text-sm text-slate-400">
        Última atualização: junho de 2026 · em conformidade com a LGPD (Lei
        13.709/2018).
      </p>

      <div className="prose-invert mt-8 space-y-6 text-sm leading-relaxed text-slate-200">
        <section>
          <h2 className="text-lg font-bold text-white">1. Quem somos</h2>
          <p>
            O NEXFLOW é uma plataforma SaaS de CRM e gestão para empresas de
            engenharia elétrica. O controlador dos dados é a empresa operadora do
            NEXFLOW. Encarregado (DPO):{" "}
            <a href="mailto:dpo@nexflow.com.br" className="text-brand-400">
              dpo@nexflow.com.br
            </a>
            .
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-white">2. Dados que coletamos</h2>
          <ul className="list-disc pl-5">
            <li>Cadastro: nome, e-mail, empresa e CNPJ.</li>
            <li>Dados de uso da plataforma (leads, clientes, orçamentos, obras).</li>
            <li>Dados técnicos: logs de acesso e cookies essenciais.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-bold text-white">3. Como usamos</h2>
          <p>
            Para operar o serviço, autenticar usuários, processar cobranças,
            emitir notas fiscais e enviar comunicações transacionais. Não vendemos
            seus dados.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-white">4. Compartilhamento</h2>
          <p>
            Apenas com operadores necessários ao serviço: Supabase (banco/auth),
            Iugu (pagamentos), NFe.io (notas), Resend (e-mail), Vercel
            (hospedagem). Cada um sob contrato e finalidade específica.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-white">5. Isolamento (multi-tenant)</h2>
          <p>
            Os dados de cada empresa são isolados por <em>Row Level Security</em>:
            uma empresa nunca acessa os dados de outra.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-white">6. Seus direitos (LGPD)</h2>
          <p>
            Você pode acessar, corrigir, exportar ou excluir seus dados, e revogar
            consentimento, escrevendo para{" "}
            <a href="mailto:dpo@nexflow.com.br" className="text-brand-400">
              dpo@nexflow.com.br
            </a>
            . Responderemos em até 15 dias.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-white">7. Retenção e segurança</h2>
          <p>
            Mantemos os dados enquanto a conta estiver ativa. Backups diários
            criptografados; acesso restrito; segredos fora do navegador.
          </p>
        </section>
      </div>
    </main>
  );
}
