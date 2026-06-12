import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client.js";
import { Banner, LoadingRows, EmptyState, StatusTag } from "../components/bits.jsx";

function emptyLine() {
  return { product_id: "", quantity: 1 };
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  // order builder state
  const [builderOpen, setBuilderOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState([emptyLine()]);
  const [formError, setFormError] = useState(null); // can be string or {message, issues}
  const [submitting, setSubmitting] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [o, p, c] = await Promise.all([
        api.get("/api/orders"),
        api.get("/api/products"),
        api.get("/api/customers"),
      ]);
      setOrders(o);
      setProducts(p);
      setCustomers(c);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function productById(id) {
    return products.find((p) => p.id === Number(id));
  }

  function updateLine(idx, patch) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(idx) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  // figure out if current line quantities exceed stock - used to disable submit early
  const stockProblems = lines
    .filter((l) => l.product_id)
    .map((l) => {
      const product = productById(l.product_id);
      const qty = Number(l.quantity) || 0;
      if (product && qty > product.stock_qty) {
        return `${product.name}: only ${product.stock_qty} available, you entered ${qty}`;
      }
      return null;
    })
    .filter(Boolean);

  const total = lines.reduce((sum, l) => {
    const product = productById(l.product_id);
    const qty = Number(l.quantity) || 0;
    return product ? sum + product.price * qty : sum;
  }, 0);

  function openBuilder() {
    setCustomerId("");
    setLines([emptyLine()]);
    setFormError(null);
    setBuilderOpen(true);
  }

  async function handleCreateOrder(e) {
    e.preventDefault();
    setFormError(null);

    if (!customerId) {
      setFormError("Pick a customer for this order.");
      return;
    }
    const validLines = lines.filter((l) => l.product_id && Number(l.quantity) > 0);
    if (validLines.length === 0) {
      setFormError("Add at least one product line with a quantity.");
      return;
    }
    if (stockProblems.length > 0) {
      setFormError({ message: "Fix the stock issues below before submitting", issues: stockProblems });
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/orders", {
        customer_id: Number(customerId),
        items: validLines.map((l) => ({ product_id: Number(l.product_id), quantity: Number(l.quantity) })),
      });
      setBuilderOpen(false);
      await loadAll();
    } catch (e) {
      if (e instanceof ApiError && e.details?.issues) {
        setFormError({ message: e.details.message, issues: e.details.issues });
      } else {
        setFormError(e.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function setStatus(order, status) {
    try {
      await api.patch(`/api/orders/${order.id}/status`, { status });
      await loadAll();
    } catch (e) {
      alert(e.message);
    }
  }

  async function removeOrder(order) {
    if (!confirm(`Delete order #${order.id}? Stock will be restored if it wasn't already cancelled.`)) return;
    try {
      await api.del(`/api/orders/${order.id}`);
      await loadAll();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <div className="topline">
        <div>
          <h1>Orders</h1>
          <p>Place new orders and track fulfilment status.</p>
        </div>
        <button className="btn btn-primary" onClick={openBuilder} disabled={products.length === 0 || customers.length === 0}>
          + New order
        </button>
      </div>

      {error && <Banner kind="error">{error}</Banner>}
      {!loading && (products.length === 0 || customers.length === 0) && (
        <Banner kind="error">
          You'll need at least one product and one customer before you can create an order.
        </Banner>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Placed</th>
                <th></th>
              </tr>
            </thead>
            {loading ? (
              <LoadingRows count={4} />
            ) : (
              <tbody>
                {orders.map((o) => (
                  <>
                    <tr key={o.id} onClick={() => setExpandedId(expandedId === o.id ? null : o.id)} style={{ cursor: "pointer" }}>
                      <td className="mono">#{o.id}</td>
                      <td>{o.customer_name || `Customer ${o.customer_id}`}</td>
                      <td>{o.items.length} item{o.items.length !== 1 ? "s" : ""}</td>
                      <td className="mono">${o.total?.toFixed(2)}</td>
                      <td><StatusTag status={o.status} /></td>
                      <td className="muted">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                          {o.status === "pending" && (
                            <>
                              <button className="btn btn-ghost btn-sm" onClick={() => setStatus(o, "completed")}>Mark done</button>
                              <button className="btn btn-danger btn-sm" onClick={() => setStatus(o, "cancelled")}>Cancel</button>
                            </>
                          )}
                          <button className="btn btn-danger btn-sm" onClick={() => removeOrder(o)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === o.id && (
                      <tr>
                        <td colSpan={7} style={{ background: "#f7f8f7" }}>
                          <table>
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Unit price</th>
                                <th>Line total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {o.items.map((it) => (
                                <tr key={it.id}>
                                  <td>{it.product_name || `#${it.product_id}`}</td>
                                  <td className="mono">{it.quantity}</td>
                                  <td className="mono">${it.unit_price.toFixed(2)}</td>
                                  <td className="mono">${(it.unit_price * it.quantity).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {!loading && orders.length === 0 && (
          <EmptyState title="No orders yet" body="Create one once you've added products and customers." />
        )}
      </div>

      {builderOpen && (
        <div className="modal-backdrop" onClick={() => setBuilderOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <h2>New order</h2>

            {formError && (
              <Banner kind="error">
                {typeof formError === "string" ? formError : (
                  <>
                    {formError.message}
                    {formError.issues && (
                      <ul>
                        {formError.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                      </ul>
                    )}
                  </>
                )}
              </Banner>
            )}

            <form onSubmit={handleCreateOrder}>
              <div className="field">
                <label>Customer</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">Select a customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600 }}>Items</label>
                {lines.map((line, idx) => {
                  const product = productById(line.product_id);
                  const qty = Number(line.quantity) || 0;
                  const overStock = product && qty > product.stock_qty;
                  return (
                    <div className="order-line" key={idx} style={{ marginTop: 8 }}>
                      <select value={line.product_id} onChange={(e) => updateLine(idx, { product_id: e.target.value })}>
                        <option value="">Choose product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} - ${p.price.toFixed(2)}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                      />
                      <span className="stock-pill" style={overStock ? { color: "var(--rust)" } : {}}>
                        {product ? `${product.stock_qty} avail.` : ""}
                      </span>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeLine(idx)} disabled={lines.length === 1}>×</button>
                    </div>
                  );
                })}
                <button type="button" className="btn btn-ghost btn-sm" onClick={addLine} style={{ marginTop: 4 }}>
                  + Add another item
                </button>
              </div>

              <div className="order-total">Total: ${total.toFixed(2)}</div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setBuilderOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting || stockProblems.length > 0}>
                  {submitting ? "Placing..." : "Place order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
