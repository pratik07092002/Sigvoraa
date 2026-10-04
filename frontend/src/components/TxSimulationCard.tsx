import { AlertOctagon } from "lucide-react";
import type { ShieldCheckResult } from "../lib/api";
import { RiskBadge, severityColor, severityDotColor } from "./RiskBadge";

const VERDICT_BAR: Record<string, string> = {
  safe: "bg-status-good",
  caution: "bg-status-warning",
  danger: "bg-status-critical",
};

export function TxSimulationCard({ result }: { result: ShieldCheckResult }) {
  return (
    <div className="rounded-xl border border-white/10 bg-surface-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <RiskBadge verdict={result.verdict} size="lg" />
        <div className="text-right">
          <p className="font-mono-tabular text-2xl font-bold text-white">{result.risk_score}<span className="text-sm text-slate-500">/100</span></p>
          <p className="text-xs text-slate-500">risk score</p>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all ${VERDICT_BAR[result.verdict]}`}
          style={{ width: `${result.risk_score}%` }}
        />
      </div>

      {result.would_fail && (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-status-warning/30 bg-status-warning/10 px-3 py-2 text-sm text-status-warning">
          <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0" />
          This transaction would fail if signed and sent.
        </p>
      )}

      <p className="mt-4 text-sm leading-relaxed text-slate-300">{result.summary}</p>

      {result.findings.length > 0 && (
        <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Findings</h3>
          <ul className="space-y-3">
            {result.findings.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${severityDotColor(f.severity)}`} />
                <div>
                  <span className={`font-mono-tabular font-bold ${severityColor(f.severity)}`}>{f.severity}</span>{" "}
                  <span className="font-medium text-slate-200">{f.rule}</span>
                  <p className="text-slate-400">{f.explanation}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
