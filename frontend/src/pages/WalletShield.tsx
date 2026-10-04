import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { VersionedTransaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ShieldCheck, Skull, CheckCircle, Send, Loader2, Wallet } from "lucide-react";
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
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Wallet Shield</h1>
          <p className="text-sm text-slate-400">Simulate before you sign.</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-surface-card p-6">
        <h2 className="mb-1 text-sm font-semibold text-slate-200">Check a transaction</h2>
        <p className="mb-4 text-sm text-slate-500">
          Paste a base64-encoded unsigned transaction, or load one of the seeded devnet demos below.
        </p>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Base64 unsigned transaction..."
          rows={4}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => mutation.mutate(input)}
            disabled={!input.trim() || mutation.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mutation.isPending ? "Checking..." : "Check transaction"}
          </button>
          <button
            onClick={() => setInput(DEMO_DANGER_TX)}
            className="flex items-center gap-1.5 rounded-lg border border-status-critical/30 bg-status-critical/10 px-3 py-2 text-sm font-medium text-status-critical transition-colors hover:bg-status-critical/20"
          >
            <Skull className="h-3.5 w-3.5" />
            Load danger demo
          </button>
          <button
            onClick={() => setInput(DEMO_SAFE_TX)}
            className="flex items-center gap-1.5 rounded-lg border border-status-good/30 bg-status-good/10 px-3 py-2 text-sm font-medium text-status-good transition-colors hover:bg-status-good/20"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Load safe demo
          </button>
        </div>

        {mutation.isError && (
          <p className="mt-3 text-sm text-status-critical">{(mutation.error as Error).message}</p>
        )}
      </div>

      {result && (
        <>
          <TxSimulationCard result={result} />

          <div className="rounded-xl border border-white/10 bg-surface-card p-6">
            {!publicKey ? (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Wallet className="h-4 w-4" />
                Connect your wallet to sign and send this transaction.
              </p>
            ) : !canSign ? (
              <p className="text-sm text-slate-500">
                This transaction's fee payer doesn't match your connected wallet, so it can't be signed here.
              </p>
            ) : (
              <button
                onClick={handleSignAndSend}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15"
              >
                <Send className="h-3.5 w-3.5" />
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
