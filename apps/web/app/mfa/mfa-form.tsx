"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/logo";
import { logout } from "@/app/login/actions";

export function MfaForm() {
  const supabase = createClient();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function verificar(e: React.FormEvent) {
    e.preventDefault();
    const c = code.replace(/\D/g, "");
    if (c.length < 6 || pending) return;
    setPending(true);
    setErro(null);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.[0];
      if (!totp) {
        router.push("/dashboard");
        return;
      }
      const { data: ch, error: e1 } = await supabase.auth.mfa.challenge({ factorId: totp.id });
      if (e1 || !ch) {
        setErro("Não foi possível iniciar a verificação. Tente de novo.");
        return;
      }
      const { error: e2 } = await supabase.auth.mfa.verify({ factorId: totp.id, challengeId: ch.id, code: c });
      if (e2) {
        setErro("Código incorreto. Confira no seu app autenticador.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErro("Erro ao verificar. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--bg)] p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-7 text-center" style={{ boxShadow: "var(--shadow)" }}>
        <LogoMark size={44} className="mx-auto" />
        <h1 className="mt-4 text-xl font-extrabold tracking-tight">Verificação em duas etapas</h1>
        <p className="mt-1.5 text-[13px] text-[var(--muted)]">Digite o código de 6 dígitos do seu app autenticador (Google Authenticator, Authy…).</p>

        <form onSubmit={verificar} className="mt-5">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="000000"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] outline-none focus:border-[var(--accent)]"
          />
          {erro && <p className="mt-2 text-sm text-[var(--bad)]">{erro}</p>}
          <button
            type="submit"
            disabled={pending || code.length < 6}
            className="mt-4 w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Verificando…" : "Entrar"}
          </button>
        </form>

        <form action={logout} className="mt-4">
          <button className="text-[12.5px] font-medium text-[var(--muted)] transition hover:text-[var(--text)]">Sair e usar outra conta</button>
        </form>
      </div>
    </div>
  );
}
