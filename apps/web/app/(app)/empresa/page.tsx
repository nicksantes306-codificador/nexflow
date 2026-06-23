import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@nexflow/db";
import { PageHeader } from "@/components/ui";
import { CompanyForm } from "./company-form";

export const dynamic = "force-dynamic";

export default async function EmpresaPage() {
  const supabase = await createClient();
  const { data: tenantId } = await supabase.rpc("current_tenant_id");
  const { data } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId ?? "")
    .maybeSingle();
  const tenant = data as Tables<"tenants"> | null;

  return (
    <div className="p-5 md:p-7">
      <PageHeader
        title="Minha empresa"
        subtitle="Dados que aparecem nas propostas, PDFs e na NF-e. Preencha o CNPJ para auto-completar via BrasilAPI."
        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4M9 6h.01M15 6h.01M9 10h.01M15 10h.01M9 14h.01M15 14h.01" /></svg>}
      />
      <CompanyForm
        nomeInicial={tenant?.name ?? ""}
        cnpjInicial={tenant?.cnpj ?? ""}
      />
    </div>
  );
}
