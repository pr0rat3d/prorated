import { useState, useEffect, createContext, useContext } from "react";
import { loadSession, signOut, getCurrentUser } from "../api/auth";

// ── Auth Context ──────────────────────────────────────────────
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load session on mount
    const session = loadSession();
    if (session?.user) setUser(session.user);
    setLoading(false);
  }, []);

  const login = (userData) => setUser(userData);

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  const refreshUser = () => {
    const current = getCurrentUser();
    setUser(current);
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
