import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
// ─────────────────────────────────────────────────────────────
// ProRated — 2FA (TOTP) via Supabase's raw Auth REST API
// No supabase-js dependency, matching this codebase's hand-rolled
// auth.js style. Live-verified end to end 2026-08-11 against the
// demo account (enroll -> challenge -> verify -> aal2 -> unenroll).
// ─────────────────────────────────────────────────────────────

const authFetch = async (path, token, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.msg || data.message || "2FA request failed");
  return data;
};

// ── Decode the aal (authenticator assurance level) claim from a JWT ────
// "aal1" = password only. "aal2" = password + a verified second factor.
export const decodeAal = (accessToken) => {
  try {
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    return payload.aal || "aal1";
  } catch {
    return "aal1";
  }
};

// ── Start enrollment — returns { id, totp: { qr_code, secret, uri } } ──
// qr_code is a raw SVG string (~320KB, one <rect> per module — normal for
// Supabase's generator). Render via dangerouslySetInnerHTML. secret is the
// base32 fallback for manual entry if QR scanning isn't available.
export const enrollTotp = async (accessToken, friendlyName = "Authenticator app") =>
  authFetch("/factors", accessToken, {
    method: "POST",
    body: JSON.stringify({ factor_type: "totp", friendly_name: friendlyName }),
  });

// ── Request a challenge for a factor (needed before every verify call) ──
export const challengeFactor = async (accessToken, factorId) =>
  authFetch(`/factors/${factorId}/challenge`, accessToken, { method: "POST" });

// ── Verify a 6-digit code against an open challenge. On success this
// returns a COMPLETE new session (access_token/refresh_token/user),
// already elevated to aal2 — not a bare confirmation. ───────────────
export const verifyFactor = async (accessToken, factorId, challengeId, code) =>
  authFetch(`/factors/${factorId}/verify`, accessToken, {
    method: "POST",
    body: JSON.stringify({ challenge_id: challengeId, code }),
  });

// ── Get the current user's own factors (for a Dashboard settings screen
// checking "do I already have 2FA enabled") — GET /auth/v1/user returns a
// `factors` array once at least one exists (absent entirely at zero). ──
export const getOwnFactors = async (accessToken) => {
  const data = await authFetch("/user", accessToken, { method: "GET" });
  return data.factors || [];
};

// ── Remove a factor (disable 2FA, or admin recovery for a lost device) ──
export const unenrollFactor = async (accessToken, factorId) =>
  authFetch(`/factors/${factorId}`, accessToken, { method: "DELETE" });

// ── Convenience: enroll + immediately walk a code through challenge+verify
// in one call, for the Dashboard settings enrollment screen. ───────────
export const confirmEnrollment = async (accessToken, factorId, code) => {
  const challenge = await challengeFactor(accessToken, factorId);
  return verifyFactor(accessToken, factorId, challenge.id, code);
};
