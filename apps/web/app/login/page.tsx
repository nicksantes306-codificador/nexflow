"use client";

import { useActionState, useState } from "react";
import { login, signup, type AuthState } from "./actions";

const MARKETING = process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://nexflow.com.br";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const action = mode === "login" ? login : signup;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {},
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-4">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 font-mono text-lg font-extrabold text-white">
            N
          </div>
          <h1 className="mt-3 text-xl font-extrabold tracking-tight">NEXFLOW</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {mode === "login"
              ? "Entre na sua conta"
              : "Crie sua conta gratuita"}
          </p>
        </div>

        <form action={formAction} className="space-y-3">
          {mode === "signup" && (
            <Field
              label="Empresa"
              name="company"
              type="text"
              placeholder="Sua empresa"
            />
          )}
          <Field
            label="E-mail"
            name="email"
            type="email"
            placeholder="voce@empresa.com.br"
            required
          />
          <Field
            label="Senha"
            name="password"
            type="password"
            placeholder="••••••••"
            required
          />

          {state.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {pending
              ? "Aguarde…"
              : mode === "login"
                ? "Entrar"
                : "Criar conta"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 w-full text-center text-sm text-[var(--muted)] hover:text-brand-600"
        >
          {mode === "login"
            ? "Não tem conta? Cadastre-se"
            : "Já tenho conta — entrar"}
        </button>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          Ao continuar você concorda com os{" "}
          <a href={`${MARKETING}/termos`} className="underline">
            Termos
          </a>{" "}
          e a{" "}
          <a href={`${MARKETING}/privacidade`} className="underline">
            Política de Privacidade
          </a>
          .
        </p>
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
      <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
      />
    </label>
  );
}
