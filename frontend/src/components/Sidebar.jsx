import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", tag: "00" },
  { to: "/products", label: "Products", tag: "01" },
  { to: "/customers", label: "Customers", tag: "02" },
  { to: "/orders", label: "Orders", tag: "03" },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar__brand">
          <span>Stockflow</span>
        </div>
        <small style={{ marginLeft: 8, fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.18em", color: "#9aa6a3", textTransform: "uppercase" }}>
          Warehouse Ledger
        </small>

        <nav className="sidebar__nav">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) => `sidebar__link ${isActive ? "active" : ""}`}
              onClick={onClose}
            >
              <span className="tag">{l.tag}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          Stock levels update automatically when orders are placed or cancelled.
        </div>
      </aside>
      {open && <div className="scrim" onClick={onClose} />}
    </>
  );
}
