import { rateLimit, getIP } from "./_rateLimit.js";
// Vercel serverless function — proxies Google Places API calls
// Keeps API key server-side, avoids CORS issues

export default async function handler(req, res) {
  const ip = getIP(req);
  const rl = rateLimit(ip, { max: 60, windowMs: 60000 });
  if (!rl.allowed) return res.status(429).json({ error: "Too many requests" });
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const GOOGLE_KEY = process.env.GOOGLE_MAPS_KEY
    || process.env.VITE_GOOGLE_MAPS_KEY
    || process.env.REACT_APP_GOOGLE_MAPS_KEY;

  if (!GOOGLE_KEY) {
    console.error("[places] No Google Maps key found in env");
    return res.status(500).json({ error: "API key not configured", results: [] });
  }

  const { endpoint, ...params } = req.query;

  const BASE = "https://maps.googleapis.com/maps/api";
  let url;

  if (endpoint === "geocode") {
    url = `${BASE}/geocode/json?address=${encodeURIComponent(params.address)}&key=${GOOGLE_KEY}`;
  } else if (endpoint === "nearby") {
    url = `${BASE}/place/nearbysearch/json?location=${params.location}&radius=${params.radius || "16093"}&keyword=${encodeURIComponent(params.keyword)}&type=establishment&key=${GOOGLE_KEY}`;
  } else {
    return res.status(400).json({ error: "Invalid endpoint" });
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Places API error", message: err.message });
  }
}
