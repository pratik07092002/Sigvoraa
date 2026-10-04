import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AppShell } from "./layouts/AppShell";
import { LandingPage } from "./pages/LandingPage";

const Dashboard = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const WalletShield = lazy(() => import("./pages/WalletShield").then((m) => ({ default: m.WalletShield })));
const AddressLookup = lazy(() => import("./pages/AddressLookup").then((m) => ({ default: m.AddressLookup })));
const RegistryExplorer = lazy(() =>
  import("./pages/RegistryExplorer").then((m) => ({ default: m.RegistryExplorer })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<AppShell />}>
        <Route
          index
          element={
            <Suspense fallback={<RouteFallback />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="shield"
          element={
            <Suspense fallback={<RouteFallback />}>
              <WalletShield />
            </Suspense>
          }
        />
        <Route
          path="address"
          element={
            <Suspense fallback={<RouteFallback />}>
              <AddressLookup />
            </Suspense>
          }
        />
        <Route
          path="registry"
          element={
            <Suspense fallback={<RouteFallback />}>
              <RegistryExplorer />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
