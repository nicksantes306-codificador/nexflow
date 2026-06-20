"use client";

import { useEffect, useState } from "react";

const KEY = "nexflow-cookie-consent";
const PRIVACY =
  (process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://nexflow.com.br") +
  "/privacidade";

// Banner de consentimento de cookies (LGPD) para o app autenticado.
export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  function aceitar() {
    try {
      localStorage.setItem(KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 text-sm shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex-1 text-[var(--muted)]">
          Usamos cookies essenciais para autenticação e funcionamento. Veja a{" "}
          <a href={PRIVACY} className="text-brand-600 underline">
            Política de Privacidade
          </a>
          .
        </p>
        <button
          onClick={aceitar}
          className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
