import type { BackgroundCheckRequest, CheckResponse, PageCheckDecision, PageCheckRequest } from "./types";
import { showFailOpenToast, showSafeToast, showChecking, showVerdictModal } from "./overlay";

window.addEventListener("message", (event: MessageEvent) => {
  if (event.source !== window) return;
  const data = event.data as PageCheckRequest | undefined;
  if (!data || data.source !== "sigvoraa-inject" || data.type !== "check-transaction") return;

  handleCheckRequest(data);
});

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
