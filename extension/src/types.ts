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
  source: "sigvoraa-inject";
  type: "check-transaction";
  requestId: string;
  transactionBase64: string;
  method: "signTransaction" | "signAllTransactions" | "signAndSendTransaction";
}

export interface PageCheckDecision {
  source: "sigvoraa-content";
  type: "check-decision";
  requestId: string;
  proceed: boolean;
}

// content script -> page (MAIN world), via window.postMessage
export interface PageWalletConnectRequest {
  source: "sigvoraa-content";
  type: "wallet-connect";
  requestId: string;
}

// page (MAIN world) -> content script, via window.postMessage
export interface PageWalletConnectResponse {
  source: "sigvoraa-inject";
  type: "wallet-connect-result";
  requestId: string;
  ok: boolean;
  publicKey?: string;
  error?: string;
}

// popup -> content script of the active tab, via chrome.tabs.sendMessage
export interface RequestWalletConnect {
  type: "request-wallet-connect";
}

export interface WalletConnectResult {
  ok: boolean;
  publicKey?: string;
  error?: string;
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
export const API_BASE_URL = "https://api.sigvoraa.com";
