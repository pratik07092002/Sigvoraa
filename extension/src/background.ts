import type { BackgroundCheckRequest, CheckResponse, Settings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(DEFAULT_SETTINGS);
  return stored as Settings;
}

async function checkTransaction(transactionBase64: string): Promise<CheckResponse> {
  const settings = await getSettings();
  if (!settings.enabled) {
    return { ok: false, error: "protection disabled" };
  }

  try {
    const res = await fetch(`${settings.apiBaseUrl}/api/shield/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction: transactionBase64 }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      return { ok: false, error: body.error ?? `HTTP ${res.status}` };
    }
    const result = await res.json();
    return { ok: true, result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "network error" };
  }
}

chrome.runtime.onMessage.addListener((message: BackgroundCheckRequest, _sender, sendResponse) => {
  if (message.type !== "check-transaction") return undefined;
  checkTransaction(message.transactionBase64).then(sendResponse);
  return true; // keep the message channel open for the async sendResponse
});

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(DEFAULT_SETTINGS);
  await chrome.storage.local.set(stored);
});
