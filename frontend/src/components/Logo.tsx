export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="sigvoraa-logo-grad" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#35bb93" />
          <stop offset="1" stopColor="#006656" />
        </linearGradient>
      </defs>
      <path
        d="M16 2 L28 7 V15 C28 23 22 28 16 30 C10 28 4 23 4 15 V7 Z"
        fill="url(#sigvoraa-logo-grad)"
      />
      <path
        d="M11 16 L14.5 19.5 L21.5 12"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="text-lg font-bold tracking-tight text-white">Sigvoraa</span>
    </span>
  );
}
