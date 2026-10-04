import type { Verdict } from "../lib/api";

const STYLES: Record<Verdict, string> = {
  safe: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  caution: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  danger: "bg-red-500/15 text-red-400 border-red-500/30",
};

const LABELS: Record<Verdict, string> = {
  safe: "Safe",
  caution: "Caution",
  danger: "Danger",
};

export function RiskBadge({ verdict, size = "md" }: { verdict: Verdict; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "text-base px-4 py-1.5" : size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${STYLES[verdict]} ${sizeClass}`}>
      {LABELS[verdict]}
    </span>
  );
}

export function severityColor(severity: number): string {
  if (severity >= 70) return "text-red-400";
  if (severity >= 30) return "text-amber-400";
  return "text-emerald-400";
}
