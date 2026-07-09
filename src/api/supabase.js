import { buildWeightedScore, getReviewWeight } from "./ownershipDetection.js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
// ─────────────────────────────────────────────────────────────
// ProRated — Supabase Integration
// Replace the two constants below with your actual values from
// Supabase → Project Settings → API
// ─────────────────────────────────────────────────────────────




// ── Lightweight fetch wrapper (no SDK needed) ─────────────────
const sb = async (path, options = {}) => {
  // Use user session token when available so RLS policies see auth.uid() correctly
  let authToken = SUPABASE_ANON_KEY;
  try {
    const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
    if (session.access_token) authToken = session.access_token;
  } catch {}

  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${authToken}`,
      ...(options.prefer ? { "Prefer": options.prefer } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error: ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

// ── Normalize address for consistent lookup ───────────────────
export const normalizeAddress = (address) => {
  if (!address) return "";
  const abbrevMap = {
    " st ":" street ", " st,":" street,",
    " ave ":" avenue ", " ave,":" avenue,",
    " blvd ":" boulevard ", " blvd,":" boulevard,",
    " dr ":" drive ", " dr,":" drive,",
    " rd ":" road ", " rd,":" road,",
    " ln ":" lane ", " ln,":" lane,",
    " ct ":" court ", " ct,":" court,",
    " pl ":" place ", " pl,":" place,",
    " cir ":" circle ", " cir,":" circle,",
    " hwy ":" highway ", " hwy,":" highway,",
    " pkwy ":" parkway ", " pkwy,":" parkway,",
    " sq ":" square ", " sq,":" square,",
    " ter ":" terrace ", " ter,":" terrace,",
    " trl ":" trail ", " trl,":" trail,",
    " way ":" way ",
    " n ":" north ", " s ":" south ",
    " e ":" east ", " w ":" west ",
    " ne ":" northeast ", " nw ":" northwest ",
    " se ":" southeast ", " sw ":" southwest ",
  };

  let normalized = " " + address.toLowerCase().trim() + " ";
  normalized = normalized.replace(/\s+/g, " ");

  Object.entries(abbrevMap).forEach(([abbrev, full]) => {
    normalized = normalized.split(abbrev).join(full);
  });

  return normalized.trim();
};

// ── Fetch all reviews for an address ─────────────────────────
export const fetchReviewsForAddress = async (address) => {
  try {
    const normalized = normalizeAddress(address);
    const normalizedStreet = normalized.split(",")[0];
    const rawStreet = address.toLowerCase().trim().split(",")[0].trim();

    const fetchByStreet = (street) =>
      sb(
        `/reviews?address=ilike.${encodeURIComponent("%" + street + "%")}&order=created_at.desc&select=*`,
        { method: "GET" }
      ).then(d => d || []).catch(() => []);

    let rows;
    if (normalizedStreet === rawStreet) {
      rows = await fetchByStreet(normalizedStreet);
    } else {
      const [byNormalized, byRaw] = await Promise.all([
        fetchByStreet(normalizedStreet),
        fetchByStreet(rawStreet),
      ]);
      const seen = new Set();
      rows = [...byNormalized, ...byRaw].filter(r => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
    }

    if (!rows.length) return rows;

    // Fetch trust scores separately (reviews.user_id FK points to auth.users, not contractors)
    const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))];
    const trustMap = {};
    if (userIds.length) {
      const scores = await sb(
        `/contractors?id=in.(${userIds.join(",")})&select=id,trust_score`,
        { method: "GET" }
      ).catch(() => []);
      (scores || []).forEach(c => { trustMap[c.id] = c.trust_score; });
    }

    return rows.map(r => ({ ...r, contractors: { trust_score: trustMap[r.user_id] ?? null } }));
  } catch (err) {
    console.warn("[ProRated] Could not fetch reviews:", err.message);
    return [];
  }
};

// ── Save a new review ─────────────────────────────────────────
export const saveReview = async (formData) => {
  // Accept both naming conventions from ReviewPage
  const address    = formData.address;
  const street     = formData.street  || address?.split(",")[0]?.trim();
  const city       = formData.city    || address?.split(",")[1]?.trim();
  const state      = formData.state   || address?.split(",")[2]?.trim()?.split(" ")[0];
  const zip        = formData.zip     || address?.split(",")[2]?.trim()?.split(" ")[1];
  const trade      = formData.trade;
  const tags       = formData.tags   || [];
  const reviewText = formData.review_text || formData.text || "";
  const overall    = formData.overall_score ?? formData.overall ?? 0;

  // Accept flat scores OR nested ratings object
  const ratings = formData.ratings || {};
  const access        = formData.access        ?? ratings.access        ?? 0;
  const payment       = formData.payment       ?? ratings.payment       ?? 0;
  const timeline      = formData.timeline      ?? ratings.timeline      ?? 0;
  const communication = formData.communication ?? ratings.communication ?? 0;
  const obstacles     = formData.obstacles     ?? ratings.obstacles     ?? 0;

  const contractorName     = formData.contractor_name     || formData.contractorName     || "Anonymous";
  const contractorInitials = formData.contractor_initials || formData.contractorInitials || "PR";

  let sessionToken = SUPABASE_ANON_KEY;
  try {
    const s = JSON.parse(localStorage.getItem("prorated_session") || "{}");
    if (s.access_token) sessionToken = s.access_token;
  } catch {}

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reviews`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${sessionToken}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        address:             normalizeAddress(address),
        street, city, state, zip,
        user_id:             formData.userId || formData.user_id || null,
        contractor_name:     contractorName,
        contractor_initials: contractorInitials,
        trade,
        overall_score:       overall,
        access_score:        access,
        payment_score:       payment,
        timeline_score:      timeline,
        communication_score: communication,
        obstacles_score:     obstacles,
        tags:                Array.isArray(tags) ? tags : [],
        work_category:       formData.work_category  || null,
        work_item:           Array.isArray(formData.work_items) ? (formData.work_items[0] || null) : (formData.work_item || null),
        work_items:          Array.isArray(formData.work_items) ? formData.work_items : null,
        work_label:          formData.work_label      || null,
        property_type:       formData.property_type  || null,
        review_text:         reviewText,
        helpful_count:       0,
      }),
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const errText = await res.text().catch(() => res.status);
      console.error("[ProRated] saveReview HTTP error:", res.status, errText);
      throw new Error(`Save failed (${res.status}): ${errText}`);
    }
    return { success: true };
  } catch (err) {
    const msg = err.name === "AbortError"
      ? "Request timed out — please check your connection and try again."
      : err.message;
    console.error("[ProRated] saveReview failed:", msg);
    throw new Error(msg);
  }
};

