// api/db.js — Supabase proxy
// All Supabase calls go through here so keys never hit the frontend

import { rateLimit, getIP } from "./_rateLimit.js";

export default async function handler(req, res) {
  // Rate limit — 120 requests per minute per IP
  const ip = getIP(req);
  const rl = rateLimit(ip, { max: 120, windowMs: 60000 });
  if (!rl.allowed) {
    return res.status(429).json({ error: "Too many requests", retryAfter: rl.retryAfter });
  }

  // Only allow from your own domain
  const origin = req.headers.origin || "";
  const allowed = ["https://prorated.app", "https://www.prorated.app"];
  if (process.env.NODE_ENV !== "development" && !allowed.includes(origin)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { path, method = "GET", body, params } = req.body || {};
  if (!path) return res.status(400).json({ error: "Missing path" });

  // Input validation — block suspicious patterns
  const pathStr = String(path);
  const suspiciousPatterns = [
    /\.\./,           // path traversal
    /;/,              // SQL injection attempt
    /--/,             // SQL comment
    /\/auth\/admin/,  // block direct auth admin access
    /\/pg_/,          // block postgres system tables
  ];
  if (suspiciousPatterns.some(p => p.test(pathStr))) {
    return res.status(400).json({ error: "Invalid request" });
  }

  // Only allow whitelisted tables
  const allowedTables = [
    "reviews", "contractors", "realtor_subscriptions", "realtor_lookups",
    "beta_feedback", "nda_signatures", "reported_reviews", "push_subscriptions",
    "translation_cache", "saved_addresses", "address_watches",
    "featured_suppliers", "review_edit_requests",
    "companies", "company_members", "invites", "review_points",
  ];
  const tableMatch = pathStr.match(/^\/([a-z_]+)/);
  if (!tableMatch || !allowedTables.includes(tableMatch[1])) {
    return res.status(403).json({ error: "Table not allowed" });
  }

  // Build query string
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const url = `${process.env.SUPABASE_URL}/rest/v1${path}${qs}`;

  const headers = {
    "apikey":        process.env.SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
    "Content-Type":  "application/json",
    "Prefer":        "return=representation",
  };

  // Use service key for admin operations (reads and writes)
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (req.headers["x-admin-op"] === process.env.ADMIN_PASSWORD && serviceKey) {
    headers["Authorization"] = `Bearer ${serviceKey}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: method !== "GET" && body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
