import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { fetchAlerts, fetchStats } from "../lib/api";
import { AlertFeed } from "../components/AlertFeed";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-100">{value.toLocaleString()}</p>
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
  const chartData = [...byRule.entries()].map(([rule, count]) => ({ rule, count }));

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

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total alerts" value={stats.data?.total_alerts ?? 0} />
        <StatCard label="Flagged addresses" value={stats.data?.flagged_addresses ?? 0} />
        <StatCard label="Transactions indexed" value={stats.data?.transactions_indexed ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-medium text-slate-300">Live alerts</h2>
          <AlertFeed alerts={alerts.data ?? []} />
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-sm font-medium text-slate-300">Alerts by rule</h2>
            {chartData.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <YAxis type="category" dataKey="rule" stroke="#64748b" fontSize={11} width={140} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: 12 }} />
                  <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-sm font-medium text-slate-300">Top flagged addresses</h2>
            {topAddressList.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet.</p>
            ) : (
              <ul className="space-y-2">
                {topAddressList.map(([address, info]) => (
                  <li key={address} className="flex items-center justify-between text-sm">
                    <span className="truncate font-mono text-xs text-slate-400">{address}</span>
                    <span className="shrink-0 text-slate-500">
                      {info.count}x, max {info.maxSeverity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
