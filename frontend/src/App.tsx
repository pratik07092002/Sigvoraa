import { Routes, Route } from "react-router-dom";
import { Nav } from "./components/Nav";
import { Dashboard } from "./pages/Dashboard";
import { WalletShield } from "./pages/WalletShield";
import { AddressLookup } from "./pages/AddressLookup";
import { RegistryExplorer } from "./pages/RegistryExplorer";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Nav />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/shield" element={<WalletShield />} />
        <Route path="/address" element={<AddressLookup />} />
        <Route path="/registry" element={<RegistryExplorer />} />
      </Routes>
    </div>
  );
}

export default App;
