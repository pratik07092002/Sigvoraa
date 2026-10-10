import type { ShieldCheckResult, Verdict } from "./types";

const VERDICT = {
  safe: { color: "#2cb67d", label: "Safe", icon: iconShieldCheck() },
  caution: { color: "#fab219", label: "Caution", icon: iconShieldAlert() },
  danger: { color: "#d03b3b", label: "Danger", icon: iconShieldX() },
} satisfies Record<Verdict, { color: string; label: string; icon: string }>;

function severityColor(severity: number): string {
  if (severity >= 70) return "#d03b3b";
  if (severity >= 30) return "#fab219";
  return "#2cb67d";
}

// Inline, lucide-style icons (24x24, stroke-based) — no external icon font/network fetch.
function iconShieldCheck(): string {
  return `<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>`;
}
function iconShieldAlert(): string {
  return `<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/>`;
}
function iconShieldX(): string {
  return `<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m14.5 9.5-5 5"/><path d="m9.5 9.5 5 5"/>`;
}
function iconAlertOctagon(): string {
  return `<path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z"/><path d="M12 8v4"/><path d="M12 16h.01"/>`;
}
function iconLoader(): string {
  return `<path d="M21 12a9 9 0 1 1-6.219-8.56"/>`;
}

function svg(paths: string, extraAttrs = ""): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extraAttrs}>${paths}</svg>`;
}

function mountShadowRoot(): ShadowRoot {
  const host = document.createElement("div");
  host.id = `sigvoraa-overlay-${Math.random().toString(36).slice(2)}`;
  host.style.all = "initial";
  (document.body ?? document.documentElement).appendChild(host);
  return host.attachShadow({ mode: "open" });
}

const BASE_STYLE = `
  :host { all: initial; }
  * { box-sizing: border-box; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  svg { width: 100%; height: 100%; display: block; }

  .backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(2px);
    display: flex; align-items: center; justify-content: center;
    z-index: 2147483647; animation: sm-fade-in 0.15s ease-out;
  }
  .card {
    background: #111b21; color: #e4e4e7; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; padding: 22px; width: 380px; max-height: 85vh; overflow-y: auto;
    box-shadow: 0 25px 60px rgba(0,0,0,0.6); animation: sm-pop-in 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes sm-fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes sm-pop-in { from { opacity: 0; transform: scale(0.96) translateY(4px); } to { opacity: 1; transform: none; } }

  .brand-row { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .brand-icon { width: 30px; height: 30px; border-radius: 8px; background: rgba(0,168,132,0.15); color: #35bb93; padding: 6px; flex-shrink: 0; }
  .brand-title { font-size: 13px; font-weight: 700; color: #fff; }
  .brand-sub { font-size: 11px; color: #71717a; margin-top: 1px; }

  .top-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .badge {
    display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px 5px 8px;
    border-radius: 999px; font-size: 12.5px; font-weight: 700; border: 1px solid;
  }
  .badge svg { width: 15px; height: 15px; }
  .score { text-align: right; }
  .score-num { font-variant-numeric: tabular-nums; font-size: 22px; font-weight: 800; color: #fff; }
  .score-denom { font-size: 12px; color: #71717a; }
  .score-label { font-size: 10.5px; color: #71717a; margin-top: -2px; }

  .bar-track { margin-top: 12px; height: 6px; border-radius: 999px; background: rgba(255,255,255,0.06); overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 999px; transition: width 0.3s; }

  .would-fail {
    margin-top: 14px; display: flex; gap: 8px; align-items: flex-start;
    border: 1px solid rgba(250,178,25,0.3); background: rgba(250,178,25,0.1); color: #fab219;
    border-radius: 8px; padding: 9px 11px; font-size: 12px;
  }
  .would-fail svg { width: 15px; height: 15px; flex-shrink: 0; margin-top: 1px; }

  .summary { margin-top: 14px; font-size: 13px; line-height: 1.5; color: #d4d4d8; }

  .findings-head { margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; }
  .finding { display: flex; gap: 9px; margin-top: 10px; font-size: 12.5px; }
  .finding-dot { width: 7px; height: 7px; border-radius: 999px; margin-top: 5px; flex-shrink: 0; }
  .finding-sev { font-variant-numeric: tabular-nums; font-weight: 700; }
  .finding-rule { font-weight: 600; color: #e4e4e7; }
  .finding-explain { color: #a1a1aa; margin-top: 1px; }

  .actions { display: flex; gap: 8px; margin-top: 20px; }
  button { flex: 1; padding: 10px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; transition: background 0.12s; font-family: inherit; }
  .btn-secondary { background: rgba(255,255,255,0.08); color: #e4e4e7; }
  .btn-secondary:hover { background: rgba(255,255,255,0.13); }
  .btn-danger { background: #008069; color: white; }
  .btn-danger:hover { background: #00a884; }

  .toast {
    position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;
    background: #111b21; color: #e4e4e7; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
    padding: 11px 14px; font-size: 12.5px; display: flex; align-items: center; gap: 9px; max-width: 320px;
    box-shadow: 0 12px 32px rgba(0,0,0,0.5); animation: sm-toast-in 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes sm-toast-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .toast-icon { width: 17px; height: 17px; flex-shrink: 0; }
  .toast-spin { animation: sm-spin 0.8s linear infinite; }
  @keyframes sm-spin { to { transform: rotate(360deg); } }
`;

function brandHeader(): string {
  return `
    <div class="brand-row">
      <div class="brand-icon">${svg(iconShieldCheck())}</div>
      <div>
        <div class="brand-title">Sigvoraa Wallet Shield</div>
        <div class="brand-sub">Checked before your wallet asked you to sign</div>
      </div>
    </div>
  `;
}

export function showChecking(): () => void {
  const root = mountShadowRoot();
  const style = document.createElement("style");
  style.textContent = BASE_STYLE;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span class="toast-icon toast-spin" style="color:#35bb93">${svg(iconLoader())}</span><span>Checking transaction with Sigvoraa...</span>`;
  root.append(style, toast);
  return () => root.host.remove();
}

export function showToast(message: string, color: string, icon: string): void {
  const root = mountShadowRoot();
  const style = document.createElement("style");
  style.textContent = BASE_STYLE;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span class="toast-icon" style="color:${color}">${svg(icon)}</span><span>${message}</span>`;
  root.append(style, toast);
  setTimeout(() => root.host.remove(), 4000);
}

export function showSafeToast(riskScore: number): void {
  showToast(`Transaction looks safe (risk ${riskScore}/100)`, VERDICT.safe.color, VERDICT.safe.icon);
}

export function showFailOpenToast(reason: string): void {
  showToast(`Couldn't check this transaction (${reason}) — proceeding`, "#fab219", iconAlertOctagon());
}

export function showVerdictModal(result: ShieldCheckResult): Promise<boolean> {
  return new Promise((resolve) => {
    const root = mountShadowRoot();
    const style = document.createElement("style");
    style.textContent = BASE_STYLE;
    const v = VERDICT[result.verdict];

    const findingsHtml =
      result.findings.length > 0
        ? `
      <div class="findings-head">Findings</div>
      ${result.findings
        .map(
          (f) => `
        <div class="finding">
          <span class="finding-dot" style="background:${severityColor(f.severity)}"></span>
          <div>
            <span class="finding-sev" style="color:${severityColor(f.severity)}">${f.severity}</span>
            <span class="finding-rule">${f.rule}</span>
            <div class="finding-explain">${f.explanation}</div>
          </div>
        </div>`,
        )
        .join("")}
    `
        : "";

    const backdrop = document.createElement("div");
    backdrop.className = "backdrop";
    backdrop.innerHTML = `
      <div class="card">
        ${brandHeader()}
        <div class="top-row">
          <span class="badge" style="background:${v.color}1a; color:${v.color}; border-color:${v.color}4d">
            ${svg(v.icon)}${v.label}
          </span>
          <div class="score">
            <div><span class="score-num">${result.risk_score}</span><span class="score-denom">/100</span></div>
            <div class="score-label">risk score</div>
          </div>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${result.risk_score}%; background:${v.color}"></div></div>
        ${
          result.would_fail
            ? `<div class="would-fail">${svg(iconAlertOctagon())}<span>This transaction would fail if signed and sent.</span></div>`
            : ""
        }
        <div class="summary">${result.summary}</div>
        ${findingsHtml}
        <div class="actions">
          <button class="btn-secondary" type="button" data-action="cancel">Cancel</button>
          <button class="btn-danger" type="button" data-action="proceed">Proceed anyway</button>
        </div>
      </div>
    `;
    root.append(style, backdrop);

    const cleanup = (proceed: boolean) => {
      root.host.remove();
      resolve(proceed);
    };
    backdrop.querySelector('[data-action="cancel"]')!.addEventListener("click", () => cleanup(false));
    backdrop.querySelector('[data-action="proceed"]')!.addEventListener("click", () => cleanup(true));
  });
}
