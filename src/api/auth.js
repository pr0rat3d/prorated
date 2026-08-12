import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { challengeFactor, verifyFactor } from "./mfa.js";
// ─────────────────────────────────────────────────────────────
// ProRated — Supabase Auth
// Handles trade professional signup, login, logout and session management
// ─────────────────────────────────────────────────────────────



const authFetch = async (path, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "Auth error");
  return data;
};

const dbFetch = async (path, options = {}, token = null) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${token || SUPABASE_ANON_KEY}`,
      "Prefer": options.prefer || "",
      ...options.headers,
    },
  });
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

// ── Session storage ───────────────────────────────────────────
const SESSION_KEY = "prorated_session";

export const saveSession = (session) => {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
};

export const loadSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    // An expired access_token alone isn't a dead session — it's refreshable
    // via refresh_token, and the Supabase project has session inactivity
    // timeout disabled, so there's no policy reason to force a logout here.
    // Only give up when there's nothing left to refresh with.
    if (session.expires_at && Date.now() / 1000 > session.expires_at && !session.refresh_token) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch { return null; }
};

export const clearSession = () => {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
};

// ── Sign up a new contractor ──────────────────────────────────
export const signUp = async ({ email, password, name, company_name = null, trade, state, license, phone = null, accountType = "solo", plan = "free", promoCode = null, status = "pending", proSource = null }) => {
  const data = await authFetch("/signup", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      data: { name, trade, state, license, account_type: accountType, plan },
    }),
  });

  if (data.access_token) {
    saveSession({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_at:    data.expires_at,
      user: { ...data.user, name, company_name, trade, state, license, phone, account_type: accountType, plan },
    });

    await saveContractorProfile({
      id:           data.user.id,
      email,
      name,
      company_name,
      trade,
      state,
      license,
      phone,
      plan,
      account_type: accountType,
      promo_code:   promoCode,
      pro_source:   proSource,
      status,
    }, data.access_token).catch(err => {
      console.error("[ProRated] saveContractorProfile failed:", err.message);
      throw new Error("Account created but profile setup failed. Please contact hello@prorated.app with your email to complete setup.");
    });
  }

  return data;
};

// ── Kill every other active session for this user (one login = one device) ──
const killOtherSessions = async (token) => {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/kill_other_sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
  } catch (err) {
    console.warn("[ProRated] kill_other_sessions failed:", err.message);
  }
};

// ── Save trade association memberships (+5 pt one-time completion bonus,
// awarded server-side by the RPC itself — never trust a client-claimed
// point value, since contractors.review_points has no column-level RLS
// restriction on UPDATE) ────────────────────────────────────────────
export const saveTradeMemberships = async (memberships) => {
  const session = loadSession();
  if (!session?.access_token) throw new Error("Not logged in");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/save_trade_memberships`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ p_memberships: memberships }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to save trade memberships${body ? ": " + body : ""}`);
  }
};

// ── Save watchlist email opt-in (default off — a saved address alone
// does not imply consent to be emailed) ────────────────────────────
export const saveWatchlistOptIn = async (optedIn) => {
  const session = loadSession();
  if (!session?.access_token) throw new Error("Not logged in");
  await dbFetch(
    `/contractors?id=eq.${session.user.id}`,
    { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ watchlist_email_opt_in: optedIn }) },
    session.access_token
  );
};

// ── Update the fields a contractor is allowed to self-edit ─────────────
// Email/trade/license are intentionally excluded — those tie into
// verification and account identity, not something to change from here.
export const updateProfile = async ({ name, company_name, phone }) => {
  const session = loadSession();
  if (!session?.access_token) throw new Error("Not logged in");
  await dbFetch(
    `/contractors?id=eq.${session.user.id}`,
    { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ name, company_name, phone }) },
    session.access_token
  );
};

// ── Check whether this device's session is still the active one ────────
// Fails OPEN (returns true) on any network/server error — only a confirmed
// "false" from the server should ever force a logout.
export const checkSessionActive = async () => {
  const session = loadSession();
  if (!session?.access_token) return true;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/session_still_active`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({}),
    });
    if (!res.ok) return true;
    return (await res.json()) === true;
  } catch {
    return true;
  }
};

