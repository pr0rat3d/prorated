import { rateLimit, getIP } from "./_rateLimit.js";
// ─────────────────────────────────────────────────────────────
// ProRated — Vercel Serverless Proxy for Translations
// Keeps API key server-side, adds rate limiting
// ─────────────────────────────────────────────────────────────

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX    = 30; // translations allowed per IP per minute
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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")    return res.status(405).json({ error: "Method not allowed" });

  const ip    = req.headers["x-forwarded-for"]?.split(",")[0] || "unknown";
  const count = getRateLimit(ip);
  if (count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: "Too many translation requests" });
  }

  const { text, targetLang } = req.body || {};
  if (!text || !targetLang) {
    return res.status(400).json({ error: "Missing text or targetLang" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Server configuration error" });

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
        max_tokens: 500,
        system:     "You are a translation API for a contractor job site rating app. Translate the given text to the target language. Return ONLY the translated text — no quotes, no explanations. Keep contractor-specific terms natural. Preserve numbers and addresses as-is.",
        messages:   [{ role: "user", content: `Translate to ${targetLang === "es" ? "Spanish" : targetLang}:\n\n${text}` }],
      }),
    });

    const data = await response.json();
    const translated = data.content?.[0]?.text?.trim();
    if (!translated) throw new Error("No translation returned");
    return res.status(200).json({ translated });

  } catch (err) {
    console.error("[ProRated] Translation proxy error:", err.message);
    return res.status(500).json({ error: "Translation failed", original: text });
  }
}
