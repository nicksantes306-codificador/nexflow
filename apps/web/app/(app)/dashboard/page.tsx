import { createClient } from "@/lib/supabase/server";
import { ESTAGIOS } from "@/lib/constants";
import type { Lead } from "@/lib/types";
import { DashboardClient, type DashData } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  // RLS filtra pelos leads do tenant logado.
  const { data } = await supabase
    .from("leads")
    .select("*")
    .order("valor", { ascending: false });

  const leads = (data ?? []) as Lead[];
  const dash = montar(leads);

  return <DashboardClient data={dash} />;
}

function montar(leads: Lead[]): DashData {
  const emPipeline = leads.filter((l) =>
    ESTAGIOS.includes(l.status as (typeof ESTAGIOS)[number]),
  );
  const ganhos = leads.filter((l) => l.status === "Aprovado");
  const pipelineValor = emPipeline.reduce((a, l) => a + Number(l.valor || 0), 0);
  const receitaGanha = ganhos.reduce((a, l) => a + Number(l.valor || 0), 0);
  const oportunidades = emPipeline.length;
  const conversao =
    leads.length > 0 ? Math.round((ganhos.length / leads.length) * 100) : 0;

  const funil = ESTAGIOS.map((stage) => {
    const itens = leads.filter((l) => l.status === stage);
    return {
      label: stage,
      count: itens.length,
      valor: itens.reduce((a, l) => a + Number(l.valor || 0), 0),
    };
  });

  // Conta sem dados → mostra a demo para a tela não nascer vazia.
  const vazio = leads.length === 0;

  return {
    demo: vazio,
    pipelineValor: vazio ? 2_100_000 : pipelineValor,
    receitaAcum: vazio ? 4_820_000 : receitaGanha + pipelineValor,
    oportunidades: vazio ? 38 : oportunidades,
    conversao: vazio ? 32 : conversao,
    ganhos: vazio ? 27 : ganhos.length,
    funil: vazio
      ? [
          { label: "Novo Lead", count: 42, valor: 3_800_000 },
          { label: "Em contato", count: 28, valor: 2_900_000 },
          { label: "Orçamento enviado", count: 19, valor: 2_300_000 },
          { label: "Negociação", count: 14, valor: 1_900_000 },
          { label: "Proposta", count: 9, valor: 1_400_000 },
        ]
      : funil,
  };
}
