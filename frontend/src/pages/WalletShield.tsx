import { ShieldCheck, ExternalLink, ShieldAlert, ShieldX, type LucideIcon } from "lucide-react";

function StepCard({ step, title, body }: { step: number; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-xs font-bold text-brand-300">
        {step}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        <p className="text-sm text-slate-500">{body}</p>
      </div>
    </div>
  );
}

function VerdictPill({ icon: Icon, label, color }: { icon: LucideIcon; label: string; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export function WalletShield() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Wallet Shield</h1>
          <p className="text-sm text-slate-400">Now lives in your browser, not a textbox.</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-surface-card p-6">
        <p className="text-sm leading-relaxed text-slate-300">
          Wallet Shield used to be a page where you'd paste a transaction to check it. The real version is the Sigvoraa
          browser extension — it wraps your Solana wallet directly, so every transaction gets checked automatically,
          before your wallet's own approval popup even opens. No copy-pasting, nothing to remember to do.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            href="https://chromewebstore.google.com/detail/sigvoraa-wallet-shield/pblacdbdcbilgogjepmlleedceapnkce"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Add to Chrome
          </a>
          <a
            href="https://github.com/pratik07092002/Sigvoraa/tree/main/extension"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-white/20 hover:text-slate-300"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Get the source on GitHub
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-surface-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-200">Installing it takes four steps</h2>
        <div className="space-y-4">
          <StepCard step={1} title="Open chrome://extensions" body="In Chrome, Brave, or Edge — any Chromium browser works." />
          <StepCard step={2} title="Turn on Developer mode" body="Toggle in the top right of that page." />
          <StepCard
            step={3}
            title="Click Load unpacked"
            body="Pick the extension/ folder from the GitHub repo you just downloaded or cloned."
          />
          <StepCard step={4} title="Pin it to your toolbar" body="Click the puzzle-piece icon, then the pin next to Sigvoraa." />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-surface-card p-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">What happens when you sign</h2>
        <p className="mb-4 text-sm text-slate-500">
          Every verdict runs the same rules engine this dashboard does — nothing bespoke to the extension.
        </p>
        <div className="flex flex-wrap gap-2">
          <VerdictPill
            icon={ShieldCheck}
            label="Safe — passes through with a toast"
            color="border-status-good/30 bg-status-good/10 text-status-good"
          />
          <VerdictPill
            icon={ShieldAlert}
            label="Caution — a warning modal, your call"
            color="border-status-warning/30 bg-status-warning/10 text-status-warning"
          />
          <VerdictPill
            icon={ShieldX}
            label="Danger — blocked until you say otherwise"
            color="border-status-critical/30 bg-status-critical/10 text-status-critical"
          />
        </div>
      </div>
    </div>
  );
}
