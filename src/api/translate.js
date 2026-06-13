import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
// ─────────────────────────────────────────────────────────────
// ProRated — Translation Service
// 3-layer caching: Supabase → localStorage → Session memory
// Translates dynamic content (reviews, AI data) via Claude API
// Cost: ~$0.0008 per review, cached forever after first translation
// ─────────────────────────────────────────────────────────────


 // Supabase cache only

// ── Layer 1: Session memory cache (fastest, lives in RAM) ─────
const sessionCache = new Map();

// ── Layer 2: localStorage cache (survives page refresh) ───────
const LS_PREFIX = "pr_trans_";
const MAX_LS_ENTRIES = 200; // prevent localStorage from getting too large

const lsGet = (key) => {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const lsSet = (key, value) => {
  try {
    // Prune oldest entries if we're hitting the limit
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX));
    if (allKeys.length >= MAX_LS_ENTRIES) {
      allKeys.slice(0, 20).forEach(k => localStorage.removeItem(k));
    }
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch {}
};

// ── Layer 3: Supabase cache (shared across ALL users) ─────────
const sbGet = async (hash) => {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/translation_cache?hash=eq.${hash}&select=translated_text`,
      { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const rows = await res.json();
    return rows?.[0]?.translated_text || null;
  } catch { return null; }
};

const sbSet = async (hash, originalText, translatedText, lang) => {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/translation_cache`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=minimal,resolution=ignore-duplicates",
      },
      body: JSON.stringify({ hash, original_text: originalText, translated_text: translatedText, lang }),
    });
  } catch {}
};

// ── Simple hash function for cache keys ───────────────────────
const hashText = (text, lang) => {
  let h = 0;
  const str = `${lang}:${text}`;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return `${lang}_${Math.abs(h).toString(36)}`;
};

// ── Rate limiting (max 20 API calls per session) ──────────────
let sessionApiCalls = 0;
const MAX_API_CALLS = 20;

// ── Core translate function ───────────────────────────────────
export const translateText = async (text, targetLang) => {
  if (!text || !text.trim()) return text;
  if (targetLang === "en") return text; // No translation needed

  const hash = hashText(text, targetLang);

  // Layer 1: Session memory (instant)
  if (sessionCache.has(hash)) return sessionCache.get(hash);

  // Layer 2: localStorage (fast, no network)
  const cached = lsGet(hash);
  if (cached) {
    sessionCache.set(hash, cached);
    return cached;
  }

  // Layer 3: Supabase (shared cache — if someone else already translated this)
  const sbCached = await sbGet(hash);
  if (sbCached) {
    sessionCache.set(hash, sbCached);
    lsSet(hash, sbCached);
    return sbCached;
  }

  // Rate limit check
  if (sessionApiCalls >= MAX_API_CALLS) {
    console.warn("[ProRated] Translation rate limit reached for this session");
    return text; // Fall back to original
  }

  // Call our Vercel proxy (keeps API key server-side)
  try {
    sessionApiCalls++;
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLang }),
    });

    const data = await response.json();
    const translated = data.translated;

    if (translated) {
      // Store in all 3 cache layers
      sessionCache.set(hash, translated);
      lsSet(hash, translated);
      sbSet(hash, text, translated, targetLang); // fire and forget
      return translated;
    }
  } catch (err) {
    console.warn("[ProRated] Translation failed:", err.message);
  }

  return text; // Fall back to original on any error
};

// ── Translate multiple texts in parallel ─────────────────────
export const translateBatch = async (texts, targetLang) => {
  if (targetLang === "en") return texts;
  return Promise.all(texts.map(t => translateText(t, targetLang)));
};

// ── Translate a full review object ───────────────────────────
export const translateReview = async (review, lang) => {
  if (lang === "en" || !review.text) return review;
  const translatedText = await translateText(review.text, lang);
  return { ...review, text: translatedText, originalText: review.text };
};

// ── Translate all reviews for an address ─────────────────────
export const translateReviews = async (reviews, lang) => {
  if (lang === "en") return reviews;
  return Promise.all(reviews.map(r => translateReview(r, lang)));
};

// ── Translate address summary data ───────────────────────────
export const translateAddressData = async (addressData, lang) => {
  if (lang === "en" || !addressData) return addressData;

  // Translate reviews in parallel
  const translatedReviews = await translateReviews(addressData.reviews || [], lang);

  return {
    ...addressData,
    reviews: translatedReviews,
  };
};

// ── Cache stats (for debugging) ───────────────────────────────
export const getCacheStats = () => ({
  sessionEntries: sessionCache.size,
  localStorageEntries: Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX)).length,
  apiCallsThisSession: sessionApiCalls,
  apiCallsRemaining: MAX_API_CALLS - sessionApiCalls,
});
