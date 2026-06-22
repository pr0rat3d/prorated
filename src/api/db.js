// src/api/db.js — frontend DB helper
// All calls go through /api/db — no keys in the browser

const call = async (path, method = "GET", body, params, adminOp = false) => {
  const headers = { "Content-Type": "application/json" };

  // For admin write ops — pass admin token for service key elevation
  if (adminOp) {
    try {
      const token = sessionStorage.getItem("pr_admin_auth");
      if (token) headers["x-admin-op"] = atob(token).split(":")[0];
    } catch {}
  }

  const res = await fetch("/api/db", {
    method: "POST",
    headers,
    body: JSON.stringify({ path, method, body, params }),
  });

  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.error || data?.message) ? [] : data;
};

// Convenience methods
export const dbGet    = (path, params)       => call(path, "GET",    null, params);
export const dbPost   = (path, body)         => call(path, "POST",   body);
export const dbPatch  = (path, body, params) => call(path, "PATCH",  body, params);
export const dbDelete = (path, params)       => call(path, "DELETE", null, params);

// Admin-elevated versions
export const adminPatch  = (path, body, params) => call(path, "PATCH",  body, params, true);
export const adminDelete = (path, params)       => call(path, "DELETE", null, params, true);

export default call;
