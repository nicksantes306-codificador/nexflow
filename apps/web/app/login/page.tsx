"use client";

import { useActionState, useState } from "react";
import { login, signup, type AuthState } from "./actions";
import { LogoMark } from "@/components/logo";

const MARKETING = process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://nexflow.com.br";

const BENEFICIOS = [
  "CRM, funil e orçamentos com ART/RRT",
  "Obras, equipes em campo e medições",
  "Financeiro (DRE) e cobrança via PIX",
  "NEXFLOW AI: prioridades e riscos do dia",
];

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const action = mode === "login" ? login : signup;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Painel da marca */}
      <aside
        className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex"
        style={{
          background:
            "radial-gradient(900px 480px at 0% 0%, rgba(59,130,246,.22), transparent 55%), radial-gradient(700px 500px at 100% 100%, rgba(56,189,248,.14), transparent 55%), linear-gradient(160deg, #0e1422, #080c16)",
        }}
      >
        <div className="flex items-center gap-3">
          <LogoMark size={40} />
          <div>
            <b className="block text-[17px] font-extrabold tracking-tight">NEXFLOW</b>
            <span className="block text-[11px] font-semibold tracking-wide text-slate-400">Sistema de gestão</span>
          </div>
        </div>

        <div>
          <h2 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight">
            A gestão completa da sua{" "}
            <span className="bg-gradient-to-r from-[#60a5fa] to-[#38bdf8] bg-clip-text text-transparent">engenharia elétrica</span>.
          </h2>
          <ul className="mt-7 space-y-3">
            {BENEFICIOS.map((b) => (
              <li key={b} className="flex items-center gap-3 text-[14px] text-slate-200">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/10">
                  <svg className="h-3.5 w-3.5 text-[#60a5fa]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-500">© {new Date().getFullYear()} NEXFLOW · Dados isolados por empresa (LGPD)</p>
      </aside>

      {/* Formulário */}
      <div className="flex items-center justify-center bg-[var(--bg)] p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <LogoMark size={48} className="mx-auto" />
            <h1 className="mt-3 text-xl font-extrabold tracking-tight">
              {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {mode === "login" ? "Entre para acessar seu painel" : "Comece com 14 dias grátis"}
            </p>
          </div>

          <form action={formAction} className="space-y-3">
            {mode === "signup" && (
              <Field label="Empresa" name="company" type="text" placeholder="Sua empresa" />
            )}
            <Field label="E-mail" name="email" type="email" placeholder="voce@empresa.com.br" required />
            <Field label="Senha" name="password" type="password" placeholder="••••••••" required />

            {state.error && (
              <p className="rounded-lg bg-[color-mix(in_srgb,var(--bad)_12%,transparent)] px-3 py-2 text-sm text-[var(--bad)]">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl py-3 font-bold text-white shadow-[0_14px_30px_-14px_rgba(37,99,235,.9)] transition hover:opacity-95 disabled:opacity-60"
              style={{ background: "linear-gradient(120deg,var(--accent),var(--brand-700,#1d4ed8))" }}
            >
              {pending ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="mt-4 w-full text-center text-sm text-[var(--muted)] transition hover:text-[var(--accent)]"
          >
            {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tenho conta — entrar"}
          </button>

          <p className="mt-6 text-center text-xs text-[var(--muted)]">
            Ao continuar você concorda com os{" "}
            <a href={`${MARKETING}/termos`} className="underline hover:text-[var(--text)]">Termos</a>{" "}
            e a{" "}
            <a href={`${MARKETING}/privacidade`} className="underline hover:text-[var(--text)]">Política de Privacidade</a>.
          </p>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[var(--muted)]">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
      />
    </label>
  );
}
