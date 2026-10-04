import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Inbox, Send, ExternalLink, CheckCircle2 } from "lucide-react";
import { reportAlert, type Alert, type ReportResult } from "../lib/api";
import { severityColor, severityDotColor } from "./RiskBadge";
import { useState } from "react";

const MIN_SEVERITY_TO_REPORT = 30;

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ReportButton({ alert }: { alert: Alert }) {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<ReportResult | null>(null);

  const mutation = useMutation({
    mutationFn: () => reportAlert(alert.id),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["registry-entries"] });
    },
  });

  if (alert.status === "reported" || result) {
    const sig = result?.signature;
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-status-good">
        {sig ? (
          <a
            href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:underline"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Reported
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Reported
          </>
        )}
      </span>
    );
  }

  if (!alert.target_address || alert.severity < MIN_SEVERITY_TO_REPORT) return null;

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-white/5 disabled:opacity-50"
    >
      <Send className="h-3 w-3" />
      {mutation.isPending ? "Reporting..." : "Report to Registry"}
    </button>
  );
}

export function AlertFeed({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <Inbox className="h-8 w-8 text-slate-600" />
        <p className="text-sm text-slate-500">
          No alerts yet. They'll show up here as the Runtime Monitor watches transactions.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-white/5">
      {alerts.map((alert) => (
        <li key={alert.id} className="flex items-start justify-between gap-4 py-3.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${severityDotColor(alert.severity)}`} />
              <span className={`font-mono-tabular text-sm font-bold ${severityColor(alert.severity)}`}>
                {alert.severity}
              </span>
              <span className="text-sm font-medium text-slate-200">{alert.rule_id}</span>
            </div>
            <p className="mt-0.5 truncate text-sm text-slate-400">{alert.explanation}</p>
            {alert.target_address && (
              <p className="mt-0.5 font-mono text-xs text-slate-600">{alert.target_address}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="text-xs text-slate-500">{timeAgo(alert.created_at)}</span>
            <ReportButton alert={alert} />
          </div>
        </li>
      ))}
    </ul>
  );
}
