import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Radar,
  ShieldCheck,
  FileSearch,
  ArrowRight,
  Database,
  Sparkles,
  Workflow,
  Lock,
} from "lucide-react";
import { fetchStats } from "../lib/api";
import { Logo } from "../components/Logo";

const MODULES = [
  {
    icon: Radar,
    name: "Runtime Monitor",
    status: "Live",
    description:
      "Streams devnet transactions for watched wallets in real time, runs five detection rules, and writes alerts the moment a risky pattern shows up.",
  },
  {
    icon: ShieldCheck,
    name: "Wallet Shield",
    status: "Live",
    description:
      "Simulates a transaction before you sign it and returns a Safe / Caution / Danger verdict with a plain-language explanation — no surprises after the fact.",
  },
  {
    icon: FileSearch,
    name: "Program Scanner",
    status: "Roadmap",
    description:
      "Static analysis + LLM review of Anchor program source against a Solana-specific security checklist, before you ever deploy.",
  },
];

const STEPS = [
  {
    title: "Watch",
    description: "Point the Runtime Monitor at any wallet or program on devnet.",
  },
  {
    title: "Detect",
    description: "Five rules flag drainer-style approvals, authority hijacks, and more — in seconds.",
  },
  {
    title: "Explain",
    description: "An AI layer turns the raw finding into a sentence a non-technical user understands.",
  },
  {
    title: "Record",
    description: "One click writes the verdict to an on-chain Threat Registry anyone can verify.",
  },
];

function StatPill({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="flex items-baseline gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
      <span className="font-mono-tabular text-lg font-bold text-white">{value ?? "—"}</span>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

export function LandingPage() {
  const stats = useQuery({ queryKey: ["stats"], queryFn: fetchStats, refetchInterval: 10000 });

  return (
    <div className="min-h-screen overflow-hidden bg-surface-page text-slate-100">
      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo />
        <Link
          to="/app"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
        >
          Launch App
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      {/* Hero */}
      <section className="relative px-6 pb-24 pt-16 sm:pt-24">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]"
        />
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-200">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-brand-400" />
            Live on Solana devnet
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            The security layer
            <br />
            <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
              Solana wallets are missing
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
            Sigvoraa watches programs and wallets in real time, explains risk in plain language before you
            sign, and records every verdict on an on-chain registry any dApp can query.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/app/shield"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-500 sm:w-auto"
            >
              Try Wallet Shield
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/app"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/5 sm:w-auto"
            >
              View Live Dashboard
            </Link>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
            <StatPill label="alerts caught" value={stats.data?.total_alerts} />
            <StatPill label="addresses flagged" value={stats.data?.flagged_addresses} />
            <StatPill label="transactions indexed" value={stats.data?.transactions_indexed} />
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-400">Three modules</h2>
          <p className="mt-2 text-3xl font-bold text-white">One shared Threat Registry</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {MODULES.map((mod) => (
            <div
              key={mod.name}
              className="rounded-2xl border border-white/10 bg-surface-card p-6 transition-colors hover:border-white/20"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
                  <mod.icon className="h-5 w-5" />
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    mod.status === "Live"
                      ? "bg-status-good/15 text-status-good"
                      : "bg-white/10 text-slate-400"
                  }`}
                >
                  {mod.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white">{mod.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{mod.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/10 bg-surface-card/50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-400">How it works</h2>
            <p className="mt-2 text-3xl font-bold text-white">From raw transaction to verified record</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-white">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Composability callout */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid items-center gap-10 rounded-2xl border border-white/10 bg-gradient-to-br from-surface-card to-surface-raised p-10 sm:grid-cols-2">
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
              <Database className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold text-white">A public good, not a silo</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Every threat we find is written to an Anchor program on devnet — a PDA any wallet, dApp, or
              block explorer can read directly, with no API key and no trust in our backend required.
            </p>
            <Link
              to="/app/registry"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-300 hover:text-brand-200"
            >
              Explore the live registry
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-4">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
              <p className="text-sm text-slate-300">Rules decide the verdict; the LLM only explains it — no hallucinated risk scores.</p>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-4">
              <Workflow className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
              <p className="text-sm text-slate-300">One rules engine runs identically over live chain data and simulated wallet-shield checks.</p>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-4">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
              <p className="text-sm text-slate-300">Rate-limited, idempotent registry writes — built to run unattended, not just demoed once.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo className="opacity-80" />
          <p className="text-xs text-slate-500">Built for the Colosseum hackathon — Web3 x AI x Cybersecurity.</p>
        </div>
      </footer>
    </div>
  );
}
