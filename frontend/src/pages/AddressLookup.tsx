import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { fetchAddressProfile } from "../lib/api";

export function AddressLookup() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState<string | null>(null);

  const profile = useQuery({
    queryKey: ["address", query],
    queryFn: () => fetchAddressProfile(query!),
    enabled: query !== null,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
          <Search className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Address Lookup</h1>
          <p className="text-sm text-slate-400">Check an address against the registry before you trust it.</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-surface-card p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(input.trim() || null);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Solana address..."
            className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </form>
      </div>

      {profile.isLoading && (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Looking up...
        </p>
      )}
      {profile.isError && <p className="text-sm text-status-critical">{(profile.error as Error).message}</p>}

      {profile.data && (
        <div className="rounded-xl border border-white/10 bg-surface-card p-6">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                profile.data.flagged ? "bg-status-critical/15 text-status-critical" : "bg-status-good/15 text-status-good"
              }`}
            >
              {profile.data.flagged ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <p className="break-all font-mono text-sm text-slate-300">{profile.data.address}</p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-5 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <p className={`mt-1 font-semibold ${profile.data.flagged ? "text-status-critical" : "text-status-good"}`}>
                {profile.data.flagged ? "Flagged" : "Clean"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Risk score</p>
              <p className="mt-1 font-mono-tabular font-semibold text-white">{profile.data.risk_score}/100</p>
            </div>
            {profile.data.category && (
              <div>
                <p className="text-xs text-slate-500">Category</p>
                <p className="mt-1 font-semibold text-white">{profile.data.category}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
