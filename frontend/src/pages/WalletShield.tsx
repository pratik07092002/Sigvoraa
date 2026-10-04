import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { VersionedTransaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { checkTransaction, type ShieldCheckResult } from "../lib/api";
import { DEMO_DANGER_TX, DEMO_SAFE_TX } from "../lib/demoTransactions";
import { TxSimulationCard } from "../components/TxSimulationCard";

export function WalletShield() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ShieldCheckResult | null>(null);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const mutation = useMutation({
    mutationFn: checkTransaction,
    onSuccess: (data) => {
      setResult(data);
      setSendStatus(null);
    },
  });

  const feePayer = (() => {
    try {
      const tx = VersionedTransaction.deserialize(Buffer.from(input.trim(), "base64"));
      return tx.message.staticAccountKeys[0]?.toBase58() ?? null;
    } catch {
      return null;
    }
  })();
  const canSign = Boolean(publicKey && feePayer && publicKey.toBase58() === feePayer);

  async function handleSignAndSend() {
    if (!publicKey) return;
    setSendStatus("Sending...");
    try {
      const tx = VersionedTransaction.deserialize(Buffer.from(input.trim(), "base64"));
      const signature = await sendTransaction(tx, connection);
      setSendStatus(`Sent: ${signature}`);
    } catch (err) {
      setSendStatus(err instanceof Error ? err.message : "Failed to send");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-1 text-sm font-medium text-slate-300">Check a transaction</h2>
        <p className="mb-4 text-sm text-slate-500">
          Paste a base64-encoded unsigned transaction, or load one of the seeded devnet demos below.
        </p>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Base64 unsigned transaction..."
          rows={4}
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:border-purple-500 focus:outline-none"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => mutation.mutate(input)}
            disabled={!input.trim() || mutation.isPending}
            className="rounded-md bg-purple-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending ? "Checking..." : "Check transaction"}
          </button>
          <button
            onClick={() => setInput(DEMO_DANGER_TX)}
            className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/20"
          >
            Load danger demo
          </button>
          <button
            onClick={() => setInput(DEMO_SAFE_TX)}
            className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-500/20"
          >
            Load safe demo
          </button>
        </div>

        {mutation.isError && (
          <p className="mt-3 text-sm text-red-400">{(mutation.error as Error).message}</p>
        )}
      </div>

      {result && (
        <>
          <TxSimulationCard result={result} />

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            {!publicKey ? (
              <p className="text-sm text-slate-500">Connect your wallet to sign and send this transaction.</p>
            ) : !canSign ? (
              <p className="text-sm text-slate-500">
                This transaction's fee payer doesn't match your connected wallet, so it can't be signed here.
              </p>
            ) : (
              <button
                onClick={handleSignAndSend}
                className="rounded-md bg-slate-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-600"
              >
                Sign & send anyway
              </button>
            )}
            {sendStatus && <p className="mt-2 break-all text-sm text-slate-400">{sendStatus}</p>}
          </div>
        </>
      )}
    </div>
  );
}
