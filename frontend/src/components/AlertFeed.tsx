import type { Alert } from "../lib/api";
import { severityColor } from "./RiskBadge";

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function AlertFeed({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No alerts yet. They'll show up here as the Runtime Monitor watches transactions.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-800">
      {alerts.map((alert) => (
        <li key={alert.id} className="flex items-start justify-between gap-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${severityColor(alert.severity)}`}>{alert.severity}</span>
              <span className="text-sm font-medium text-slate-200">{alert.rule_id}</span>
            </div>
            <p className="mt-0.5 truncate text-sm text-slate-400">{alert.explanation}</p>
            {alert.target_address && (
              <p className="mt-0.5 font-mono text-xs text-slate-600">{alert.target_address}</p>
            )}
          </div>
          <span className="shrink-0 text-xs text-slate-500">{timeAgo(alert.created_at)}</span>
        </li>
      ))}
    </ul>
  );
}
