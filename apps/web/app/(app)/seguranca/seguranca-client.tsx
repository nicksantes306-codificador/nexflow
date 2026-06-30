"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/toaster";

type Login = { alvo: string | null; created_at: string };

function quando(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function SegurancaClient({ logins }: { logins: Login[] }) {
  const supabase = createClient();
  const [carregando, setCarregando] = useState(true);
  const [ativo, setAtivo] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function recarregar() {
    setCarregando(true);
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = data?.totp?.[0];
      setAtivo(!!totp);
      setFactorId(totp?.id ?? null);
    } catch {}
    setCarregando(false);
  }
  useEffect(() => {
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function iniciarAtivacao() {
    setErro(null);
    setBusy(true);
    try {
      const { data: lf } = await supabase.auth.mfa.listFactors();
      for (const f of lf?.all ?? []) {
        if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "NEXFLOW " + Date.now() });
      if (error || !data) {
        setErro(error?.message ?? "Não foi possível iniciar a ativação.");
        return;
      }
      setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch {
      setErro("Erro ao iniciar a ativação.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmarAtivacao(e: React.FormEvent) {
    e.preventDefault();
    if (!enroll) return;
    const c = code.replace(/\D/g, "");
    if (c.length < 6) return;
    setBusy(true);
    setErro(null);
    try {
      const { data: ch, error: e1 } = await supabase.auth.mfa.challenge({ factorId: enroll.id });
      if (e1 || !ch) {
        setErro("Falha ao validar. Tente de novo.");
        return;
      }
      const { error: e2 } = await supabase.auth.mfa.verify({ factorId: enroll.id, challengeId: ch.id, code: c });
      if (e2) {
        setErro("Código incorreto. Confira no app autenticador.");
        return;
      }
      toast("Verificação em duas etapas ativada");
      setEnroll(null);
      setCode("");
      await recarregar();
    } catch {
      setErro("Erro ao confirmar.");
    } finally {
      setBusy(false);
    }
  }

  async function desativar() {
    if (!factorId) return;
    if (!window.confirm("Desativar a verificação em duas etapas? Sua conta ficará menos protegida.")) return;
    setBusy(true);
    try {
      await supabase.auth.mfa.unenroll({ factorId });
      toast("2FA desativado");
      setEnroll(null);
      await recarregar();
    } catch {
      toast("Não foi possível desativar", "erro");
    } finally {
      setBusy(false);
    }
  }

  const card = "rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5";

  return (
    <div className="space-y-5">
      {/* 2FA */}
      <section className={card} style={{ boxShadow: "var(--shadow)" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold">Verificação em duas etapas (2FA)</h3>
            <p className="mt-1 text-[13px] text-[var(--muted)]">Um código do seu celular além da senha. Mesmo que descubram sua senha, não entram sem o código.</p>
          </div>
          {!carregando && (
            <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold" style={ativo ? { color: "var(--ok)", background: "color-mix(in srgb, var(--ok) 14%, transparent)" } : { color: "var(--muted)", background: "var(--bg2)" }}>
              {ativo ? "Ativo" : "Desativado"}
            </span>
          )}
        </div>

        {carregando ? (
          <p className="mt-4 text-sm text-[var(--muted)]">Carregando…</p>
        ) : enroll ? (
          <form onSubmit={confirmarAtivacao} className="mt-4">
            <p className="mb-3 text-[13px] text-[var(--muted)]">1) Abra o app autenticador (Google Authenticator, Authy) e escaneie o QR. 2) Digite o código de 6 dígitos.</p>
            <div className="flex flex-col items-start gap-4 sm:flex-row">
              <div className="grid h-40 w-40 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-white p-2">
                {enroll.qr.trim().startsWith("<svg") ? (
                  <div className="h-full w-full [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: enroll.qr }} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={enroll.qr} alt="QR Code para 2FA" className="h-full w-full" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-[var(--muted)]">Não consegue escanear? Digite esta chave no app:</p>
                <code className="mt-1 block break-all rounded-lg bg-[var(--bg2)] px-2.5 py-2 font-mono text-[12px]">{enroll.secret}</code>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-center text-xl font-bold tracking-[0.3em] outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
            {erro && <p className="mt-2 text-sm text-[var(--bad)]">{erro}</p>}
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={busy || code.length < 6} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50">
                {busy ? "Confirmando…" : "Confirmar e ativar"}
              </button>
              <button type="button" onClick={() => { setEnroll(null); setCode(""); setErro(null); }} className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--bg2)]">Cancelar</button>
            </div>
          </form>
        ) : ativo ? (
          <div className="mt-4 flex items-center gap-2">
            <button onClick={desativar} disabled={busy} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--bad)] transition hover:bg-[color-mix(in_srgb,var(--bad)_10%,transparent)] disabled:opacity-50">Desativar 2FA</button>
          </div>
        ) : (
          <div className="mt-4">
            {erro && <p className="mb-2 text-sm text-[var(--bad)]">{erro}</p>}
            <button onClick={iniciarAtivacao} disabled={busy} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50">
              {busy ? "Preparando…" : "Ativar 2FA"}
            </button>
          </div>
        )}
      </section>

      {/* Histórico de login */}
      <section className={card} style={{ boxShadow: "var(--shadow)" }}>
        <h3 className="mb-3 text-[15px] font-bold">Acessos recentes</h3>
        {logins.length === 0 ? (
          <p className="text-[13px] text-[var(--muted)]">Os últimos acessos da equipe aparecem aqui.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {logins.map((l, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                <span className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted)]" style={{ width: 15, height: 15 }}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
                  <span className="font-medium">{l.alvo ?? "Acesso"}</span>
                </span>
                <span className="text-[var(--muted)]">{quando(l.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
