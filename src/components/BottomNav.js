import React from "react";
import { BRAND } from "./UI";
import { useAuth } from "../hooks/useAuth";
import { useLang } from "../hooks/useLang";
import { t } from "../i18n/translations";
import { isNativeIOS } from "../utils/platform";

export default function BottomNav({ page, go, goLogin }) {
  const { lang } = useLang();
  const { isLoggedIn, user } = useAuth();
  const [showMore, setShowMore] = React.useState(false);

  const TABS = [
    { id: "home",      labelKey: "bottomNav.home",      icon: "🏠" },
    { id: "review",      labelKey: "bottomNav.review",      icon: "⭐" },
    { id: "dashboard", labelKey: "bottomNav.dashboard", icon: "📊" },
  { id: "more",      labelKey: "bottomNav.more",       icon: "☰", label: "More"  },
  ];

  return (
    <>
      <div style={{ height: 70 }} />
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
        background: "#fff",
        borderTop: `1px solid ${BRAND.border}`,
        boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        <div style={{ display: "flex" }}>
          {TABS.map(tab => {
            const isActive =
              tab.id === page ||
              (tab.id === "home"   && page === "home") ||
              false;

            return (
              <button key={tab.id}
                onClick={() => {
                  if (tab.id === "review") {
                    if (!isLoggedIn) { if (goLogin) goLogin(); else go("signup"); return; }
                    if (user?.status === "pending") { go("dashboard"); return; }
                    if (user?.status === "rejected") { go("home"); return; }
                    go(tab.id); return;
                  }
                  if (tab.id === "more") { setShowMore(m => !m); return; }
                  setShowMore(false);
                  go(tab.id);
                }}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 2, padding: "8px 4px 6px",
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  WebkitTapHighlightColor: "transparent",
                  position: "relative",
                }}>
                {isActive && (
                  <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 3, borderRadius: "0 0 3px 3px", background: BRAND.blue }} />
                )}
                <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
                <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500, color: isActive ? BRAND.blue : BRAND.gray }}>
                  {t(lang, tab.labelKey) || tab.label || tab.id}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      {showMore && (
      <>
        {/* Backdrop */}
        <div onClick={() => setShowMore(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 1001 }} />
        {/* Menu */}
        <div style={{ position: "fixed", bottom: 70, left: 0, right: 0, background: "#fff", borderTop: "1px solid #E2E8F0", borderRadius: "16px 16px 0 0", zIndex: 1002, padding: "1rem 1.25rem", boxShadow: "0 -4px 24px rgba(0,0,0,0.12)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>More</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "💬 Support",         page: "support"   },
              { label: "🎬 Resources",       page: "resources" },
              { label: "🛍️ Merch",            page: "merch",  hideOnIOS: true },
              { label: "📝 Blog",             page: "blog"       },
              { label: "🎯 Our Mission",      page: "mission"    },
              { label: "💰 Pricing",         page: "pricing"   },
              { label: "📞 Contact Us",      page: "contact"   },
              { label: "📄 Terms",           page: "terms"     },
              { label: "🔒 Privacy",         page: "privacy"   },
            ].filter(item => !(item.hideOnIOS && isNativeIOS())).map(({ label, page: p }) => (
              <button key={p} onClick={() => { go(p); setShowMore(false); }}
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontWeight: 600, color: "#0F172A", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </>
    )}
    </>
  );
}
