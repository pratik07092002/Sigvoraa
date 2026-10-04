import { NavLink, Outlet, Link } from "react-router-dom";
import { LayoutDashboard, ShieldCheck, Search, Database } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Logo, LogoMark } from "../components/Logo";

const LINKS = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/shield", label: "Wallet Shield", icon: ShieldCheck },
  { to: "/app/address", label: "Address Lookup", icon: Search },
  { to: "/app/registry", label: "Registry Explorer", icon: Database },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-surface-page text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-surface-page/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <Link to="/" className="shrink-0">
              <span className="hidden sm:block">
                <Logo />
              </span>
              <span className="sm:hidden">
                <LogoMark />
              </span>
            </Link>
            <nav className="flex min-w-0 gap-1 overflow-x-auto">
              {LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === "/app"}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden md:inline">{link.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
          <div className="shrink-0 whitespace-nowrap [&_.wallet-adapter-button]:!h-9 [&_.wallet-adapter-button]:!rounded-lg [&_.wallet-adapter-button]:!bg-brand-600 [&_.wallet-adapter-button]:!text-sm [&_.wallet-adapter-button:hover]:!bg-brand-500">
            <WalletMultiButton />
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
