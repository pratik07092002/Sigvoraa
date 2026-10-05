import type { PageCheckDecision, PageCheckRequest } from "./types";

type SolanaTx = { version?: number; serialize: (opts?: Record<string, unknown>) => Uint8Array };

interface SolanaProvider {
  signTransaction?: (tx: SolanaTx) => Promise<SolanaTx>;
  signAllTransactions?: (txs: SolanaTx[]) => Promise<SolanaTx[]>;
  signAndSendTransaction?: (tx: SolanaTx, opts?: unknown) => Promise<unknown>;
  __sentinelmeshWrapped?: boolean;
}

const WRAPPED = Symbol("sentinelmesh-wrapped");

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function serializeTx(tx: SolanaTx): string {
  const bytes =
    tx.version !== undefined
      ? tx.serialize()
      : tx.serialize({ requireAllSignatures: false, verifySignatures: false });
  return toBase64(bytes);
}

function requestDecision(transactionBase64: string, method: PageCheckRequest["method"]): Promise<boolean> {
  const requestId = `sm-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve(true); // fail open if the content script never responds
    }, 15000);

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;
      const data = event.data as PageCheckDecision | undefined;
      if (!data || data.source !== "sentinelmesh-content" || data.type !== "check-decision") return;
      if (data.requestId !== requestId) return;
      clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      resolve(data.proceed);
    }
    window.addEventListener("message", onMessage);

    const req: PageCheckRequest = {
      source: "sentinelmesh-inject",
      type: "check-transaction",
      requestId,
      transactionBase64,
      method,
    };
    window.postMessage(req, "*");
  });
}

function wrapProvider(provider: SolanaProvider | undefined | null): void {
  if (!provider || (provider as Record<symbol, boolean>)[WRAPPED]) return;
  (provider as Record<symbol, boolean>)[WRAPPED] = true;

  const originalSign = provider.signTransaction?.bind(provider);
  if (originalSign) {
    provider.signTransaction = async (tx: SolanaTx) => {
      const proceed = await requestDecision(serializeTx(tx), "signTransaction");
      if (!proceed) throw new Error("Rejected by SentinelMesh Wallet Shield");
      return originalSign(tx);
    };
  }

  const originalSignAll = provider.signAllTransactions?.bind(provider);
  if (originalSignAll) {
    provider.signAllTransactions = async (txs: SolanaTx[]) => {
      for (const tx of txs) {
        const proceed = await requestDecision(serializeTx(tx), "signAllTransactions");
        if (!proceed) throw new Error("Rejected by SentinelMesh Wallet Shield");
      }
      return originalSignAll(txs);
    };
  }

  const originalSignAndSend = provider.signAndSendTransaction?.bind(provider);
  if (originalSignAndSend) {
    provider.signAndSendTransaction = async (tx: SolanaTx, opts?: unknown) => {
      const proceed = await requestDecision(serializeTx(tx), "signAndSendTransaction");
      if (!proceed) throw new Error("Rejected by SentinelMesh Wallet Shield");
      return originalSignAndSend(tx, opts);
    };
  }
}

function trapProperty(target: object, key: string, onSet: (value: unknown) => void): void {
  let current = (target as Record<string, unknown>)[key];
  if (current !== undefined) onSet(current);

  try {
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: true,
      get() {
        return current;
      },
      set(value) {
        current = value;
        onSet(value);
      },
    });
  } catch {
    // property already non-configurable (e.g. another extension got there first) —
    // the polling fallback below still catches it.
  }
}

trapProperty(window, "solana", (value) => wrapProvider(value as SolanaProvider));
trapProperty(window, "phantom", (value) => {
  const phantom = value as { solana?: SolanaProvider } | undefined;
  if (!phantom) return;
  if (phantom.solana) wrapProvider(phantom.solana);
  trapProperty(phantom, "solana", (solanaValue) => wrapProvider(solanaValue as SolanaProvider));
});

// Belt-and-suspenders: in case defineProperty couldn't attach (a provider was already
// a non-configurable property before this script ran), poll briefly for it too.
let attempts = 0;
const poll = setInterval(() => {
  attempts += 1;
  wrapProvider((window as unknown as { solana?: SolanaProvider }).solana);
  wrapProvider((window as unknown as { phantom?: { solana?: SolanaProvider } }).phantom?.solana);
  if (attempts > 20) clearInterval(poll); // ~10s at 500ms
}, 500);
