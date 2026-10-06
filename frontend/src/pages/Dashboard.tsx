import { useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { AlertTriangle, Flag, Activity, ShieldCheck, ShieldX, Info, type LucideIcon } from "lucide-react";
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

  const loading = stats.isLoading;

  return (
    <div className="relative">
      <div className="ambient-bg" />
      <div className="ambient-grid" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <div className="animate-in" style={delayStyle(0)}>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Two different things live here: what actually happened on-chain, and what Sigvoraa stopped before it could.
          </p>
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
      </div>
    </div>
  );
}
