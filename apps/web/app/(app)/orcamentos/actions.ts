"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { auditar } from "@/lib/audit";
import { dispararAutomacao } from "@/lib/automations/engine";

export type FormState = { error?: string; ok?: boolean };

export async function criarOrcamento(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return { error: "Informe o título do orçamento." };

  const supabase = await createClient();
  const { data: tenant } = await supabase.rpc("current_tenant_id");
  if (!tenant) return { error: "Nenhum tenant ativo para este usuário." };

  // Numeração sequencial simples por tenant: ORC-0001…
  const { count } = await supabase
    .from("budgets")
    .select("*", { count: "exact", head: true });
  const numero = `ORC-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const valor = Number(formData.get("valor_total") ?? 0);
  const clientId = String(formData.get("client_id") ?? "").trim();

  const { error } = await supabase.from("budgets").insert({
    tenant_id: tenant,
    numero,
    titulo,
    client_id: clientId === "" ? null : clientId,
    valor_total: Number.isFinite(valor) ? valor : 0,
    status: "rascunho",
    validade: emptyToNull(formData.get("validade")),
  });

  if (error) return { error: error.message };
  await auditar({ acao: "Criou", entidade: "Orçamento", alvo: titulo });
  await dispararAutomacao(supabase, tenant, "budget_created", null, { cliente: titulo, valor });
  revalidatePath("/orcamentos");
  return { ok: true };
}

const ORC_STATUS = ["rascunho", "enviado", "aprovado", "recusado"] as const;

export async function editarOrcamento(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Orçamento inválido." };
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return { error: "Informe o título do orçamento." };

  const supabase = await createClient();
  const valor = Number(formData.get("valor_total") ?? 0);
  const clientId = String(formData.get("client_id") ?? "").trim();
  const status = String(formData.get("status") ?? "rascunho");

  // Estado anterior — o gatilho "aprovado" só dispara na TRANSIÇÃO para
  // aprovado (re-salvar um orçamento já aprovado não dispara de novo).
  const { data: antes } = await supabase.from("budgets").select("status").eq("id", id).maybeSingle();

  const { error } = await supabase
    .from("budgets")
    .update({
      titulo,
      client_id: clientId === "" ? null : clientId,
      valor_total: Number.isFinite(valor) ? valor : 0,
      status: ((ORC_STATUS as readonly string[]).includes(status) ? status : "rascunho") as (typeof ORC_STATUS)[number],
      validade: emptyToNull(formData.get("validade")),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  await auditar({ acao: "Editou", entidade: "Orçamento", alvo: titulo });
  if (status === "aprovado" && antes?.status !== "aprovado") {
    const { data: tenant } = await supabase.rpc("current_tenant_id");
    if (tenant) await dispararAutomacao(supabase, tenant, "budget_approved", null, { cliente: titulo, valor }, id);
  }
  revalidatePath("/orcamentos");
  return { ok: true };
}

// "Tudo conversando": de um orçamento aprovado, cria a obra e o lançamento
// financeiro (entrada prevista) automaticamente, e marca o orçamento como aprovado.
export async function gerarObraDoOrcamento(
  formData: FormData,
): Promise<{ ok?: boolean; error?: string; projectId?: string }> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Orçamento inválido." };

  const supabase = await createClient();
  const { data: tenant } = await supabase.rpc("current_tenant_id");
  if (!tenant) return { error: "Nenhuma equipe ativa." };

  const { data: orc } = await supabase.from("budgets").select("*").eq("id", id).maybeSingle();
  if (!orc) return { error: "Orçamento não encontrado." };
  if (orc.status === "aprovado") return { error: "Este orçamento já foi aprovado — a obra já deve existir." };

  const valor = Number(orc.valor_total) || 0;

  const { data: proj, error: e1 } = await supabase
    .from("projects")
    .insert({
      tenant_id: tenant,
      nome: orc.titulo,
      client_id: orc.client_id ?? null,
      status: "Em andamento",
      valor,
      custo_real: 0,
      progresso: 0,
    })
    .select("id")
    .single();
  if (e1 || !proj) return { error: e1?.message ?? "Não foi possível criar a obra." };

  await supabase.from("finance_entries").insert({
    tenant_id: tenant,
    tipo: "Entrada",
    descricao: `Contrato: ${orc.titulo}`,
    valor,
    status: "Pendente",
    data: new Date().toISOString().slice(0, 10),
    categoria: "Contrato",
  });

  await supabase.from("budgets").update({ status: "aprovado" }).eq("id", id);
  await auditar({ acao: "Criou", entidade: "Obra", alvo: orc.titulo, detalhe: "Gerada do orçamento" });
  // Dispara os 3 eventos reais do handoff (aprovação + obra + financeiro).
  // dedupKey = id do orçamento: mesma chave do editarOrcamento, então a
  // aprovação nunca executa a mesma regra duas vezes pelos dois caminhos.
  await dispararAutomacao(supabase, tenant, "budget_approved", null, { cliente: orc.titulo, valor }, id);
  await dispararAutomacao(supabase, tenant, "project_created", null, { cliente: orc.titulo, valor }, proj.id);
  await dispararAutomacao(supabase, tenant, "finance_created", null, { cliente: `Contrato: ${orc.titulo}`, valor, status: "Entrada" });

  revalidatePath("/orcamentos");
  revalidatePath("/projetos");
  revalidatePath("/financeiro");
  return { ok: true, projectId: proj.id };
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}
