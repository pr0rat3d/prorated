import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
// ─────────────────────────────────────────────────────────────
// ProRated — Lookup Counter
// Tracks and enforces monthly address lookup limits
// Free: FREE_MONTHLY_LOOKUPS per month
// Pro:  Unlimited
// ─────────────────────────────────────────────────────────────

import { FREE_MONTHLY_LOOKUPS } from "../data/constants";
import { loadSession } from "./auth";




const currentMonthYear = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// ── Get how many lookups user has done this month ─────────────
export const getMonthlyLookupCount = async (userId) => {
  if (!userId) return 0;
  try {
    const month = currentMonthYear();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/lookup_log?user_id=eq.${userId}&month_year=eq.${month}&select=id`,
      {
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    const rows = await res.json();
    return Array.isArray(rows) ? rows.length : 0;
  } catch { return 0; }
};

// ── Log a lookup ──────────────────────────────────────────────
export const logLookup = async (userId, address) => {
  if (!userId) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/lookup_log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ user_id: userId, address }),
    });
  } catch {}
};

// ── Check if user can do a lookup (main enforcement function) ─
export const canDoLookup = async () => {
  const session = loadSession();

  // Not logged in — allow but don't track (encourage signup)
  if (!session?.user) return { allowed: true, reason: "guest", remaining: null };

  const user = session.user;

  // Pro users have unlimited lookups
  if (user.plan === "pro") return { allowed: true, reason: "pro", remaining: null };

  // Demo account — unlimited
  // Demo bypass — remove before public launch
  if (user.email === "demo@prorated.io" || user.email === "demo@prorated.app") return { allowed: true, reason: "demo", remaining: null };

  // Check monthly count
  const count     = await getMonthlyLookupCount(user.id);
  const remaining = FREE_MONTHLY_LOOKUPS - count;

  if (remaining <= 0) {
    return { allowed: false, reason: "limit_reached", remaining: 0, count, limit: FREE_MONTHLY_LOOKUPS };
  }

  return { allowed: true, reason: "free", remaining, count, limit: FREE_MONTHLY_LOOKUPS };
};

// ── Get remaining lookups for display ────────────────────────
export const getRemainingLookups = async () => {
  const session = loadSession();
  if (!session?.user) return null;
  if (session.user.plan === "pro") return null; // unlimited
  const count = await getMonthlyLookupCount(session.user.id);
  return Math.max(0, FREE_MONTHLY_LOOKUPS - count);
};
