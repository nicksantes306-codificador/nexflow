"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "nexflow-cookie-consent";

// Banner de consentimento de cookies (LGPD). Apenas cookies essenciais são
// usados; o banner registra o aceite no localStorage.
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
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-xl border border-white/15 bg-navy-950/95 p-4 text-sm text-slate-200 shadow-xl backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex-1">
          Usamos cookies essenciais para o funcionamento do site. Veja a{" "}
          <Link href="/privacidade" className="text-brand-400 underline">
            Política de Privacidade
          </Link>
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
