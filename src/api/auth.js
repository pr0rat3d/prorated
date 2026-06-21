import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
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
    // Check if token is expired
    if (session.expires_at && Date.now() / 1000 > session.expires_at) {
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
export const signUp = async ({ email, password, name, trade, state, license, accountType = "solo", plan = "free", promoCode = null }) => {
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
      user: { ...data.user, name, trade, state, license, account_type: accountType, plan },
    });

    await saveContractorProfile({
      id:           data.user.id,
      email,
      name,
      trade,
      state,
      license,
      plan,
      account_type: accountType,
      promo_code:   promoCode,
    }, data.access_token).catch(() => {});
  }

  return data;
};

// ── Log in an existing contractor ─────────────────────────────
export const signIn = async ({ email, password }) => {
  const data = await authFetch("/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data.access_token) {
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
    saveSession({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_at:    data.expires_at,
      user: {
        ...data.user,
        ...contractor,
        // Preserve critical fields even if contractor row fetch failed
        email: contractor.email || email,
        status: contractor.status || "pending",
        plan:   contractor.plan   || "free",
      },
    });
  }

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
  await dbFetch("/contractors", {
    method: "POST",
    prefer: "return=minimal",
    body: JSON.stringify({
      id:           profile.id,
      email:        profile.email,
      name:         profile.name || "",
      trade:        profile.trade || "",
      state:        profile.state || "",
      license:      profile.license || "",
      plan:         profile.plan || "free",
      account_type: profile.account_type || "solo",
      promo_code:   profile.promo_code || null,
      status:       "pending",
    }),
  }, token);
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
