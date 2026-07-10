import { useState, useEffect, createContext, useContext } from "react";
import { loadSession, signOut, getCurrentUser } from "../api/auth";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { configureRevenueCat } from "../lib/revenuecat";

// ── Auth Context ──────────────────────────────────────────────
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load session from localStorage immediately (fast, no flicker)
    const session = loadSession();
    if (session?.user) setUser(session.user);
    setLoading(false);

    // Background refresh after short delay — gives DB writes time to settle
    if (session?.user?.id && session?.access_token) {
      configureRevenueCat(session.user.id);
      const token = session.access_token;
      setTimeout(() => {
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

  const login = (userData) => {
    setUser(userData);
    if (userData?.id) configureRevenueCat(userData.id);
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

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
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, isLoggedIn: !!user }}>
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
