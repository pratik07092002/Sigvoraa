import type { ShieldCheckResult, Verdict } from "./types";

// The Sigvoraa logo mark, inlined as a data URI (same source as the toolbar
// icon) so the brand header never needs a network fetch from inside a page.
const LOGO_DATA_URI =
  "data:image/png;base64,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";

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
  .brand-icon { width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0; }
  .brand-icon img { width: 100%; height: 100%; object-fit: contain; display: block; }
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
      <div class="brand-icon"><img src="${LOGO_DATA_URI}" alt="" /></div>
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
