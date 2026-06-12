import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import Customers from "./pages/Customers.jsx";
import Orders from "./pages/Orders.jsx";

export default function App() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="shell">
      <div className="mobile-bar">
        <span>Stockflow</span>
        <button onClick={() => setNavOpen((v) => !v)}>{navOpen ? "Close" : "Menu"}</button>
      </div>

      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </main>
    </div>
  );
}
