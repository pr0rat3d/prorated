// src/api/ownershipDetection.js
// Phase 1: Free ownership change detection
// Uses age-weighted scoring, Zillow/property data, and community flags

// ── Age-weighted scoring ──────────────────────────────────────
// Reviews decay in weight over time — older reviews matter less
// Full weight within 12 months, decays to 20% at 48+ months
export const getReviewWeight = (createdAt) => {
  const ageMonths = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (ageMonths <= 12) return 1.0;
  if (ageMonths <= 24) return 0.75;
  if (ageMonths <= 36) return 0.5;
  if (ageMonths <= 48) return 0.35;
  return 0.2;
};

// ── Weighted score calculation ────────────────────────────────
export const buildWeightedScore = (reviews) => {
  if (!reviews.length) return null;

  const weighted = (key) => {
    let totalWeight = 0;
    let totalScore  = 0;
    reviews.forEach(r => {
      const weight = getReviewWeight(r.created_at || r.date);
      totalWeight += weight;
      totalScore  += (r[key] || r.overallScore || 0) * weight;
    });
    return totalWeight > 0 ? parseFloat((totalScore / totalWeight).toFixed(1)) : 0;
  };

  return {
    overall:       weighted("overall_score"),
    payment:       weighted("payment_score"),
    access:        weighted("access_score"),
    communication: weighted("communication_score"),
    timeline:      weighted("timeline_score"),
    obstacles:     weighted("obstacles_score"),
  };
};

// ── Check for ownership flags in Supabase ────────────────────
const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL || "https://wsdrbdojnzmtwndswpwr.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const getOwnershipFlags = async (address) => {
  try {
    const encoded = encodeURIComponent("%" + address.split(",")[0].trim() + "%");
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/ownership_flags?address=ilike.${encoded}&select=*&order=created_at.desc`,
      { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
};

export const submitOwnershipFlag = async (address, userId, notes = "") => {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/ownership_flags`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        address,
        user_id: userId || null,
        notes,
        created_at: new Date().toISOString(),
      }),
    });
    return true;
  } catch { return false; }
};

// ── Determine if a sale warning should show ──────────────────
// Based on: community flags + review age patterns
export const getSaleWarning = (reviews, ownershipFlags) => {
  if (!reviews.length) return null;

  const now = Date.now();
  const flagCount = ownershipFlags.length;

  // Most recent review date
  const mostRecent = reviews.reduce((latest, r) => {
    const d = new Date(r.created_at || r.date || 0).getTime();
    return d > latest ? d : latest;
  }, 0);
  const monthsSinceReview = (now - mostRecent) / (1000 * 60 * 60 * 24 * 30);

  // Oldest review date
  const oldest = reviews.reduce((earliest, r) => {
    const d = new Date(r.created_at || r.date || 0).getTime();
    return d < earliest ? d : earliest;
  }, now);
  const reviewSpanMonths = (now - oldest) / (1000 * 60 * 60 * 24 * 30);

  // Warning conditions
  if (flagCount >= 2) {
    return {
      level: "high",
      message: `${flagCount} contractors have flagged a possible ownership change at this address. Older reviews may reflect a previous owner.`,
      icon: "🏠",
    };
  }

  if (flagCount === 1) {
    return {
      level: "medium",
      message: "1 contractor has flagged a possible ownership change. Verify current ownership before bidding.",
      icon: "⚠️",
    };
  }

  if (monthsSinceReview > 36 && reviewSpanMonths > 12) {
    return {
      level: "low",
      message: `Most recent review is ${Math.round(monthsSinceReview)} months old. Ownership may have changed since these reviews were submitted.`,
      icon: "📅",
    };
  }

  return null;
};

// ── Stale review age label ─────────────────────────────────────
export const getAgeLabel = (createdAt) => {
  const months = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (months < 1)  return "This month";
  if (months < 12) return `${Math.round(months)}mo ago`;
  const years = months / 12;
  return years < 2 ? "1 year ago" : `${Math.round(years)} years ago`;
};

export const isStaleReview = (createdAt) => {
  const months = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
  return months > 24;
};
