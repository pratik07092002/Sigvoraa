import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-8">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-sm font-medium text-slate-300">Look up an address</h2>
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
            className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:border-purple-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Search
          </button>
        </form>
      </div>

      {profile.isLoading && <p className="text-sm text-slate-500">Looking up...</p>}
      {profile.isError && <p className="text-sm text-red-400">{(profile.error as Error).message}</p>}

      {profile.data && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <p className="break-all font-mono text-sm text-slate-200">{profile.data.address}</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <p className={`mt-1 font-medium ${profile.data.flagged ? "text-red-400" : "text-emerald-400"}`}>
                {profile.data.flagged ? "Flagged" : "Clean"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Risk score</p>
              <p className="mt-1 font-medium text-slate-200">{profile.data.risk_score}/100</p>
            </div>
            {profile.data.category && (
              <div>
                <p className="text-xs text-slate-500">Category</p>
                <p className="mt-1 font-medium text-slate-200">{profile.data.category}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
