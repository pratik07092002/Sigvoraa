import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import type { Verdict } from "../lib/api";

const CONFIG: Record<Verdict, { label: string; icon: typeof ShieldCheck; classes: string }> = {
  safe: {
    label: "Safe",
    icon: ShieldCheck,
    classes: "bg-status-good/10 text-status-good border-status-good/30",
  },
  caution: {
    label: "Caution",
    icon: ShieldAlert,
    classes: "bg-status-warning/10 text-status-warning border-status-warning/30",
  },
  danger: {
    label: "Danger",
    icon: ShieldX,
    classes: "bg-status-critical/10 text-status-critical border-status-critical/30",
  },
};

export function RiskBadge({ verdict, size = "md" }: { verdict: Verdict; size?: "sm" | "md" | "lg" }) {
  const { label, icon: Icon, classes } = CONFIG[verdict];
  const sizeClass =
    size === "lg" ? "text-base px-4 py-1.5 gap-2" : size === "sm" ? "text-xs px-2 py-0.5 gap-1" : "text-sm px-3 py-1 gap-1.5";
  const iconSize = size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <span className={`inline-flex items-center rounded-full border font-semibold ${classes} ${sizeClass}`}>
      <Icon className={iconSize} />
      {label}
    </span>
  );
}

export function severityColor(severity: number): string {
  if (severity >= 70) return "text-status-critical";
  if (severity >= 30) return "text-status-warning";
  return "text-status-good";
}

export function severityDotColor(severity: number): string {
  if (severity >= 70) return "bg-status-critical";
  if (severity >= 30) return "bg-status-warning";
  return "bg-status-good";
}
