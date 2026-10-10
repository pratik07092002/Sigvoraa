# Sigvoraa

AI-powered security layer for Solana — built for the Colosseum hackathon (Web3 x AI x Cybersecurity track).

**Live demo:** https://dpk3244zw4bn0.cloudfront.net
**On-chain program (devnet):** [`Cy4jqUsSnq2Z9rK2Lv7FtkkdziXN7ZBRNGKC5edkbnBU`](https://explorer.solana.com/address/Cy4jqUsSnq2Z9rK2Lv7FtkkdziXN7ZBRNGKC5edkbnBU?cluster=devnet)

## The problem

Wallets sign transactions blind. A user approving a token delegate, granting a program access, or interacting with an unfamiliar contract has no plain-language explanation of what that transaction actually does to their funds — until it's too late. Existing security tooling is either reactive (post-mortem analysis after a drain) or locked inside a single wallet's proprietary blocklist, with no shared, verifiable record other dApps or wallets can check.

## What Sigvoraa does

Three pieces, one shared rules engine:

**Runtime Monitor** — streams live transactions for a set of watched addresses via Solana's `logsSubscribe`, runs them through 5 detection rules, and writes alerts to Postgres as they happen.

**Wallet Shield** — before a user signs, Sigvoraa simulates the *unsigned* transaction, runs the same detection rules against the simulated result, and returns a Safe / Caution / Danger verdict with an AI-generated plain-language explanation of what the transaction would actually do.

**Threat Registry** — an Anchor program on devnet. Any flagged alert can be reported on-chain with one click, becoming a permanent, publicly queryable record. Any dApp or wallet can read these entries directly from the chain — no Sigvoraa backend required, no trust in a centralized blocklist.

The key design point: Runtime Monitor and Wallet Shield both run the exact same rule functions over a shared `TxContext` — one rule implementation, two entry points (confirmed on-chain transactions vs. pre-signature simulation).

## Detection rules

- **Unlimited delegate approval** — SPL Token `approve`/`approveChecked` for the full balance or a u64::MAX-style amount
- **Authority change** — `setAuthority` transferring a token account's owner
- **Rapid multi-token drain** — 2+ token accounts going from nonzero to zero balance in one transaction
- **Unfamiliar program interaction** — calls a program outside a known-good allowlist (heuristic proxy for a fresh/unverified program deploy)
- **Known bad address interaction** — a transaction touches an address already in `flagged_addresses`

A sixth rule — liquidity/mint-authority risk — was scoped in the original design but deferred; it needs external pool data this MVP doesn't fetch.

## Try it

1. Open **Wallet Shield** → *Load danger demo* → *Check transaction*. Returns `Danger`, risk score 70, with an explanation that the transaction approves a token delegate for the full balance.
2. Open **Dashboard** — live alert feed, severity breakdown, top flagged addresses, pulled from the same Postgres the Runtime Monitor writes to.
3. Click **Report to Registry** on an alert → a real `report_threat` transaction goes on-chain, with an Explorer link.
4. Open **Registry Explorer** — the entry is there, read directly from the chain via `@coral-xyz/anchor`, independent of the backend entirely.

## What's built vs. scoped out

| Module | Status |
|---|---|
| Runtime Monitor | Live |
| Wallet Shield | Live |
| Threat Registry | Live |
| Browser Extension | v1 — works with any Solana wallet injecting the legacy `window.solana` provider (Phantom included), intercepts transactions before you sign them in the wallet itself |
| Program Scanner | Scoped as a stretch goal, not built — out of scope for this submission |

## Stack

- **On-chain:** Anchor program (Rust), deployed to Solana devnet
- **Backend:** Rust (Axum) — REST API, indexer, rules engine, AI client (Anthropic), registry client, Postgres
- **Frontend:** React + Vite + TypeScript — Dashboard, Wallet Shield, Address Lookup, Registry Explorer
