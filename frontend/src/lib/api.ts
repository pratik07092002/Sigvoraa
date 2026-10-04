export type Verdict = "safe" | "caution" | "danger";

export interface Stats {
  total_alerts: number;
  flagged_addresses: number;
  transactions_indexed: number;
}

export interface Alert {
  id: number;
  signature: string;
  rule_id: string;
  severity: number;
  target_address: string | null;
  explanation: string | null;
  status: string | null;
  created_at: string;
}

export interface AddressProfile {
  address: string;
  risk_score: number;
  flagged: boolean;
  category: string | null;
}

export interface ShieldFinding {
  rule: string;
  severity: number;
  explanation: string;
}

export interface ShieldCheckResult {
  verdict: Verdict;
  risk_score: number;
  summary: string;
  would_fail: boolean;
  findings: ShieldFinding[];
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

export function fetchStats(): Promise<Stats> {
  return getJson("/api/stats");
}

export function fetchAlerts(limit = 50): Promise<Alert[]> {
  return getJson(`/api/alerts?limit=${limit}`);
}

export function fetchAddressProfile(address: string): Promise<AddressProfile> {
  return getJson(`/api/address/${encodeURIComponent(address)}`);
}

export async function checkTransaction(transactionBase64: string): Promise<ShieldCheckResult> {
  const res = await fetch("/api/shield/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ transaction: transactionBase64 }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `shield/check failed: ${res.status}`);
  }
  return res.json();
}

export interface ReportResult {
  signature: string | null;
  threat_entry: string;
  explorer_url: string;
  already_on_chain: boolean;
}

export async function reportAlert(alertId: number): Promise<ReportResult> {
  const res = await fetch("/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ alert_id: alertId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `report failed: ${res.status}`);
  }
  return res.json();
}