// ── Fetch the caller's own row from contractor_private (stripe_customer_id,
// rejection_reason — the only two fields there a user legitimately reads for
// themselves; RLS scopes this to auth.uid() = id so it's own-row only) ──
export const fetchContractorPrivate = async (userId, token) => {
  try {
    const rows = await dbFetch(`/contractor_private?id=eq.${userId}&select=*&limit=1`, { method: "GET" }, token);
    return rows?.[0] || {};
  } catch { return {}; }
};

// ── Shared post-auth finalization — fetches the contractor profile and
// stores the real session. Used both by a normal (no 2FA) sign-in and by
// completeMfaLogin() once a 2FA code has been verified — the verify
// endpoint returns a complete new (aal2) session in the same shape as a
// plain password grant, so this is the single source of truth for turning
// "we have a token response" into "the user is actually logged in". ────
const finalizeLogin = async (data, fallbackEmail) => {
  await killOtherSessions(data.access_token);

  // Fetch trade professional profile — retry once if first attempt returns empty
  const fetchProfile = () => dbFetch(
    `/contractors?id=eq.${data.user.id}&select=*`,
    { method: "GET" },
    data.access_token
  ).catch(() => []);

  let profile = await fetchProfile();
  // Retry after short delay if empty (RLS timing on fresh token)
  if (!profile?.[0]) {
    await new Promise(r => setTimeout(r, 800));
    profile = await fetchProfile();
  }

  const contractor = profile?.[0] || {};
  const privateFields = await fetchContractorPrivate(data.user.id, data.access_token);
  saveSession({
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
    expires_at:    data.expires_at,
    user: {
      ...data.user,
      ...contractor,
      ...privateFields,
      // Preserve critical fields even if contractor row fetch failed
      email: contractor.email || fallbackEmail,
      status: contractor.status || "pending",
      plan:   contractor.plan   || "free",
    },
  });
};

// ── Log in an existing contractor ─────────────────────────────
// If the account has a verified 2FA factor, the password grant alone is
// NOT enough to log in — returns { requires2FA, factorId, tempAccessToken }
// instead of a session. The UI must challenge+verify that factor (see
// completeMfaLogin below) before the session actually gets saved.
export const signIn = async ({ email, password }) => {
  const data = await authFetch("/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data.access_token) {
    // factors lives on data.user.factors, NOT data.factors — confirmed by
    // parsing a real login response with a verified factor (2026-08-11);
    // an earlier grep-based check couldn't tell top-level from nested and
    // gave a false pass here, caught only by an actual browser login test.
    const verifiedFactor = (data.user?.factors || []).find(f => f.status === "verified" && f.factor_type === "totp");
    if (verifiedFactor) {
      return { requires2FA: true, factorId: verifiedFactor.id, tempAccessToken: data.access_token };
    }
    await finalizeLogin(data, email);
  }

  return data;
};

// ── Complete a login that required 2FA — challenges the factor, verifies
// the code, and finalizes the session from the resulting elevated (aal2)
// token response. Throws on a wrong/expired code (surface to the user). ──
export const completeMfaLogin = async (factorId, tempAccessToken, code) => {
  const challenge = await challengeFactor(tempAccessToken, factorId);
  const data = await verifyFactor(tempAccessToken, factorId, challenge.id, code);
  await finalizeLogin(data, data.email);
  return data;
};

// ── Log out ───────────────────────────────────────────────────
export const signOut = async () => {
  const session = loadSession();
  if (session?.access_token) {
    await authFetch("/logout", {
      method: "POST",
      headers: { "Authorization": `Bearer ${session.access_token}` },
    }).catch(() => {});
  }
  clearSession();
};

