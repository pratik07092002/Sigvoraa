import type { RequestWalletConnect, Settings, WalletConnectResult } from "./types";
import { DEFAULT_SETTINGS } from "./types";

const enabledEl = document.getElementById("enabled") as HTMLInputElement;
const statusDot = document.getElementById("statusDot") as HTMLElement;
const statusLabel = document.getElementById("statusLabel") as HTMLElement;
const statusSub = document.getElementById("statusSub") as HTMLElement;

function reflectStatus(enabled: boolean, message?: string): void {
  statusDot.classList.toggle("off", !enabled);
  statusLabel.textContent = enabled ? "Protected" : "Paused";
  statusSub.textContent = message ?? (enabled ? "Checking every signature" : "Transactions won't be checked");
}

async function load(): Promise<void> {
  const settings = (await chrome.storage.local.get(DEFAULT_SETTINGS)) as Settings;
  enabledEl.checked = settings.enabled;
  reflectStatus(settings.enabled);
}

async function requestActiveTabWalletConnect(): Promise<WalletConnectResult> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { ok: false, error: "No active tab to connect from" };

  const req: RequestWalletConnect = { type: "request-wallet-connect" };
  try {
    return (await chrome.tabs.sendMessage(tab.id, req)) as WalletConnectResult;
  } catch {
    return { ok: false, error: "Open a page with a Solana wallet, then try again" };
  }
}

async function save(): Promise<void> {
  if (!enabledEl.checked) {
    const settings: Settings = { enabled: false };
    await chrome.storage.local.set(settings);
    reflectStatus(false);
    return;
  }

  enabledEl.disabled = true;
  reflectStatus(true, "Connecting to your wallet…");

  const result = await requestActiveTabWalletConnect();

  enabledEl.disabled = false;

  if (!result.ok) {
    enabledEl.checked = false;
    await chrome.storage.local.set({ enabled: false });
    reflectStatus(false, result.error ?? "Connect a wallet first");
    return;
  }

  await chrome.storage.local.set({ enabled: true });
  reflectStatus(true);
}

enabledEl.addEventListener("change", save);

load();
