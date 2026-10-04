import { NavLink } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/shield", label: "Wallet Shield" },
  { to: "/address", label: "Address Lookup" },
  { to: "/registry", label: "Registry Explorer" },
];

export function Nav() {
  return (
    <header className="border-b border-slate-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <span className="text-lg font-semibold text-slate-100">SentinelMesh</span>
          <nav className="flex gap-1">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:text-slate-200"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="shrink-0 whitespace-nowrap">
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}
