// Small fetch wrapper - keeps all the JSON/error handling boilerplate in one spot
// so the page components can just call api.get(...) etc and not think about it.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 204) return null;

  let body = null;
  try {
    body = await res.json();
  } catch {
    // no body, fine for some responses
  }

  if (!res.ok) {
    const detail = body?.detail;
    let message = "Something went wrong";
    if (typeof detail === "string") message = detail;
    else if (detail?.message) message = detail.message;

    throw new ApiError(message, res.status, detail);
  }

  return body;
}

export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: "POST", body: JSON.stringify(data) }),
  put: (path, data) => request(path, { method: "PUT", body: JSON.stringify(data) }),
  patch: (path, data) => request(path, { method: "PATCH", body: JSON.stringify(data) }),
  del: (path) => request(path, { method: "DELETE" }),
};

export { ApiError };
