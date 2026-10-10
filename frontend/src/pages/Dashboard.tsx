import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { AlertTriangle, Flag, Activity, ShieldCheck, ShieldX, Info, ArrowRight, type LucideIcon } from "lucide-react";
import { fetchAlerts, fetchStats } from "../lib/api";
import { AlertFeed } from "../components/AlertFeed";
import { useCountUp } from "../lib/useCountUp";

function delayStyle(ms: number): CSSProperties {
  return { "--delay": `${ms}ms` } as CSSProperties;
}

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex h-4 w-4 items-center justify-center rounded-full text-slate-500 transition-colors hover:text-slate-300"
        aria-label="What does this mean?"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <span
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <span className="absolute top-full left-1/2 z-20 mt-2 w-56 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg border border-white/10 bg-surface-raised p-3 text-xs leading-relaxed font-normal text-slate-300 shadow-xl">
            {text}
          </span>
        </>
      )}
    </span>
  );
}

function StatCard({
  label,
  info,
  value,
  icon: Icon,
  accent = "brand",
  loading,
  delay = 0,
}: {
  label: string;
  info: string;
  value: number;
  icon: LucideIcon;
  accent?: "brand" | "good";
  loading: boolean;
  delay?: number;
}) {
  const accentClasses = accent === "good" ? "bg-status-good/10 text-status-good" : "bg-brand-500/10 text-brand-300";
  const animated = useCountUp(value);

  return (
    <div
      className="animate-in group relative overflow-hidden rounded-xl border border-white/10 bg-surface-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500/30 hover:shadow-lg hover:shadow-black/20"
      style={delayStyle(delay)}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm text-slate-400">
          {label}
          <InfoTooltip text={info} />
        </p>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 ${accentClasses}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {loading ? (
        <div className="skeleton mt-4 h-8 w-20 rounded-md" />
      ) : (
        <p className="mt-3 font-mono-tabular text-3xl font-bold text-white">{animated.toLocaleString()}</p>
      )}
    </div>
  );
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: { rule: string; count: number } }[] }) {
  if (!active || !payload?.length) return null;
  const { rule, count } = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-surface-raised px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-white">{rule}</p>
      <p className="text-slate-400">{count} alert{count === 1 ? "" : "s"}</p>
    </div>
  );
}

