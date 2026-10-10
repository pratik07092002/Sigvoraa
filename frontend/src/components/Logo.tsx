export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return <img src="/logo-mark.png" alt="" className={`${className} object-contain`} />;
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="text-lg font-bold tracking-tight text-white">Sigvoraa</span>
    </span>
  );
}
