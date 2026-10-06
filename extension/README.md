# Sigvoraa Wallet Shield (browser extension)

Intercepts Phantom's injected `window.solana` provider and runs every transaction through Sigvoraa's Wallet Shield (`POST /api/shield/check`, same backend and rules engine as the web app) before Phantom's own approval popup opens.

## Scope (v1)

- **Phantom only**, via its legacy `window.solana` / `window.phantom.solana` injection. dApps that only use the newer Wallet Standard registration (common with `@solana/wallet-adapter`) aren't intercepted yet — see the plan doc for why.
- Covers `signTransaction`, `signAllTransactions`, `signAndSendTransaction`.
- Safe verdicts pass through with a toast. Caution/Danger block with a modal (Proceed anyway / Cancel). If the backend is unreachable, it fails open with a warning toast rather than blocking signing entirely.

## Build

```bash
npm install
npm run build
```

Outputs to `dist/`.

## Load it in Chrome

1. `chrome://extensions`
2. Enable **Developer mode** (top right)
3. **Load unpacked** → select the `extension/` folder (not `dist/` — the manifest lives one level up and references `dist/*.js`)
4. Open the toolbar icon to confirm protection is on

The backend URL is hardcoded to the live CloudFront deployment (`src/types.ts`, `API_BASE_URL`) rather than user-configurable — for local backend dev, edit that constant (and add the matching origin to `manifest.json`'s `host_permissions`), then rebuild.

## Testing without a real dApp

Any page that calls `window.solana.signTransaction(...)` will trigger a check. The quickest way to test with a real wallet: open the Wallet Shield page in the main app, connect Phantom, and trigger a signature from there — or use Phantom's own devnet test dApp.

To sanity-check the interception/relay/UI logic alone (no Phantom, no real backend needed), there's a mock harness: it fakes `window.solana` and `chrome.runtime`/`chrome.storage`, then loads the real `dist/inject.js` + `dist/content.js` unmodified.

```bash
npm run build
node scripts/serve.mjs   # serves extension/ on http://localhost:5544
```

Open `http://localhost:5544/scripts/test-harness.html` and click through the danger / safe / unreachable buttons — confirms the modal blocks on Cancel, safe transactions pass through with a toast, and an unreachable backend fails open with a warning instead of bricking signing.

After rebuilding (`npm run build`), reload the extension from `chrome://extensions` (the reload icon on its card) to pick up changes — Chrome doesn't hot-reload unpacked extensions.
