import { useState, useEffect, createContext, useContext } from "react";
import { loadSession, signOut, getCurrentUser, checkSessionActive, ensureValidSession } from "../api/auth";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { configureRevenueCat } from "../lib/revenuecat";

// ── Auth Context ──────────────────────────────────────────────
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionKilled, setSessionKilled] = useState(false);

  useEffect(() => {
    // Load session from localStorage immediately (fast, no flicker)
    const session = loadSession();
    if (session?.user) setUser(session.user);
    setLoading(false);

    // If the app was closed/backgrounded long enough for the access token
    // to go stale, try to silently refresh it right away on reopen —
    // otherwise the first real API call fails before anything's had a
    // chance to renew it.
    if (session?.user) ensureValidSession();

    // Background refresh after short delay — gives DB writes time to settle
    if (session?.user?.id && session?.access_token) {
      configureRevenueCat(session.user.id, session.user.email);
      setTimeout(() => {
        // Re-read rather than use the token captured at mount — the
        // ensureValidSession() call above may have refreshed it by now.
        const token = loadSession()?.access_token || session.access_token;
        fetch(
          `${SUPABASE_URL}/rest/v1/contractors?id=eq.${session.user.id}&select=*&limit=1`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } }
        )
          .then(r => r.json())
          .then(rows => {
            if (rows?.[0]) {
              const freshRow = rows[0];
              // Re-read session in case it was updated by a concurrent operation
              const latestSession = JSON.parse(localStorage.getItem("prorated_session") || "{}");
              const fresh = {
                ...latestSession.user,
                ...freshRow,
                // Preserve company fields from latest session if DB hasn't caught up
                company_id:   freshRow.company_id   ?? latestSession.user?.company_id,
                company_role: freshRow.company_role ?? latestSession.user?.company_role,
              };
              const updatedSession = { ...latestSession, user: fresh };
              localStorage.setItem("prorated_session", JSON.stringify(updatedSession));
              setUser(fresh);
            }
          })
          .catch(() => {});
      }, 1500); // 1.5s delay — lets company create/delete PATCHes settle first
    }
  }, []);

  // Periodically confirm this device is still the active session — logging
  // in elsewhere kills the row this session's JWT claim points at, so the
  // next check here fails and this device gets force-logged-out. Same tick
  // also refreshes the user's profile row, so an admin action (license
  // approval, plan change) shows up without needing to log out and back in —
  // go() in App.js covers tab navigation; this covers sitting idle on one screen.
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      // Refresh the access token first — checkSessionActive fails open on
      // network/auth errors, but a stale token here would still make every
      // real data fetch downstream fail silently. ensureValidSession only
      // returns false when the refresh_token itself is dead (nothing left
      // to recover), which is a genuine logout, distinct from the
      // "logged in elsewhere" case below.
      const stillValid = await ensureValidSession();
      if (!stillValid) {
        await signOut();
        setUser(null);
        return;
      }

      const active = await checkSessionActive();
      if (!active) {
        await signOut();
        setUser(null);
        setSessionKilled(true);
        return;
      }
      refreshUser();
    };
    const interval = setInterval(check, 60000);
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, [user]);

  const login = (userData) => {
    setUser(userData);
    setSessionKilled(false);
    if (userData?.id) configureRevenueCat(userData.id, userData.email);
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  const dismissSessionKilled = () => setSessionKilled(false);

  // Fetch fresh user data from Supabase and update session + state
  const refreshUser = async () => {
    try {
      const session = loadSession();
      if (!session?.user?.id) return;
      const token = session.access_token || SUPABASE_ANON_KEY;
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/contractors?id=eq.${session.user.id}&select=*&limit=1`,
        { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${token}` } }
      );
      const rows = await res.json();
      if (rows?.[0]) {
        const fresh = { ...session.user, ...rows[0] };
        // Update localStorage session with fresh data
        const updatedSession = { ...session, user: fresh };
        localStorage.setItem("prorated_session", JSON.stringify(updatedSession));
        setUser(fresh);
      }
    } catch (e) {
      console.warn("[ProRated] refreshUser failed:", e);
      const current = getCurrentUser();
      setUser(current);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, isLoggedIn: !!user, sessionKilled, dismissSessionKilled }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
