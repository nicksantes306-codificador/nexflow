import Link from "next/link";
import type { Client } from "@/lib/types";
import { DeleteButton } from "@/components/delete-button";
import { EditRecord } from "@/components/edit-record";
import type { Field } from "@/components/quick-create";
import { editarCliente } from "./actions";

const CAMPOS_CLIENTE: Field[] = [
  { name: "nome", label: "Nome / Razão social", required: true },
  { name: "cnpj", label: "CNPJ" },
  { name: "segmento", label: "Segmento" },
  { name: "contato", label: "Pessoa de contato" },
  { name: "telefone", label: "Telefone" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "endereco", label: "Endereço" },
];

const C = {
  phone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" /></svg>,
  mail: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>,
  doc: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
};

export function iniciais(nome: string): string {
  const ps = nome.trim().split(/\s+/).filter(Boolean);
  if (ps.length === 0) return "??";
  if (ps.length === 1) return ps[0].slice(0, 2).toUpperCase();
  return (ps[0][0] + ps[ps.length - 1][0]).toUpperCase();
}

function Linha({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-[13px]">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--bg2)] text-[var(--muted)] [&_svg]:h-[15px] [&_svg]:w-[15px]">
        {icon}
      </span>
      <span className="truncate text-[var(--text)]">{children}</span>
    </div>
  );
}

export function ClientCard({ c }: { c: Client }) {
  const semDados = !c.contato && !c.telefone && !c.email && !c.cnpj;
  return (
    <div
      className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 transition hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))]"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--accent)_22%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[15px] font-extrabold text-[var(--accent)]">
          {iniciais(c.nome)}
        </span>
        <div className="min-w-0 flex-1">
          <Link href={`/clientes/${c.id}`} className="block truncate font-bold leading-tight transition hover:text-[var(--accent)]" title="Abrir ficha completa">{c.nome}</Link>
          {c.segmento && (
            <span className="mt-1.5 inline-block rounded-full bg-[var(--bg2)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
              {c.segmento}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <EditRecord
            action={editarCliente}
            titulo="Editar cliente"
            fields={CAMPOS_CLIENTE}
            initial={{ id: c.id, nome: c.nome, cnpj: c.cnpj ?? "", segmento: c.segmento ?? "", contato: c.contato ?? "", telefone: c.telefone ?? "", email: c.email ?? "", endereco: c.endereco ?? "" }}
          />
          <DeleteButton tabela="clients" id={c.id} path="/clientes" nome={c.nome} />
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-4">
        {c.contato && <Linha icon={C.user}>{c.contato}</Linha>}
        {c.telefone && <Linha icon={C.phone}>{c.telefone}</Linha>}
        {c.email && <Linha icon={C.mail}>{c.email}</Linha>}
        {c.cnpj && <Linha icon={C.doc}>{c.cnpj}</Linha>}
        {semDados && <p className="text-[12px] text-[var(--muted)]">Sem dados de contato cadastrados.</p>}
      </div>
    </div>
  );
}
