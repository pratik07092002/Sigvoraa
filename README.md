# SentinelMesh

AI-powered security layer for Solana: real-time threat detection, AI program auditing, and wallet-side transaction protection — built on an on-chain Threat Registry any dApp or wallet can query.

Built for the Colosseum hackathon (Web3 x AI x Cybersecurity track).

## Modules

- **Program Scanner** — static rules + LLM review of Anchor/Rust programs.
- **Runtime Monitor** — streams live transactions, flags suspicious patterns, writes alerts.
- **Wallet Shield** — simulates a transaction before signing and explains the risk in plain language.

All three read/write a shared **Threat Registry** Anchor program on devnet.

## Repo layout

```
programs/threat-registry/   Anchor program (on-chain Threat Registry)
backend/                    Rust (Axum) API, indexer, rules engine, AI client, registry client
frontend/                   React + Vite + TypeScript dashboard, Wallet Shield UI
tests/                      Anchor integration tests
docs/                       Design notes
```

## Getting started

### On-chain program
```bash
anchor build
anchor test
```

### Backend
```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL, SOLANA_RPC_URL, LLM_API_KEY
cargo run
```

**Windows only:** the Solana SDK pulls in `openssl-sys` (via `solana-secp256r1-program`), which needs a real OpenSSL install to link against on MSVC — there's no pure-Rust alternative for that dependency. Install it once and point Cargo at it:
```bash
scoop install openssl
```
Then either `export OPENSSL_DIR="$(cygpath -w ~/scoop/apps/openssl/current)"` before building, or drop a `backend/.cargo/config.toml` with:
```toml
[env]
OPENSSL_DIR = "C:\\Users\\<you>\\scoop\\apps\\openssl\\current"
```
(gitignored on purpose — it's a per-machine path). Linux/macOS contributors can skip this; system OpenSSL is normally already discoverable there.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Status

Phase 1 (setup) scaffold: Anchor workspace, Axum skeleton with health/stub endpoints, Postgres schema, Vite app. See the build plan in `docs/` for what's next.
