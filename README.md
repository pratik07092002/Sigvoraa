# Sigvoraa

AI-powered security layer for Solana: real-time threat detection, AI program auditing, and wallet-side transaction protection — built on an on-chain Threat Registry any dApp or wallet can query.

Built for the Colosseum hackathon (Web3 x AI x Cybersecurity track). Deployed on devnet: [`Cy4jqUsSnq2Z9rK2Lv7FtkkdziXN7ZBRNGKC5edkbnBU`](https://explorer.solana.com/address/Cy4jqUsSnq2Z9rK2Lv7FtkkdziXN7ZBRNGKC5edkbnBU?cluster=devnet).

## Modules

| Module | Status | What it does |
|---|---|---|
| **Runtime Monitor** | Live | Streams transactions for watched addresses via `logsSubscribe`, runs 5 detection rules, writes alerts to Postgres. |
| **Wallet Shield** | Live | Simulates an unsigned transaction, runs the same rules engine, returns a Safe/Caution/Danger verdict with an AI-generated plain-language explanation. |
| **Threat Registry** | Live | Anchor program on devnet. Alerts can be reported on-chain with one click; anyone can read entries directly via the Registry Explorer, no backend required. |
| **Browser Extension** | v1 | Intercepts `window.solana` (and `window.phantom.solana`), runs every transaction through Wallet Shield before the wallet's approval popup opens. Works with any wallet injecting that legacy provider (most major Solana wallets do); wallets that only register via the newer Wallet Standard aren't covered yet. See `extension/README.md`. |
| **Program Scanner** | Not built | Scoped as a stretch goal in the original plan; out of scope for this submission. |

## Repo layout

```
programs/threat-registry/   Anchor program (on-chain Threat Registry)
backend/                    Rust (Axum) API, indexer, rules engine, AI client, registry client
frontend/                   React + Vite + TypeScript: Dashboard, Wallet Shield, Address Lookup, Registry Explorer
tests/                      Anchor integration tests (7/7 passing against devnet)
```

## Detection rules

`backend/src/rules/`, one file per rule, all pure functions over a `TxContext` (shared between the indexer's confirmed-transaction path and Wallet Shield's simulated-transaction path — one source of truth):

- `unlimited_delegate_approval` — SPL Token `approve`/`approveChecked` for the full balance or a u64::MAX-style amount.
- `authority_change` — `setAuthority` transferring a token account's `AccountOwner`.
- `rapid_multi_token_drain` — 2+ token accounts going from a nonzero balance to zero in one transaction.
- `unfamiliar_program_interaction` — calls a program outside a known-good allowlist (a heuristic proxy for the spec's "fresh program deploy" check, documented as such in code).
- `known_bad_address_interaction` — a transaction account is already in `flagged_addresses`.

Liquidity/mint-authority risk is the one rule from the original design that's deferred — it needs external pool data this MVP doesn't fetch.

## Getting started

### On-chain program
```bash
anchor build
anchor test   # runs against a local validator (see Windows note below)
```

### Backend
```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL, SOLANA_RPC_URL, LLM_API_KEY, INDEXER_WATCH_ADDRESSES
cargo run
```
The reporter keypair at `REPORTER_KEYPAIR_PATH` must be a registered reporter on the Threat Registry before `/api/report` will work — the registry authority calls `add_reporter` once to authorize it (see `programs/threat-registry`).

**Windows only:** the Solana SDK pulls in `openssl-sys` (via `solana-secp256r1-program`), which needs a real OpenSSL install to link against on MSVC. Install it once and point Cargo at it:
```bash
scoop install openssl
```
Then either `export OPENSSL_DIR="$(cygpath -w ~/scoop/apps/openssl/current)"` before building, or drop a `backend/.cargo/config.toml` with:
```toml
[env]
OPENSSL_DIR = "C:\\Users\\<you>\\scoop\\apps\\openssl\\current"
```
(gitignored on purpose — it's a per-machine path).

**Also Windows only:** `anchor test`'s local validator can fail to start (`Access is denied` unpacking its genesis archive) if Windows Defender's real-time scanning intercepts it. Add an exclusion if you hit this: `Add-MpPreference -ExclusionPath "<repo path>"` (admin PowerShell). The full Phase 2 test suite was verified against a live devnet deployment instead, with `anchor test --skip-local-validator --provider.cluster devnet`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
`src/idl/` holds a committed copy of the Anchor program's IDL and generated TS types (`target/` is gitignored) — Registry Explorer reads on-chain accounts directly with these via `@coral-xyz/anchor`, independent of the backend.

## API

| Method | Endpoint | Status |
|---|---|---|
| `GET` | `/health` | Live |
| `GET` | `/api/stats` | Live — real Postgres counts |
| `GET` | `/api/alerts` | Live — supports `limit`, `min_severity` |
| `GET` | `/api/address/:pubkey` | Live — `flagged_addresses` lookup |
| `POST` | `/api/shield/check` | Live — decode, simulate, score, explain |
| `POST` | `/api/report` | Live — `{ "alert_id": N }`, writes to the on-chain registry |
| `POST` / `GET` | `/api/scan`, `/api/scan/:id` | Stub — Program Scanner is out of scope |

## Demo script

1. Open **Wallet Shield**, click *Load danger demo* → *Check transaction*. Shows `Danger`, risk 70, and the full-balance-approval explanation.
2. Click *Load safe demo* instead → shows `Safe`, risk 0.
3. Open **Dashboard** — the same finding (and others from live devnet testing) are in the live alert feed, with a severity chart and top-flagged-addresses list.
4. Click **Report to Registry** on an alert → a real `report_threat` transaction goes on-chain. The alert flips to "Reported" with an Explorer link.
5. Open **Registry Explorer** — the new entry is there, read directly from the chain, no backend in the loop.

## Status

All phases from the original build plan are implemented and verified live against devnet (not just "it compiles"): the Threat Registry program, the indexer + 5-rule engine, Wallet Shield simulation + AI explanation, the full frontend, the registry write flow closing the loop from alert to on-chain record, and a browser extension — works with any Solana wallet injecting the legacy `window.solana` provider, not just Phantom — that runs Wallet Shield checks before signing. Program Scanner remains a documented stretch goal, out of scope here.
