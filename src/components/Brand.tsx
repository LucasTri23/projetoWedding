export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="17" fill="#284e45" />
      <path d="M32 43C13 43 12 25 14 18C32 18 34 30 32 43Z" fill="#bbcfab" />
      <path d="M32 35C32 16 46 13 51 13C52 31 42 37 32 35Z" fill="#e0d9b4" />
      <path
        d="M32 49V32M32 42L22 29M32 34L43 23"
        stroke="#f4f6ed"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`cultiva-brand ${compact ? "compact" : ""}`}
      role="img"
      aria-label="Cultiva — crescer, juntos."
    >
      <BrandMark />
      <span className="cultiva-wordmark">
        cultiva{!compact && <small>crescer, juntos.</small>}
      </span>
    </span>
  );
}
