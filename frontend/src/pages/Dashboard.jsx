import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { Banner, StatusTag } from "../components/bits.jsx";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [p, c, o] = await Promise.all([
          api.get("/api/products"),
          api.get("/api/customers"),
          api.get("/api/orders"),
        ]);
        setProducts(p);
        setCustomers(c);
        setOrders(o);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const lowStock = products.filter((p) => p.stock_qty <= 5);
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const inventoryValue = products.reduce((sum, p) => sum + p.price * p.stock_qty, 0);

  return (
    <div>
      <div className="topline">
        <div>
          <h1>Dashboard</h1>
          <p>A quick read on what's in stock and what's moving.</p>
        </div>
      </div>

      {error && <Banner kind="error">{error}</Banner>}

      <div className="grid-stats">
        <div className="stat">
          <div className="label">Products tracked</div>
          <div className="value">{loading ? "—" : products.length}</div>
          <div className="hint">across the whole catalog</div>
        </div>
        <div className="stat">
          <div className="label">Customers</div>
          <div className="value">{loading ? "—" : customers.length}</div>
          <div className="hint">registered so far</div>
        </div>
        <div className="stat">
          <div className="label">Pending orders</div>
          <div className="value">{loading ? "—" : pendingOrders.length}</div>
          <div className="hint">awaiting fulfilment</div>
        </div>
        <div className={`stat ${lowStock.length > 0 ? "alert" : ""}`}>
          <div className="label">Low stock (≤5)</div>
          <div className="value">{loading ? "—" : lowStock.length}</div>
          <div className="hint">items running thin</div>
        </div>
        <div className="stat">
          <div className="label">Inventory value</div>
          <div className="value">{loading ? "—" : `$${inventoryValue.toFixed(0)}`}</div>
          <div className="hint">price × stock, summed</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <div className="card">
          <div className="card-pad section-head">
            <strong>Low stock items</strong>
            <Link to="/products" className="muted" style={{ fontSize: "0.82rem" }}>Manage products →</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>SKU</th><th>Name</th><th>Stock</th></tr></thead>
              <tbody>
                {!loading && lowStock.slice(0, 6).map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{p.sku}</td>
                    <td>{p.name}</td>
                    <td className="mono" style={{ color: p.stock_qty === 0 ? "var(--rust)" : "inherit" }}>{p.stock_qty}</td>
                  </tr>
                ))}
                {!loading && lowStock.length === 0 && (
                  <tr><td colSpan={3} className="muted">Everything's well stocked.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-pad section-head">
            <strong>Recent orders</strong>
            <Link to="/orders" className="muted" style={{ fontSize: "0.82rem" }}>View all →</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {!loading && orders.slice(0, 6).map((o) => (
                  <tr key={o.id}>
                    <td className="mono">#{o.id}</td>
                    <td>{o.customer_name}</td>
                    <td className="mono">${o.total?.toFixed(2)}</td>
                    <td><StatusTag status={o.status} /></td>
                  </tr>
                ))}
                {!loading && orders.length === 0 && (
                  <tr><td colSpan={4} className="muted">No orders placed yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
