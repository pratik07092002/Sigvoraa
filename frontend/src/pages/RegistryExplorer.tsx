import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import { Database, Loader2, ExternalLink, Inbox } from "lucide-react";
import { fetchThreatEntries } from "../lib/registry";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-status-critical/15 text-status-critical",
  disputed: "bg-status-warning/15 text-status-warning",
  cleared: "bg-white/10 text-slate-400",
};

export function RegistryExplorer() {
  const { connection } = useConnection();
  const entries = useQuery({
    queryKey: ["registry-entries"],
    queryFn: () => fetchThreatEntries(connection),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
          <Database className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Registry Explorer</h1>
          <p className="text-sm text-slate-400">
            Every entry is a PDA on the Threat Registry Anchor program, read directly from the chain.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-surface-card p-6">
        {entries.isLoading && (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading on-chain entries...
          </p>
        )}
        {entries.isError && <p className="text-sm text-status-critical">{(entries.error as Error).message}</p>}
        {entries.data && entries.data.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Inbox className="h-8 w-8 text-slate-600" />
            <p className="text-sm text-slate-500">No threats have been reported to the registry yet.</p>
          </div>
        )}

        {entries.data && entries.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Target</th>
                  <th className="pb-3 pr-4 font-medium">Category</th>
                  <th className="pb-3 pr-4 font-medium">Severity</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {entries.data.map((entry) => (
                  <tr key={entry.pubkey}>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-300">{entry.target}</td>
                    <td className="py-3 pr-4 text-slate-300">{entry.category}</td>
                    <td className="py-3 pr-4 font-mono-tabular text-slate-300">{entry.severity}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[entry.status] ?? "bg-white/10 text-slate-400"}`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <a
                        href={entry.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-brand-300 hover:text-brand-200 hover:underline"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
