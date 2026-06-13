// api/_rateLimit.js — simple in-memory rate limiter
// Resets per Vercel function instance (good enough for serverless)

const requests = new Map();

export function rateLimit(ip, options = {}) {
  const { max = 60, windowMs = 60000 } = options;
  const now = Date.now();
  const key = ip;

  if (!requests.has(key)) {
    requests.set(key, { count: 1, start: now });
    return { allowed: true, remaining: max - 1 };
  }

  const entry = requests.get(key);

  // Reset window if expired
  if (now - entry.start > windowMs) {
    requests.set(key, { count: 1, start: now });
    return { allowed: true, remaining: max - 1 };
  }

  // Increment
  entry.count++;

  if (entry.count > max) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.start + windowMs - now) / 1000) };
  }

  return { allowed: true, remaining: max - entry.count };
}

export function getIP(req) {
  return (
    req.headers['cf-connecting-ip'] ||       // Cloudflare
    req.headers['x-real-ip'] ||              // Nginx
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}
