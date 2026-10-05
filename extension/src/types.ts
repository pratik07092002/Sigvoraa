export type Verdict = "safe" | "caution" | "danger";

export interface ShieldFinding {
  rule: string;
  severity: number;
  explanation: string;
}

export interface ShieldCheckResult {
  verdict: Verdict;
  risk_score: number;
  summary: string;
  would_fail: boolean;
  findings: ShieldFinding[];
}

export interface CheckOutcome {
  ok: true;
  result: ShieldCheckResult;
}

export interface CheckFailure {
  ok: false;
  error: string;
}

export type CheckResponse = CheckOutcome | CheckFailure;

// page (MAIN world) -> content script (ISOLATED world), via window.postMessage
export interface PageCheckRequest {
  source: "sentinelmesh-inject";
  type: "check-transaction";
  requestId: string;
  transactionBase64: string;
  method: "signTransaction" | "signAllTransactions" | "signAndSendTransaction";
}

export interface PageCheckDecision {
  source: "sentinelmesh-content";
  type: "check-decision";
  requestId: string;
  proceed: boolean;
}

// content script -> background service worker, via chrome.runtime.sendMessage
export interface BackgroundCheckRequest {
  type: "check-transaction";
  transactionBase64: string;
}

export interface Settings {
  enabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
};

// Not user-configurable — see extension/README.md if you need to point this
// at a local backend during development.
export const API_BASE_URL = "https://dcuoy748wkqfz.cloudfront.net";
