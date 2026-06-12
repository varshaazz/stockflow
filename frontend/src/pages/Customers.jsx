import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../api/client.js";
import { Banner, LoadingRows, EmptyState } from "../components/bits.jsx";

const emptyForm = { full_name: "", email: "", phone: "", address: "" };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
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
      setCustomers(await api.get("/api/customers"));
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
    if (!q) return customers;
    return customers.filter(
      (c) => c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [customers, search]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(c) {
    setEditingId(c.id);
    setForm({ full_name: c.full_name, email: c.email, phone: c.phone || "", address: c.address || "" });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!form.full_name.trim() || !form.email.trim()) {
      setFormError("Name and email are required.");
      return;
    }

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    };

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/api/customers/${editingId}`, payload);
      } else {
        await api.post("/api/customers", payload);
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Could not save customer.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c) {
    if (!confirm(`Remove ${c.full_name} from customers?`)) return;
    try {
      await api.del(`/api/customers/${c.id}`);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <div className="topline">
        <div>
          <h1>Customers</h1>
          <p>Everyone who has (or might) place an order.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New customer</button>
      </div>

      {error && <Banner kind="error">{error}</Banner>}

      <div className="card">
        <div className="card-pad section-head">
          <input
            className="search-box"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="muted mono">{filtered.length} of {customers.length}</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th></th>
              </tr>
            </thead>
            {loading ? (
              <LoadingRows count={5} />
            ) : (
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>{c.full_name}</td>
                    <td className="mono">{c.email}</td>
                    <td>{c.phone || <span className="muted">—</span>}</td>
                    <td className="muted" style={{ maxWidth: 260 }}>{c.address || "—"}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {!loading && filtered.length === 0 && (
          <EmptyState title="No customers yet" body="Add someone to start placing orders for them." />
        )}
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? "Edit customer" : "New customer"}</h2>
            {formError && <Banner kind="error">{formError}</Banner>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="field">
                  <label>Full name</label>
                  <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="field" style={{ marginTop: 14 }}>
                <label>Address</label>
                <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Save changes" : "Add customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
