"use client";

import { usePathname } from "next/navigation";

// Re-monta o conteúdo a cada navegação (key = rota) para reproduzir a
// animação de entrada — transição suave entre páginas.
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="nx-route">
      {children}
    </div>
  );
}
