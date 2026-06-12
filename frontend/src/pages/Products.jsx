import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../api/client.js";
import { Banner, LoadingRows, EmptyState, StockTag } from "../components/bits.jsx";

const emptyForm = { sku: "", name: "", description: "", price: "", stock_qty: "" };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/api/products");
      setProducts(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }, [products, search]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(p) {
    setEditingId(p.id);
    setForm({
      sku: p.sku,
      name: p.name,
      description: p.description || "",
      price: String(p.price),
      stock_qty: String(p.stock_qty),
    });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!form.sku.trim() || !form.name.trim()) {
      setFormError("SKU and name are required.");
      return;
    }
    const price = Number(form.price);
    const stock = Number(form.stock_qty);
    if (!(price > 0)) {
      setFormError("Price must be a positive number.");
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setFormError("Stock must be a whole number, 0 or more.");
      return;
    }

    const payload = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      stock_qty: stock,
    };

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/api/products/${editingId}`, payload);
      } else {
        await api.post("/api/products", payload);
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Could not save product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p) {
    if (!confirm(`Delete "${p.name}" (${p.sku})? This can't be undone.`)) return;
    try {
      await api.del(`/api/products/${p.id}`);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <div className="topline">
        <div>
          <h1>Products</h1>
          <p>Catalog of everything sitting on the shelves.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New product</button>
      </div>

      {error && <Banner kind="error">{error}</Banner>}

      <div className="card">
        <div className="card-pad section-head">
          <input
            className="search-box"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="muted mono">{filtered.length} of {products.length}</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            {loading ? (
              <LoadingRows count={5} />
            ) : (
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{p.sku}</td>
                    <td>
                      {p.name}
                      {p.description && <div className="muted" style={{ fontSize: "0.78rem" }}>{p.description}</div>}
                    </td>
                    <td className="mono">${p.price.toFixed(2)}</td>
                    <td><StockTag qty={p.stock_qty} /></td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {!loading && filtered.length === 0 && (
          <EmptyState title="No products found" body="Try a different search, or add your first product." />
        )}
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? "Edit product" : "New product"}</h2>
            {formError && <Banner kind="error">{formError}</Banner>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="field">
                  <label>SKU</label>
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                </div>
                <div className="field">
                  <label>Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="field">
                  <label>Price (USD)</label>
                  <input type="number" step="0.01" min="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="field">
                  <label>Stock quantity</label>
                  <input type="number" step="1" min="0" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} />
                </div>
              </div>
              <div className="field" style={{ marginTop: 14 }}>
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Save changes" : "Add product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
