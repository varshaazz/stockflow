export function Banner({ kind = "error", children }) {
  return <div className={`banner banner-${kind}`}>{children}</div>;
}

export function LoadingRows({ count = 4 }) {
  return (
    <tbody>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i}>
          <td colSpan={99}>
            <div className="skeleton" style={{ height: 18, width: "100%" }} />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

export function EmptyState({ title, body }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

export function StatusTag({ status }) {
  const cls = status === "completed" ? "tag-completed" : status === "cancelled" ? "tag-cancelled" : "tag-pending";
  return <span className={`tag ${cls}`}>{status}</span>;
}

export function StockTag({ qty }) {
  return qty > 0 ? (
    <span className="tag tag-ok">{qty} in stock</span>
  ) : (
    <span className="tag tag-low">out of stock</span>
  );
}
