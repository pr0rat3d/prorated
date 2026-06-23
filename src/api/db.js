// src/api/db.js — frontend DB helper
// All calls go through /api/db — no keys in the browser

const call = async (path, method = "GET", body, params, adminOp = false) => {
  const headers = { "Content-Type": "application/json" };

  // For admin write ops — pass admin token for service key elevation (8hr expiry)
  if (adminOp) {
    try {
      const token = sessionStorage.getItem("pr_admin_auth");
      if (token) {
        const decoded  = atob(token);
        const colonIdx = decoded.indexOf(":");
        const pw = decoded.slice(0, colonIdx);
        const ts = parseInt(decoded.slice(colonIdx + 1), 10);
        if (Date.now() - ts < 8 * 60 * 60 * 1000) {
          headers["x-admin-op"] = pw;
        }
      }
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
export const adminPost   = (path, body)         => call(path, "POST",   body, null,   true);
export const adminPatch  = (path, body, params) => call(path, "PATCH",  body, params, true);
export const adminDelete = (path, params)       => call(path, "DELETE", null, params, true);

export default call;
