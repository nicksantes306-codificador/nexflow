"use client";

import { useEffect, useState } from "react";

const KEY = "nexflow-theme";

// Alterna light/dark, persiste por usuário e aplica em <html data-theme>.
// O flash inicial é evitado pelo script inline em app/layout.tsx.
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const atual =
      (document.documentElement.dataset.theme as "light" | "dark") ?? "light";
    setTheme(atual);
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-sm text-[var(--muted)] transition hover:bg-[var(--bg2)]"
      title="Alternar tema"
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
