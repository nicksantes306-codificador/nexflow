// Marca NEXFLOW — símbolo "Flow-N": traço contínuo que forma o N e termina
// num nó luminoso. Navy corporativo com acento azul→ciano (mesma paleta do app).

export function LogoMark({
  size = 40,
  className,
  glow = true,
}: {
  size?: number;
  className?: string;
  glow?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="NEXFLOW"
      className={className}
      style={glow ? { filter: "drop-shadow(0 8px 18px rgba(37,99,235,.32))" } : undefined}
    >
      <defs>
        <linearGradient id="nf-tile" x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#141E31" />
          <stop offset="1" stopColor="#0A0F1C" />
        </linearGradient>
        <linearGradient id="nf-stroke" x1="30" y1="68" x2="66" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="0.55" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>
        <radialGradient id="nf-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#38BDF8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#38BDF8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nf-node" cx="0.42" cy="0.38" r="0.7">
          <stop offset="0" stopColor="#BAEEFF" />
          <stop offset="0.5" stopColor="#5CD4FB" />
          <stop offset="1" stopColor="#38BDF8" />
        </radialGradient>
      </defs>
      <rect x="1.5" y="1.5" width="93" height="93" rx="23" fill="url(#nf-tile)" />
      <rect x="1.5" y="1.5" width="93" height="93" rx="23" fill="none" stroke="#94A3B8" strokeOpacity="0.14" />
      <rect x="2.5" y="2.5" width="91" height="45" rx="22" fill="#FFFFFF" fillOpacity="0.025" />
      <circle cx="66" cy="28" r="26" fill="url(#nf-glow)" />
      <path d="M30 69 V27 L66 69 V27" fill="none" stroke="url(#nf-stroke)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="66" cy="27" r="7.6" fill="url(#nf-node)" />
      <circle cx="66" cy="27" r="7.6" fill="none" stroke="#E0F6FF" strokeOpacity="0.5" />
    </svg>
  );
}

// Versão monocromática (herda currentColor) — para contextos de uma cor só.
export function LogoGlyph({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" className={className} aria-hidden="true">
      <path d="M30 69 V27 L66 69 V27" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="66" cy="27" r="7.6" fill="currentColor" />
    </svg>
  );
}