// ── Save trade professional profile to DB ─────────────────────────────
export const saveContractorProfile = async (profile, token) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/contractors`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "apikey":        SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${token}`,
      "Prefer":        "return=minimal",
    },
    body: JSON.stringify({
      id:           profile.id,
      email:        profile.email,
      name:         profile.name || "",
      company_name: profile.company_name || null,
      trade:        profile.trade || "",
      state:        profile.state || "",
      license:      profile.license || "",
      phone:        profile.phone || null,
      plan:         profile.plan || "free",
      account_type: profile.account_type || "solo",
      promo_code:   profile.promo_code || null,
      status:       profile.status || "pending",
      // Only set on a recognized partner referral code — otherwise leave
      // unset so the DB's own default ('paid') applies, matching how
      // regular (non-partner) signups have always been categorized.
      ...(profile.pro_source ? { pro_source: profile.pro_source } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Profile setup failed (${res.status})${body ? ": " + body : ""}`);
  }
};

// ── Get current user from session ────────────────────────────
export const getCurrentUser = () => {
  const session = loadSession();
  return session?.user || null;
};

// ── Check if logged in ────────────────────────────────────────
export const isLoggedIn = () => !!loadSession();

// ── Save an address to watchlist ──────────────────────────────
export const saveAddress = async (address) => {
  const session = loadSession();
  if (!session) return { success: false, error: "Not logged in" };
  try {
    await dbFetch("/saved_addresses", {
      method: "POST",
      prefer: "return=minimal",
      body: JSON.stringify({
        user_id: session.user.id,
        address: address.toLowerCase().trim(),
        notify:  true,
      }),
    }, session.access_token);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ── Toggle alerts for a saved address (email + push are both gated on
// this same flag; push additionally needs a registered device token —
// see DashboardPage.js's handler, which requests permission the first
// time this flips on) ──────────────────────────────────────────
export const toggleAddressNotify = async (addressId, notify) => {
  const session = loadSession();
  if (!session) return { success: false, error: "Not logged in" };
  try {
    await dbFetch(
      `/saved_addresses?id=eq.${addressId}`,
      { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ notify }) },
      session.access_token
    );
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ── Unsave / remove a saved address ──────────────────────────
export const unsaveAddress = async (address) => {
  const session = loadSession();
  if (!session) return { success: false };
  try {
    await dbFetch(
      `/saved_addresses?user_id=eq.${session.user.id}&address=eq.${encodeURIComponent(address.toLowerCase().trim())}`,
      { method: "DELETE", prefer: "return=minimal" },
      session.access_token
    );
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ── Get saved addresses for current user ─────────────────────
export const getSavedAddresses = async () => {
  const session = loadSession();
  if (!session) return [];
  try {
    const rows = await dbFetch(
      `/saved_addresses?user_id=eq.${session.user.id}&select=*&order=created_at.desc`,
      { method: "GET" },
      session.access_token
    );
    return rows || [];
  } catch { return []; }
};

// ── Refresh session token ─────────────────────────────────────
export const refreshSession = async () => {
  const session = loadSession();
  if (!session?.refresh_token) return null;
  try {
    const data = await authFetch("/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    if (data.access_token) {
      saveSession({
        ...session,
        access_token:  data.access_token,
        refresh_token: data.refresh_token || session.refresh_token,
        expires_at:    data.expires_at,
      });
      return data.access_token;
    }
  } catch (err) {
    console.warn("[ProRated] Session refresh failed:", err.message);
    clearSession();
  }
  return null;
};

// ── Send password reset email ────────────────────────────────
export const resetPassword = async (email) => {
  await authFetch("/recover", {
    method: "POST",
    body: JSON.stringify({
      email,
      gotrue_meta_security: {},
    }),
  });
};

// ── Update password after clicking reset link ─────────────────
export const updatePassword = async (newPassword) => {
  const session = loadSession();
  const data = await authFetch("/user", {
    method: "PUT",
    headers: { "Authorization": `Bearer ${session?.access_token}` },
    body: JSON.stringify({ password: newPassword }),
  });
  return data;
};

// ── Check and refresh if token expiring soon (within 5 min) ──
export const ensureValidSession = async () => {
  const session = loadSession();
  if (!session) return false;
  const expiresAt = session.expires_at;
  const now = Date.now() / 1000;
  if (expiresAt && expiresAt - now < 300) {
    const newToken = await refreshSession();
    return !!newToken;
  }
  return true;
};
