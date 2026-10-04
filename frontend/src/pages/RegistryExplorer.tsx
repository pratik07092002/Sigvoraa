import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import { fetchThreatEntries } from "../lib/registry";

const STATUS_COLOR: Record<string, string> = {
  active: "text-red-400",
  disputed: "text-amber-400",
  cleared: "text-slate-500",
};

export function RegistryExplorer() {
  const { connection } = useConnection();
  const entries = useQuery({
    queryKey: ["registry-entries"],
    queryFn: () => fetchThreatEntries(connection),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-1 text-sm font-medium text-slate-300">On-chain Threat Registry</h2>
        <p className="mb-4 text-sm text-slate-500">
          Every entry here is a PDA on the Threat Registry Anchor program, verifiable by anyone.
        </p>

        {entries.isLoading && <p className="text-sm text-slate-500">Loading on-chain entries...</p>}
        {entries.isError && <p className="text-sm text-red-400">{(entries.error as Error).message}</p>}
        {entries.data && entries.data.length === 0 && (
          <p className="text-sm text-slate-500">No threats have been reported to the registry yet.</p>
        )}

        {entries.data && entries.data.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4 font-medium">Target</th>
                <th className="pb-2 pr-4 font-medium">Category</th>
                <th className="pb-2 pr-4 font-medium">Severity</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {entries.data.map((entry) => (
                <tr key={entry.pubkey}>
                  <td className="py-2 pr-4 font-mono text-xs text-slate-300">{entry.target}</td>
                  <td className="py-2 pr-4 text-slate-300">{entry.category}</td>
                  <td className="py-2 pr-4 text-slate-300">{entry.severity}</td>
                  <td className={`py-2 pr-4 font-medium ${STATUS_COLOR[entry.status] ?? "text-slate-400"}`}>
                    {entry.status}
                  </td>
                  <td className="py-2">
                    <a
                      href={entry.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-400 hover:underline"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
