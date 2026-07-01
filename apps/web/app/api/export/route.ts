import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Tabela = "clients" | "finance_entries" | "projects" | "budgets" | "products";

// Tipos de exportação permitidos + colunas e cabeçalhos amigáveis (pt-BR).
const EXPORTS: Record<string, { table: Tabela; cols: string[]; head: string[]; order?: string }> = {
  clientes: {
    table: "clients",
    cols: ["nome", "cnpj", "segmento", "contato", "telefone", "email", "endereco"],
    head: ["Nome", "CNPJ", "Segmento", "Contato", "Telefone", "E-mail", "Endereço"],
    order: "nome",
  },
  financeiro: {
    table: "finance_entries",
    cols: ["data", "tipo", "descricao", "categoria", "status", "valor"],
    head: ["Data", "Tipo", "Descrição", "Categoria", "Status", "Valor"],
    order: "data",
  },
  obras: {
    table: "projects",
    cols: ["nome", "status", "responsavel", "inicio", "fim", "progresso", "valor", "custo_real"],
    head: ["Obra", "Status", "Responsável", "Início", "Término", "Progresso (%)", "Valor", "Custo real"],
  },
  orcamentos: {
    table: "budgets",
    cols: ["numero", "titulo", "status", "validade", "valor_total"],
    head: ["Nº", "Título", "Status", "Validade", "Valor"],
  },
  estoque: {
    table: "products",
    cols: ["nome", "sku", "categoria", "unidade", "quantidade", "minimo", "custo", "preco"],
    head: ["Produto", "Código", "Categoria", "Unidade", "Quantidade", "Mínimo", "Custo", "Preço"],
    order: "nome",
  },
};

function csv(v: unknown): string {
  if (v == null) return "";
  let s = String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // evita injeção de fórmula no Excel
  if (/[";\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export async function GET(req: NextRequest) {
  const tipo = req.nextUrl.searchParams.get("tipo") ?? "";
  const cfg = EXPORTS[tipo];
  if (!cfg) return new NextResponse("Tipo de exportação inválido.", { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase.from(cfg.table).select("*");
  if (error) return new NextResponse(error.message, { status: 500 });

  const rows = (data ?? []) as Record<string, unknown>[];
  const ord = cfg.order;
  if (ord) rows.sort((a, b) => String(a[ord] ?? "").localeCompare(String(b[ord] ?? "")));
  const linhas = rows.map((r) => cfg.cols.map((c) => csv(r[c])).join(";"));
  // BOM (﻿) para o Excel reconhecer UTF-8; CRLF entre linhas.
  const conteudo = "﻿" + [cfg.head.join(";"), ...linhas].join("\r\n");

  const hoje = new Date().toISOString().slice(0, 10);
  return new NextResponse(conteudo, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nexflow-${tipo}-${hoje}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
