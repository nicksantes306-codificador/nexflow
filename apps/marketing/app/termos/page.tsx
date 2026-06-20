import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso — NEXFLOW",
  description: "Termos e condições de uso da plataforma NEXFLOW.",
};

export default function Termos() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/" className="text-sm text-brand-400 hover:underline">
        ← Voltar
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold">Termos de Uso</h1>
      <p className="mt-1 text-sm text-slate-400">Última atualização: junho de 2026.</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-200">
        <section>
          <h2 className="text-lg font-bold text-white">1. Objeto</h2>
          <p>
            O NEXFLOW concede uma licença de uso, não exclusiva e intransferível,
            da plataforma SaaS de CRM e gestão, conforme o plano contratado.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-white">2. Planos e pagamento</h2>
          <p>
            A assinatura é mensal (Starter, Professional ou Enterprise), cobrada
            via PIX, cartão ou boleto. O não pagamento leva à suspensão suave
            (somente leitura) após 7 dias de tolerância e, depois, ao bloqueio.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-white">3. Cancelamento</h2>
          <p>
            Sem fidelidade. Você pode cancelar a qualquer momento; o acesso
            permanece até o fim do ciclo pago. A exportação de dados fica
            disponível por 30 dias após o cancelamento.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-white">4. Responsabilidades</h2>
          <p>
            Você é responsável pela veracidade dos dados inseridos e pelo uso das
            credenciais. O NEXFLOW empenha-se em manter o serviço disponível, com
            SLA de 99,5% no plano Enterprise.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-white">5. Privacidade</h2>
          <p>
            O tratamento de dados segue a{" "}
            <Link href="/privacidade" className="text-brand-400">
              Política de Privacidade
            </Link>{" "}
            e a LGPD.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-white">6. Foro</h2>
          <p>
            Estes termos são regidos pela legislação brasileira.
          </p>
        </section>
      </div>
    </main>
  );
}
