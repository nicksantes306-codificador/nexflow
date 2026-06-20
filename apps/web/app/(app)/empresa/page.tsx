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
      />
      <CompanyForm
        nomeInicial={tenant?.name ?? ""}
        cnpjInicial={tenant?.cnpj ?? ""}
      />
    </div>
  );
}