export function Dashboard() {
  const stats = useQuery({ queryKey: ["stats"], queryFn: fetchStats, refetchInterval: 5000 });
  const alerts = useQuery({ queryKey: ["alerts"], queryFn: () => fetchAlerts(50), refetchInterval: 5000 });

  const byRule = new Map<string, number>();
  for (const a of alerts.data ?? []) {
    byRule.set(a.rule_id, (byRule.get(a.rule_id) ?? 0) + 1);
  }
  const chartData = [...byRule.entries()]
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count);

  const topAddresses = new Map<string, { count: number; maxSeverity: number }>();
  for (const a of alerts.data ?? []) {
    if (!a.target_address) continue;
    const existing = topAddresses.get(a.target_address) ?? { count: 0, maxSeverity: 0 };
    existing.count += 1;
    existing.maxSeverity = Math.max(existing.maxSeverity, a.severity);
    topAddresses.set(a.target_address, existing);
  }
  const topAddressList = [...topAddresses.entries()]
    .sort((a, b) => b[1].maxSeverity - a[1].maxSeverity || b[1].count - a[1].count)
    .slice(0, 5);

  const loading = stats.data === undefined;

  return (
    <div className="relative">
      <div className="ambient-bg" />
      <div className="ambient-grid" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <div
          className="animate-in relative isolate overflow-hidden rounded-3xl border border-brand-400/20 bg-gradient-to-br from-[#102a2c] via-surface-card to-[#171b31] px-6 py-10 shadow-2xl shadow-brand-950/30 sm:px-10 sm:py-14"
          style={delayStyle(0)}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-36 -z-10 h-96 w-96 rounded-full bg-brand-500/20 blur-[100px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-48 left-1/3 -z-10 h-80 w-80 rounded-full bg-cyan-500/10 blur-[100px]"
          />
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-300/20 bg-brand-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Transaction intelligence · Solana
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl">
              Transaction Intelligence Before Approval.
            </h1>
            <h2 className="mt-5 max-w-2xl text-xl font-semibold leading-snug text-brand-200 sm:text-2xl">
              Verify What You’re Signing. Before You Sign It.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Sigvoraa simulates and analyzes blockchain transactions before wallet approval, exposing hidden asset
              movements, suspicious instructions, and transaction risk in real time.
            </p>
            <Link
              to="/app/shield"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-950/30 transition-colors hover:bg-brand-400"
            >
              Check a transaction
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="animate-in text-xs font-semibold uppercase tracking-wide text-slate-500" style={delayStyle(40)}>
            Confirmed on-chain — the Runtime Monitor
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Threats detected"
              info="Rule violations found in transactions that were actually signed and sent — confirmed on-chain by the Runtime Monitor, not a simulation."
              value={stats.data?.total_alerts ?? 0}
              icon={AlertTriangle}
              loading={loading}
              delay={80}
            />
            <StatCard
              label="Addresses reported"
              info="Addresses a human has explicitly submitted to the on-chain Threat Registry via 'Report to Registry'. This never happens automatically."
              value={stats.data?.flagged_addresses ?? 0}
              icon={Flag}
              loading={loading}
              delay={140}
            />
            <StatCard
              label="Transactions scanned"
              info="Every confirmed transaction the Runtime Monitor has observed on a watched address, flagged or not."
              value={stats.data?.transactions_indexed ?? 0}
              icon={Activity}
              loading={loading}
              delay={200}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="animate-in text-xs font-semibold uppercase tracking-wide text-slate-500" style={delayStyle(260)}>
            Before you sign — Wallet Shield &amp; the extension
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              label="Checks performed"
              info="Every Wallet Shield or extension check that ever ran — including ones you canceled. Nothing here ever touches the chain, so it's not counted above."
              value={stats.data?.checks_performed ?? 0}
              icon={ShieldCheck}
              loading={loading}
              delay={320}
            />
            <StatCard
              label="Attacks prevented"
              info="Checks that came back Caution or Danger. If you clicked Cancel on any of these, the transaction was never signed — this is your proof it worked."
              value={stats.data?.checks_blocked ?? 0}
              icon={ShieldX}
              accent="good"
              loading={loading}
              delay={380}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div
            className="animate-in rounded-xl border border-white/10 bg-surface-card p-5 transition-colors duration-300 hover:border-white/15 lg:col-span-2"
            style={delayStyle(440)}
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="live-dot h-2 w-2 rounded-full bg-status-good" />
              <h2 className="text-sm font-semibold text-slate-200">Live alerts</h2>
            </div>
            <AlertFeed alerts={alerts.data ?? []} />
          </div>

          <div className="space-y-6">
            <div
              className="animate-in rounded-xl border border-white/10 bg-surface-card p-5 transition-colors duration-300 hover:border-white/15"
              style={delayStyle(500)}
            >
              <h2 className="mb-4 text-sm font-semibold text-slate-200">Alerts by rule</h2>
              {chartData.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 44)}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                    <XAxis type="number" stroke="#71717a" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="rule"
                      stroke="#a1a1aa"
                      fontSize={11}
                      width={150}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,168,132,0.08)" }} />
                    <Bar dataKey="count" fill="#00a884" radius={[0, 4, 4, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div
              className="animate-in rounded-xl border border-white/10 bg-surface-card p-5 transition-colors duration-300 hover:border-white/15"
              style={delayStyle(560)}
            >
              <h2 className="mb-4 text-sm font-semibold text-slate-200">Top flagged addresses</h2>
              {topAddressList.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">No data yet.</p>
              ) : (
                <ul className="space-y-3">
                  {topAddressList.map(([address, info]) => (
                    <li key={address} className="flex items-center justify-between text-sm">
                      <span className="truncate font-mono text-xs text-slate-400">{address}</span>
                      <span className="shrink-0 font-mono-tabular text-xs text-slate-500">
                        {info.count}x &middot; max {info.maxSeverity}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <section
          aria-labelledby="dont-sign-blind"
          className="animate-in overflow-hidden rounded-3xl border border-brand-400/15 bg-gradient-to-br from-brand-950/50 via-surface-card to-surface-card p-6 sm:p-10"
          style={delayStyle(620)}
        >
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">Why Sigvoraa?</p>
              <h2 id="dont-sign-blind" className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Don’t Sign Blind.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">
                Sigvoraa helps you understand what a blockchain transaction will actually do before your wallet asks
                you to approve it.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-white">Blockchain became trustless.</h3>
              <h3 className="mt-2 text-lg font-semibold text-brand-200">
                But transaction approval is still largely trust-based.
              </h3>
              <p className="mt-4 leading-relaxed text-slate-400">
                Users shouldn’t need to understand raw blockchain instructions to know whether a transaction is safe.
              </p>
              <p className="mt-4 border-l-2 border-brand-400 pl-4 leading-relaxed text-slate-200">
                Sigvoraa analyzes the transaction before approval, translates complex instructions into human-readable
                intent, identifies suspicious behavior, and assigns a clear risk assessment.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="why-we-built-sigvoraa" className="space-y-8 pb-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">About Sigvoraa</p>
            <h2 id="why-we-built-sigvoraa" className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Why We Built Sigvoraa
            </h2>
            <h3 className="mt-4 text-xl font-semibold leading-snug text-slate-200 sm:text-2xl">
              The blockchain is transparent. The transaction isn’t always understandable.
            </h3>
            <p className="mt-4 leading-relaxed text-slate-400">
              Every blockchain transaction is technically visible on-chain. But for a normal user, a wallet approval
              can still hide what those instructions actually mean.
            </p>
            <p className="mt-3 leading-relaxed text-slate-400">And the consequences are getting larger.</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">The problem, in numbers</h3>
            <p className="mt-1 text-sm text-slate-400">
              The scale of crypto-related losses reported in FBI IC3 annual reports.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-surface-card p-5">
                <p className="font-mono-tabular text-3xl font-bold text-brand-200">$11.37B</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  in cryptocurrency-related losses were reported to the FBI in 2025.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-surface-card p-5">
                <p className="font-mono-tabular text-3xl font-bold text-brand-200">181,565</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  cryptocurrency-related complaints were reported in 2025 — 21% more than 2024.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-surface-card p-5">
                <p className="font-mono-tabular text-3xl font-bold text-brand-200">$62,604</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  was the average reported loss per cryptocurrency-related complaint.
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Source: FBI Internet Crime Complaint Center (IC3), 2025.{" "}
              <a
                href="https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf"
                target="_blank"
                rel="noreferrer"
                className="text-brand-300 underline decoration-brand-300/40 underline-offset-4 hover:text-brand-200"
              >
                Read the IC3 annual report
              </a>
              .
            </p>
          </div>

          <div className="border-t border-white/10 pt-7">
            <h3 className="text-lg font-semibold text-white">
              And individual wallets are increasingly being targeted.
            </h3>
            <p className="mt-1 text-sm text-slate-400">Chainalysis identified approximately:</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-surface-card p-5">
                <p className="font-mono-tabular text-3xl font-bold text-white">158,000</p>
                <p className="mt-2 text-sm text-slate-400">personal-wallet compromise incidents in 2025</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-surface-card p-5">
                <p className="font-mono-tabular text-3xl font-bold text-white">80,000+</p>
                <p className="mt-2 text-sm text-slate-400">unique victims</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-surface-card p-5">
                <p className="font-mono-tabular text-3xl font-bold text-white">$713M</p>
                <p className="mt-2 text-sm text-slate-400">in cryptocurrency stolen from individual victims</p>
              </div>
            </div>
            <p className="mt-5 max-w-4xl leading-relaxed text-slate-400">
              Most importantly for Sigvoraa, Chainalysis says Solana had approximately{" "}
              <strong className="font-semibold text-slate-200">26,500 victims</strong>, making it the chain with the
              largest number of incidents in its 2025 personal-wallet analysis. That makes wallet security on Solana
              especially important.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Source: Chainalysis,{" "}
              <a
                href="https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2026/"
                target="_blank"
                rel="noreferrer"
                className="text-brand-300 underline decoration-brand-300/40 underline-offset-4 hover:text-brand-200"
              >
                Crypto Hacking and Stolen Funds in 2025
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
