import type { ShieldCheckResult } from "../lib/api";
import { RiskBadge, severityColor } from "./RiskBadge";

export function TxSimulationCard({ result }: { result: ShieldCheckResult }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <RiskBadge verdict={result.verdict} size="lg" />
        <span className="text-sm text-slate-400">Risk score: {result.risk_score}/100</span>
      </div>

      {result.would_fail && (
        <p className="mt-3 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
          This transaction would fail if signed and sent.
        </p>
      )}

      <p className="mt-3 text-sm leading-relaxed text-slate-300">{result.summary}</p>

      {result.findings.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-slate-800 pt-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Findings</h3>
          <ul className="space-y-2">
            {result.findings.map((f, i) => (
              <li key={i} className="text-sm">
                <span className={`font-semibold ${severityColor(f.severity)}`}>{f.severity}</span>{" "}
                <span className="font-medium text-slate-200">{f.rule}</span>
                <p className="text-slate-400">{f.explanation}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
