# Scam Simulator — Demo Guide

How to run `fake-drainer-test.html` to show Sigvoraa catching real-shaped attacks it wasn't built to recognize specifically — a standalone page, independent of Sigvoraa's own code, that mimics four real-world Solana drainer patterns on devnet.

## Why this demo matters

Everything in the main app's Wallet Shield demo uses pre-built fixture transactions. This proves the opposite: that the extension generalizes to an *arbitrary* third-party page requesting a signature, the way a real malicious dApp would. That's a stronger claim than "it works on our own demo data."

## Prerequisites

- Phantom installed, network set to **Devnet** (Settings → Developer Settings → Change Network)
- Some devnet SOL in that wallet (`solana airdrop 1 <address> --url devnet`, or faucet.solana.com) — each scenario creates a couple of small on-chain accounts, so you need a little SOL for rent, not just signing
- Sigvoraa extension loaded unpacked in that same browser (`chrome://extensions` → Developer mode → Load unpacked → `extension/` folder)
- Python (for the quickest local server) — or any static file server you prefer

## Setup

Wallet extensions only inject their provider into `http(s)://` pages, not local `file://` ones — opening the file directly won't work, Phantom won't be detected.

```bash
cd D:\SentinelMesh
python -m http.server 5500
```

Open **http://localhost:5500/fake-drainer-test.html** in the browser that has Phantom + the extension.

## Running it

1. Click **Connect Phantom**, approve the connection. Confirm the page shows your address and that Phantom is on devnet.
2. Pick any of the four scenario cards and click its button.
3. Watch for Sigvoraa's checking spinner, then its verdict — this should appear **before** Phantom's own approval popup.
4. Click **Cancel** to prove the drain never reaches Phantom, or **Proceed anyway** to let it actually execute on devnet (harmless — worthless test tokens) and confirm the whole round-trip works.

| # | Button | Mimics | Should trigger |
|---|---|---|---|
| A | Claim Free Airdrop 🎁 | Fake token airdrop bundling a hidden full-balance approval | `unlimited_delegate_approval` — Danger, risk 70 |
| B | Verify Wallet ✅ | Phishing "re-link your wallet" support page | `authority_change` — Danger, risk 90 |
| C | Claim Bundle 📦 | "Claim all rewards at once" multi-token drain | `rapid_multi_token_drain` — Danger, risk 80+ |
| D | Mint Mystery NFT 🎲 | Cloned mint site running an unverified program | `unfamiliar_program_interaction` — Caution, risk 30 (simulation will likely also show "would fail" since the stand-in program isn't actually deployed — expected, the finding is what matters) |

Each scenario uses a **fresh throwaway mint and a fresh random "attacker" address** every click, so you can run the same button repeatedly without state carrying over.

## If something looks wrong

- **"No Phantom-compatible wallet found"** → you opened it via `file://` instead of `http://localhost`, or the extension/Phantom isn't enabled on that page.
- **No Sigvoraa popup at all, Phantom just opens directly** → the extension isn't loaded, or protection is toggled off in its popup. Real finding if everything else looks right — worth flagging.
- **"Rejected or failed: Rejected by Sigvoraa Wallet Shield"** in the page's log → that's success. It means you clicked Cancel in the verdict modal and the drain never reached Phantom.
- **Simulation error unrelated to the above** → devnet RPC can be flaky; wait a few seconds and retry the same button.

## What this doesn't cover

Two of the five rules aren't exercised here:

- `known_bad_address` needs the target address already reported into `flagged_addresses` first — not something a fresh wallet can trigger on its own. Ask if you want this wired up (report one of this harness's addresses once via the app, then re-run against it).
- Liquidity/mint-authority risk was scoped but never implemented — no rule exists for it to test.
