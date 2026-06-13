import { rateLimit, getIP } from "./_rateLimit.js";
// ─────────────────────────────────────────────────────────────
// ProRated — Vercel Serverless Proxy for Anthropic API
// This keeps your API key server-side so it's never exposed
// in the browser. Set ANTHROPIC_API_KEY in Vercel env vars.
// ─────────────────────────────────────────────────────────────

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX    = 10;         // max requests per IP per minute
const ipCounts          = new Map();

function getRateLimit(ip) {
  const now  = Date.now();
  const data = ipCounts.get(ip) || { count: 0, window: now };
  if (now - data.window > RATE_LIMIT_WINDOW) {
    data.count = 0; data.window = now;
  }
  data.count++;
  ipCounts.set(ip, data);
  return data.count;
}

export default async function handler(req, res) {
  const ip = getIP(req);
  const rl = rateLimit(ip, { max: 60, windowMs: 60000 });
  if (!rl.allowed) return res.status(429).json({ error: "Too many requests" });
  // CORS — allow only your Vercel domain
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")    return res.status(405).json({ error: "Method not allowed" });

  // Rate limiting by IP
  const ip    = req.headers["x-forwarded-for"]?.split(",")[0] || "unknown";
  const count = getRateLimit(ip);
  if (count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: "Too many requests. Please slow down." });
  }

  // Validate request body
  const { messages, system, max_tokens } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  // API key from Vercel environment (never exposed to browser)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[ProRated] ANTHROPIC_API_KEY not set in Vercel env vars");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-20250514",
        max_tokens: max_tokens || 1000,
        system,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[ProRated] Anthropic API error:", err);
      return res.status(response.status).json({ error: "AI service error" });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error("[ProRated] Proxy error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}
// Note: Set spending limits at console.anthropic.com → Billing → Usage limits
// Recommended: $50/month hard cap to start
