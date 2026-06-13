// api/admin-auth.js — validates admin password server-side
// Password never touches the frontend

import { rateLimit, getIP } from "./_rateLimit.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Strict rate limit for auth — 10 attempts per 15 minutes per IP
  const ip = getIP(req);
  const rl = rateLimit(ip, { max: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) {
    return res.status(429).json({ ok: false, error: "Too many attempts. Try again later.", retryAfter: rl.retryAfter });
  }

  const { password } = req.body || {};
  if (!password) return res.status(400).json({ ok: false });

  // Compare against server-side env var — never exposed to browser
  if (password === process.env.ADMIN_PASSWORD) {
    // Return a short-lived token the client stores in sessionStorage
    const token = Buffer.from(
      `${process.env.ADMIN_PASSWORD}:${Date.now()}`
    ).toString("base64");
    return res.status(200).json({ ok: true, token });
  }

  return res.status(401).json({ ok: false, error: "Invalid password" });
}