// ── Update an existing review ─────────────────────────────────
export const updateReview = async (reviewId, formData) => {
  try {
    const { overall, ratings, tags, text: reviewText, workCategory, workItems, workLabel } = formData;
    await sb(`/reviews?id=eq.${reviewId}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: JSON.stringify({
        overall_score:       overall,
        access_score:        ratings.access,
        payment_score:       ratings.payment,
        timeline_score:      ratings.timeline,
        communication_score: ratings.communication,
        obstacles_score:     ratings.obstacles,
        tags,
        review_text:         reviewText,
        work_category:       workCategory || null,
        work_item:           Array.isArray(workItems) ? (workItems[0] || null) : null,
        work_items:          Array.isArray(workItems) ? workItems : null,
        work_label:          workLabel || null,
        updated_at:          new Date().toISOString(),
      }),
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ── Fetch reviews by user ──────────────────────────────────────
export const fetchMyReviews = async (userId) => {
  try {
    // Fall back to session user if no userId passed
    const id = userId || (() => {
      try { return JSON.parse(localStorage.getItem("prorated_session") || "{}").user?.id; } catch { return null; }
    })();
    if (!id) return [];
    const data = await sb(
      `/reviews?user_id=eq.${id}&order=created_at.desc`,
      { method: "GET" }
    );
    return data || [];
  } catch { return []; }
};

// ── Increment helpful count (deduped via helpful_votes) ───────
export const incrementHelpful = async (reviewId) => {
  let userId = null;
  try {
    const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
    userId = session.user?.id;
  } catch {}
  if (!userId) return;

  // Insert vote — UNIQUE(review_id, voter_id) rejects double votes
  try {
    await sb("/helpful_votes", {
      method: "POST",
      prefer: "return=minimal",
      body: JSON.stringify({ review_id: reviewId, voter_id: userId }),
    });
  } catch {
    return; // Already voted or unauthenticated — do not increment
  }

  // Vote was new — increment count
  try {
    const rows = await sb(`/reviews?id=eq.${reviewId}&select=helpful_count`);
    if (!rows?.length) return;
    await sb(`/reviews?id=eq.${reviewId}`, {
      method: "PATCH",
      body: JSON.stringify({ helpful_count: (rows[0].helpful_count || 0) + 1 }),
    });
  } catch (err) {
    console.warn("[ProRated] Could not update helpful count:", err.message);
  }
};

// ── Format a Supabase row into the shape the app expects ──────
export const formatStoredReview = (row) => ({
  id:                  row.id,
  contractorName:      row.contractor_name,
  contractorInitials:  row.contractor_initials,
  trade:               row.trade,
  date:                row.created_at?.split("T")[0],
  created_at:          row.created_at,
  overallScore:        row.overall_score,
  tags:                row.tags || [],
  text:                row.review_text,
  helpfulCount:        row.helpful_count || 0,
  reviewerTrustScore:  row.contractors?.trust_score ?? null,
  // Bid Intelligence needs the raw per-category scores + trust score on each review
  payment_score:       row.payment_score,
  access_score:        row.access_score,
  timeline_score:      row.timeline_score,
  communication_score: row.communication_score,
  obstacles_score:     row.obstacles_score,
  reviewer_trust_score: row.contractors?.trust_score ?? 0,
  weight:              getReviewWeight(row.created_at),
  fromDatabase:        true,
});

// ── Build address ratings from stored reviews ─────────────────
export const buildRatingsFromReviews = (reviews) => {
  if (!reviews.length) return null;
  const avg = (key) =>
    reviews.reduce((sum, r) => sum + (r[key] || 0), 0) / reviews.length;

  return {
    access:        parseFloat(avg("access_score").toFixed(1)),
    payment:       parseFloat(avg("payment_score").toFixed(1)),
    timeline:      parseFloat(avg("timeline_score").toFixed(1)),
    communication: parseFloat(avg("communication_score").toFixed(1)),
    obstacles:     parseFloat(avg("obstacles_score").toFixed(1)),
  };
};

// ── Build a full address result from stored reviews ───────────
export const buildAddressFromReviews = (address, storedRows) => {
  const reviews = storedRows.map(formatStoredReview);

  // Use age-weighted scoring — older reviews count less
  const weighted = buildWeightedScore(storedRows);
  const ratings = weighted ? {
    access:        weighted.access,
    payment:       weighted.payment,
    timeline:      weighted.timeline,
    communication: weighted.communication,
    obstacles:     weighted.obstacles,
  } : buildRatingsFromReviews(storedRows);

  const overallScore = weighted?.overall ||
    parseFloat((storedRows.reduce((a, b) => a + (b.overall_score || 0), 0) / storedRows.length).toFixed(1));

  // Collect most common tags
  const tagCounts = {};
  storedRows.forEach(r => (r.tags || []).forEach(t => {
    tagCounts[t] = (tagCounts[t] || 0) + 1;
  }));
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);

  const first = storedRows[0];
  return {
    street:      first.street || address.split(",")[0]?.trim(),
    city:        first.city   || address.split(",")[1]?.trim(),
    state:       first.state  || "AL",
    zip:         first.zip    || "",
    overallScore,
    reviewCount: reviews.length,
    ratings,
    tags:        topTags,
    reviews,
    fromDatabase: true,
  };
};

// ── Existence-only check for unauthenticated search ────────────
// Calls a SECURITY DEFINER RPC that returns just a boolean — never
// row content — so the anon key can't be used to pull review text,
// tags, or reviewer identity for an address.
export const checkAddressHasReviews = async (address) => {
  try {
    return await sb("/rpc/address_has_reviews", {
      method: "POST",
      body: JSON.stringify({ p_address: address }),
    });
  } catch {
    return false;
  }
};

// ── Minimal address shell for unauthenticated search results ──
// No scores, tags, or review content — just enough for the guest
// AddressCard view (address confirmation + Street View + lock card).
export const buildAddressPreview = (address) => ({
  street: address.split(",")[0]?.trim(),
  city:   address.split(",")[1]?.trim(),
  state:  address.split(",")[2]?.trim()?.split(" ")[0] || "AL",
  zip:    address.split(",")[2]?.trim()?.split(" ")[1] || "",
});

// ── Delete review ─────────────────────────────────────────────
export const deleteReview = async (reviewId) => {
  try {
    // Use same token resolution as saveReview — check Supabase auth key first
    let authToken = SUPABASE_ANON_KEY;
    let userId = null;
    try {
      const storageKey = Object.keys(localStorage).find(k => k.includes("auth-token") || k.includes("supabase.auth"));
      if (storageKey) {
        const stored = JSON.parse(localStorage.getItem(storageKey));
        const token = stored?.access_token || stored?.currentSession?.access_token;
        if (token) authToken = token;
      }
      // Also try prorated_session
      const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
      if (session.access_token) authToken = session.access_token;
      userId = session.user?.id;
    } catch {}

    if (!userId) return false;

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/reviews?id=eq.${reviewId}&user_id=eq.${userId}`,
      {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${authToken}`,
          Prefer: "return=minimal",
        },
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn("[ProRated] deleteReview failed:", res.status, body);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[ProRated] deleteReview error:", err);
    return false;
  }
};
