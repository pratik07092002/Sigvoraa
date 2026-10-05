import type { Settings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

const enabledEl = document.getElementById("enabled") as HTMLInputElement;
const apiBaseUrlEl = document.getElementById("apiBaseUrl") as HTMLInputElement;
const statusDot = document.getElementById("statusDot") as HTMLElement;
const statusLabel = document.getElementById("statusLabel") as HTMLElement;
const statusSub = document.getElementById("statusSub") as HTMLElement;

function reflectStatus(enabled: boolean): void {
  statusDot.classList.toggle("off", !enabled);
  statusLabel.textContent = enabled ? "Protected" : "Paused";
  statusSub.textContent = enabled ? "Checking every signature" : "Transactions won't be checked";
}

async function load(): Promise<void> {
  const settings = (await chrome.storage.local.get(DEFAULT_SETTINGS)) as Settings;
  enabledEl.checked = settings.enabled;
  apiBaseUrlEl.value = settings.apiBaseUrl;
  reflectStatus(settings.enabled);
}

function save(): void {
  const settings: Settings = {
    enabled: enabledEl.checked,
    apiBaseUrl: apiBaseUrlEl.value.trim().replace(/\/$/, ""),
  };
  chrome.storage.local.set(settings);
  reflectStatus(settings.enabled);
}

enabledEl.addEventListener("change", save);
apiBaseUrlEl.addEventListener("change", save);

load();
