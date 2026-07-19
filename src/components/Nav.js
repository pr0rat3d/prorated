import Logo from "./Logo";
import { BRAND } from "./UI";
import { useAuth } from "../hooks/useAuth";
import { useLang } from "../hooks/useLang";
import { t } from "../i18n/translations";
import LangToggle from "./LangToggle";

export default function Nav({ page, go, goLogin }) {
  const { user, isLoggedIn } = useAuth();
  const { lang } = useLang();


  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 200, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${BRAND.border}`, padding: "0 0.75rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <style>{`
        @media (max-width: 520px) { .nav-signup-full { display: none!important; } .nav-signup-short { display: flex!important; } .nav-lang-full { display: none!important; } }
        @media (min-width: 521px) { .nav-signup-short { display: none!important; } }
        @media (max-width: 380px) { .nav-label { display: none!important; } }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 54, maxWidth: 960, margin: "0 auto", gap: 6 }}>

        {/* Logo */}
        <button onClick={() => go("home")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
          <Logo size={40} />
        </button>

        {/* Center nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, justifyContent: "center" }}>
          {[
            ["home",      "🏠", "nav.home"],
            ["review",    "⭐", "nav.review"],
            ["dashboard", "📊", "nav.dashboard"],
          ].map(([id, icon, tKey]) => (
            <button key={id} onClick={() => go(id)}
              style={{ padding: "6px 8px", borderRadius: 8, border: "none", background: page === id ? BRAND.blue : "transparent", color: page === id ? "#fff" : BRAND.gray, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
              <span>{icon}</span>
              <span className="nav-label">{t(lang, tKey)}</span>
            </button>
          ))}
        </div>

        {/* Right side — lang toggle + auth */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {/* Language toggle — full on desktop, icon only on mobile */}
          <LangToggle className="nav-lang-full" />

          <div style={{ width: 1, height: 18, background: "#CBD5E1" }} />

          {isLoggedIn ? (
            <div style={{ width: 32, height: 32, background: BRAND.blue, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
              onClick={() => go("dashboard")}>
              {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
            </div>
          ) : (
            <>
              <button className="nav-signup-full" onClick={() => { if (goLogin) goLogin(); else go("signup"); }}
                style={{ background: "none", color: BRAND.gray, border: "none", padding: "7px 8px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
                {t(lang, "nav.signIn")}
              </button>
              <button className="nav-signup-full" onClick={() => go("signup")}
                style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
                {t(lang, "nav.signUp")}
              </button>
              <button className="nav-signup-short" onClick={() => go("signup")}
                style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "7px 10px", borderRadius: 9, fontSize: 14, cursor: "pointer", display: "none" }}>
                👤
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
