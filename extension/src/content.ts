import type {
  BackgroundCheckRequest,
  CheckResponse,
  PageCheckDecision,
  PageCheckRequest,
  PageWalletConnectRequest,
  PageWalletConnectResponse,
  RequestWalletConnect,
  WalletConnectResult,
} from "./types";
import { showFailOpenToast, showSafeToast, showChecking, showVerdictModal } from "./overlay";

window.addEventListener("message", (event: MessageEvent) => {
  if (event.source !== window) return;
  const data = event.data as PageCheckRequest | undefined;
  if (!data || data.source !== "sigvoraa-inject" || data.type !== "check-transaction") return;

  handleCheckRequest(data);
});

chrome.runtime.onMessage.addListener((message: RequestWalletConnect, _sender, sendResponse) => {
  if (message.type !== "request-wallet-connect") return undefined;
  requestWalletConnect().then(sendResponse);
  return true; // keep the message channel open for the async sendResponse
});

function requestWalletConnect(): Promise<WalletConnectResult> {
  const requestId = `sm-wc-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve({ ok: false, error: "Timed out waiting for the wallet" });
    }, 60000);

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;
      const data = event.data as PageWalletConnectResponse | undefined;
      if (!data || data.source !== "sigvoraa-inject" || data.type !== "wallet-connect-result") return;
      if (data.requestId !== requestId) return;
      clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      resolve({ ok: data.ok, publicKey: data.publicKey, error: data.error });
    }
    window.addEventListener("message", onMessage);

    const req: PageWalletConnectRequest = {
      source: "sigvoraa-content",
      type: "wallet-connect",
      requestId,
    };
    window.postMessage(req, "*");
  });
}

async function handleCheckRequest(req: PageCheckRequest): Promise<void> {
  const bgRequest: BackgroundCheckRequest = {
    type: "check-transaction",
    transactionBase64: req.transactionBase64,
  };

  const dismissChecking = showChecking();

  let response: CheckResponse;
  try {
    response = await chrome.runtime.sendMessage(bgRequest);
  } catch {
    response = { ok: false, error: "extension background unreachable" };
  }
  dismissChecking();

  let proceed: boolean;
  if (!response.ok) {
    showFailOpenToast(response.error);
    proceed = true;
  } else if (response.result.verdict === "safe") {
    showSafeToast(response.result.risk_score);
    proceed = true;
  } else {
    proceed = await showVerdictModal(response.result);
  }

  const decision: PageCheckDecision = {
    source: "sigvoraa-content",
    type: "check-decision",
    requestId: req.requestId,
    proceed,
  };
  window.postMessage(decision, "*");
}
