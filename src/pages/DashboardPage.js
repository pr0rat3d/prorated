import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { useState, useEffect } from "react";
import { TRADES, ISSUE_TAGS, DASH_REVIEWS, BRAND, FREE_PLAN_LABEL } from "../data/constants";
import { Badge, Stars, Pill, Btn, Card } from "../components/UI";
import { useAuth } from "../hooks/useAuth";



import { fetchMyReviews, updateReview } from "../api/supabase";
import { getSavedAddresses, unsaveAddress } from "../api/auth";
import usePush from "../hooks/usePush";
import { useLang } from "../hooks/useLang";
import { t } from "../i18n/translations";

// Title case helper — "105 skyline drive" → "105 Skyline Drive"
const toTitleCase = (str) => {
  if (!str) return "";
  const lower = ["a","an","the","and","but","or","for","nor","on","at","to","by","in","of","up"];
  return str.replace(/\w\S*/g, (word, offset) => {
    if (offset > 0 && lower.includes(word.toLowerCase())) return word.toLowerCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
};

export default function DashboardPage({ go, goBack, goLogin, paymentSuccess, onPaymentAck }) {
  const { user, logout, isLoggedIn } = useAuth();
  const { subscribed, permission, subscribe, unsubscribe } = usePush();
  const { lang } = useLang();

  const [tab, setTab]           = useState("reviews");
  const [saved, setSaved]       = useState([]);
  const [loadingSaved, setLS]   = useState(false);
  const [myReviews, setMyReviews] = useState([]);
  const [loadingReviews, setLR]   = useState(false);

  useEffect(() => {
    if (isLoggedIn && tab === "saved") {
      setLS(true);
      getSavedAddresses().then(rows => {
        setSaved(rows);
        setLS(false);
      });
    }
  }, [tab, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      setLR(true);
      fetchMyReviews().then(rows => {
        setMyReviews(Array.isArray(rows) ? rows : []);
        setLR(false);
      }).catch(() => setLR(false));
    }
  }, [isLoggedIn]);

  const handleLogout = async () => {
    await logout();
    go("home");
  };

  const displayName = user?.name || user?.email || "Contractor";
  const trade = TRADES.find(t => t.id === (user?.trade || "general"));

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", padding: "1.5rem" }}>

      {/* Profile header */}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 52, height: 52, background: BRAND.blue, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 800 }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 19, fontWeight: 800, color: BRAND.dark, margin: 0 }}>{displayName}</h1>
              {isLoggedIn && <span style={{ background: "#DCFCE7", color: "#166534", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>✓ MEMBER</span>}
            </div>
            <div style={{ fontSize: 12, color: BRAND.gray }}>
              {trade?.icon} {trade?.label || "Contractor"}{user?.state ? ` · ${user.state}` : ""}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={() => go("review")}>+ New review</Btn>
          {isLoggedIn && (
            <button onClick={handleLogout}
              style={{ background: "none", border: `1px solid ${BRAND.border}`, color: BRAND.gray, padding: "8px 14px", borderRadius: 9, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Log out
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.6rem", marginBottom: "1.25rem" }}>
        {[
          [DASH_REVIEWS.length.toString(), t(lang,"dashboard.reviewsSubmitted"), ""],
          ["63",                           "Helpful votes", "From peers"],
          [saved.length.toString(),        "Saved",         "Watching"],
          ["4.8",                          "Trust score",   "Reviewer rating"],
        ].map(([v, l, s]) => (
          <Card key={l} style={{ textAlign: "center", padding: "1rem" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: BRAND.blue, fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>{v}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, marginBottom: 1 }}>{l}</div>
            <div style={{ fontSize: 10, color: BRAND.gray }}>{s}</div>
          </Card>
        ))}
      </div>

      {/* Payment success modal */}
      {paymentSuccess && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", backdropFilter: "blur(6px)" }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: "2.5rem 2rem", maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 32px 80px rgba(0,0,0,0.4)", animation: "fadeUp 0.4s ease both" }}>
            {/* Confetti emoji stack */}
            <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🏆 💎 🚀</div>

            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", marginBottom: 8, marginTop: 16 }}>
              Welcome to Pro!
            </h2>
            <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, marginBottom: 24 }}>
              Your account has been upgraded. You now have <strong>unlimited address lookups</strong>, full access to Local Points of Interest, and push notifications for your saved addresses.
            </p>

            {/* Pro features list */}
            <div style={{ background: "#F0FDF4", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: 24, textAlign: "left" }}>
              {[
                "✓  Unlimited address lookups",
                "✓  Full supplier & food results",
                "✓  Push notifications for saved addresses",
                "✓  Watchlist alerts before you bid",
                "✓  Priority support",
              ].map(f => (
                <div key={f} style={{ fontSize: 13, color: "#166534", fontWeight: 600, padding: "4px 0" }}>{f}</div>
              ))}
            </div>

            <button onClick={onPaymentAck}
              style={{ width: "100%", background: "linear-gradient(135deg, #16A34A, #059669)", color: "#fff", border: "none", padding: "14px", borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.3px" }}>
              Let's go! →
            </button>
            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 12, marginBottom: 0 }}>
              Thank you for supporting ProRated 🛡️
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 3, borderBottom: `2px solid ${BRAND.border}`, marginBottom: "1.25rem" }}>
        {[["reviews", t(lang,"dashboard.myReviews")],["saved", t(lang,"dashboard.savedAddresses")],["profile", t(lang,"dashboard.profile")]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: "9px 16px", border: "none", background: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: tab === id ? BRAND.dark : BRAND.gray, borderBottom: tab === id ? `2px solid ${BRAND.blue}` : "2px solid transparent", marginBottom: -2, transition: "color 0.15s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* My Reviews */}
      {tab === "reviews" && (
        <>
          {/* Review Rewards Progress */}
        {myReviews.length < 8 && (
          <div style={{ background: myReviews.length >= 3 ? "linear-gradient(135deg, #F0FDF4, #DCFCE7)" : "linear-gradient(135deg, #EFF6FF, #DBEAFE)", border: `1.5px solid ${myReviews.length >= 3 ? "#86EFAC" : "#BFDBFE"}`, borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: myReviews.length >= 3 ? "#166534" : "#1E40AF" }}>
                {myReviews.length >= 3 ? "🎉 Pro unlocked!" : "⭐ Earn Pro free"}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: myReviews.length >= 3 ? "#166534" : "#1E40AF" }}>
                {myReviews.length}/3 reviews
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: 8, background: "rgba(0,0,0,0.1)", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
              <div style={{ height: "100%", width: `${Math.min((myReviews.length / 3) * 100, 100)}%`, background: myReviews.length >= 3 ? "#16A34A" : "#2563EB", borderRadius: 4, transition: "width 0.5s ease" }} />
            </div>
            <div style={{ fontSize: 11, color: myReviews.length >= 3 ? "#166534" : "#1E40AF", lineHeight: 1.55 }}>
              {myReviews.length === 0 && "Submit 3 reviews to unlock 30 days of Pro free"}
              {myReviews.length === 1 && "2 more reviews to unlock Pro free for 30 days"}
              {myReviews.length === 2 && "1 more review to unlock Pro free for 30 days!"}
              {myReviews.length >= 3 && myReviews.length < 8 && `Submit ${8 - myReviews.length} more reviews to extend Pro another 30 days`}
            </div>
          </div>
        )}
        {myReviews.length >= 8 && (
          <div style={{ background: "linear-gradient(135deg, #7C3AED15, #4F46E515)", border: "1.5px solid #7C3AED", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#7C3AED" }}>🛡️ Elite contributor — Pro access earned!</div>
            <div style={{ fontSize: 11, color: "#7C3AED", marginTop: 4 }}>Your reviews help the whole community. Thank you.</div>
          </div>
        )}
        </>
      )}
      {tab === "reviews" && (
        <div>
          {DASH_REVIEWS.map(r => {
            const tr = TRADES.find(t => t.id === r.trade);
            return (
              <Card key={r.id} style={{ marginBottom: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 7 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.dark, marginBottom: 3 }}>📍 {toTitleCase(r.address)}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Stars score={r.overall} size={13} />
                      <span style={{ fontSize: 11, color: BRAND.gray }}>{tr?.icon} {tr?.label} · {new Date(r.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Badge score={r.overall} />
                    <div style={{ fontSize: 10, color: BRAND.gray, marginTop: 3 }}>👍 {r.helpfulCount}</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: "0.65rem" }}>
                  {r.tags.map(tid => { const t = ISSUE_TAGS.find(x => x.id === tid); return t ? <Pill key={tid} label={t.label} sev={t.severity} small selected /> : null; })}
                </div>
              </Card>
            );
          })}
          <div style={{ textAlign: "center", padding: "1.25rem", border: `2px dashed ${BRAND.border}`, borderRadius: 14, color: BRAND.gray, cursor: "pointer" }} onClick={() => go("review")}>
            <div style={{ fontSize: 22, marginBottom: 5 }}>+</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Add a review</div>
          </div>
        </div>
      )}

      {/* Saved Addresses */}
      {tab === "saved" && (
        <div>
          {!isLoggedIn && (
            <div style={{ textAlign: "center", padding: "2rem", background: "#F8FAFC", borderRadius: 14, border: `1px solid ${BRAND.border}` }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🔒</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.dark, marginBottom: 6 }}>Sign in to save addresses</div>
              <div style={{ fontSize: 13, color: BRAND.gray, marginBottom: 16 }}>Create a free account to watch addresses and get notified of new reviews.</div>
              <Btn onClick={() => go("signup")}>Sign up free</Btn>
            </div>
          )}
          {isLoggedIn && loadingSaved && (
            <div style={{ textAlign: "center", padding: "2rem", color: BRAND.gray }}>Loading saved addresses...</div>
          )}
          {isLoggedIn && !loadingSaved && saved.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem", background: "#F8FAFC", borderRadius: 14, border: `1px solid ${BRAND.border}` }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📍</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.dark, marginBottom: 6 }}>No saved addresses yet</div>
              <div style={{ fontSize: 13, color: BRAND.gray, marginBottom: 16 }}>Search for a job site and tap the bookmark icon to save it here.</div>
              <Btn onClick={() => go("home")}>Search addresses</Btn>
            </div>
          )}
          {isLoggedIn && !loadingSaved && saved.map(addr => (
            <Card key={addr.id} style={{ marginBottom: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.dark, marginBottom: 2 }}>📍 {toTitleCase(addr.address)}</div>
                  <div style={{ fontSize: 12, color: BRAND.gray }}>Saved {new Date(addr.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                </div>
                <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
                  <Btn small onClick={() => {
                    try { sessionStorage.setItem("pr_search_query", addr.address); } catch {}
                    go("home");
                  }}>View</Btn>
                  <span style={{ fontSize: 16 }}>{addr.notify ? "🔔" : "🔕"}</span>
                  <button
                    onClick={async () => {
                      await unsaveAddress(addr.address);
                      setSaved(prev => prev.filter(a => a.id !== addr.id));
                    }}
                    style={{ background: "#FEE2E2", color: "#991B1B", border: "none", borderRadius: 7, padding: "5px 9px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                    title="Remove saved address"
                  >✕</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Profile */}
      {tab === "profile" && (
        <div>
          {!isLoggedIn ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ textAlign: "center", padding: "2rem", background: "#F8FAFC", borderRadius: 14, border: `1px solid ${BRAND.border}` }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>👤</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.dark, marginBottom: 6 }}>Create your trade professional profile</div>
                <div style={{ fontSize: 13, color: BRAND.gray, marginBottom: 16 }}>Sign up to track your reviews, save addresses, and build your trust score.</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <Btn onClick={() => go("signup")}>Sign up free</Btn>
                  <Btn variant="secondary" onClick={() => goLogin ? goLogin() : go("signup")}>Log in</Btn>
                </div>
              </div>

            </div>
          ) : (
            <div>
              {/* Trust Score Card */}
              {(() => {
                const score = user?.trust_score || 0;
                const tiers = [
                  { min: 90, max: 100, label: "Elite Pro",    badge: "🛡️", color: "#7C3AED", bg: "#FAF5FF" },
                  { min: 75, max: 89,  label: "Verified Pro", badge: "⭐", color: "#D97706", bg: "#FFFBEB" },
                  { min: 50, max: 74,  label: "Trusted",      badge: "🟢", color: "#16A34A", bg: "#F0FDF4" },
                  { min: 25, max: 49,  label: "Established",  badge: "🔵", color: "#2563EB", bg: "#EFF6FF" },
                  { min: 0,  max: 24,  label: "New Member",   badge: "⚪", color: "#64748B", bg: "#F8FAFC" },
                ];
                const tier = tiers.find(t => score >= t.min && score <= t.max) || tiers[4];
                const tierIdx = tiers.indexOf(tier);
                const nextTier = tierIdx > 0 ? tiers[tierIdx - 1] : null;
                const pct = Math.round(((score - tier.min) / Math.max(tier.max - tier.min, 1)) * 100);
                return (
                  <div style={{ background: tier.bg, border: `1.5px solid ${tier.color}44`, borderRadius: 16, padding: "1.25rem", marginBottom: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: tier.color, marginBottom: 4 }}>Trust Score</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                          <span style={{ fontSize: 48, fontWeight: 900, color: tier.color, lineHeight: 1 }}>{score}</span>
                          <span style={{ fontSize: 16, color: tier.color, opacity: 0.5 }}>/100</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 22 }}>{tier.badge}</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: tier.color, marginTop: 4 }}>{tier.label}</div>
                        {user?.verified_pro && <div style={{ fontSize: 10, color: "#16A34A", fontWeight: 700, marginTop: 2 }}>✓ Listed in Directory</div>}
                      </div>
                    </div>
                    <div style={{ height: 6, background: "rgba(0,0,0,0.08)", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: tier.color, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 11, color: tier.color, opacity: 0.8, marginBottom: 10 }}>
                      {nextTier ? `${nextTier.min - score} pts to ${nextTier.label}${nextTier.min >= 75 ? " · Unlocks Verified Pro directory" : ""}` : "🏆 Maximum tier achieved"}
                    </div>
                    <div style={{ paddingTop: 10, borderTop: `1px solid ${tier.color}22`, display: "flex", gap: 14, fontSize: 11, color: tier.color, opacity: 0.7, flexWrap: "wrap" }}>
                      <span>+10 per review</span>
                      <span>+5 per helpful vote</span>
                      <span>+15 per referral</span>
                    </div>
                  </div>
                );
              })()}

              {/* Account details */}
              <Card style={{ marginBottom: "0.85rem" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: "0.85rem" }}>Account details</div>
                {[
                  ["Name",    user?.name    || "—"],
                  ["Email",   user?.email   || "—"],
                  ["State",   user?.state   || "—"],
                  ["Trade",   trade?.label  || "—"],
                  ["License", user?.license || "—"],
                  ["Plan",    FREE_PLAN_LABEL],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${BRAND.border}`, fontSize: 13 }}>
                    <span style={{ color: BRAND.gray }}>{l}</span>
                    <span style={{ fontWeight: 600, color: BRAND.dark }}>{v}</span>
                  </div>
                ))}
              </Card>

              {/* Upgrade to Pro */}
              {user?.plan !== "pro" && (
                <div onClick={() => go("pricing")} style={{ background: "linear-gradient(135deg, #0F172A, #1E3A5F)", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#F8FAFC", marginBottom: 2 }}>{t(lang, "upgrade.title")}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>Unlimited lookups · $9.99/mo or $99.99/yr</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); go("pricing"); }}
                    style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
                    View plans →
                  </button>
                </div>
              )}

              {/* Push notifications */}
              <Card style={{ marginBottom: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 2 }}>🔔 Push Notifications</div>
                    <div style={{ fontSize: 11, color: BRAND.gray }}>
                      {subscribed ? "Enabled — you'll get alerts for saved addresses" : permission === "denied" ? "Blocked — enable in browser settings" : "Get notified when saved addresses get new reviews"}
                    </div>
                  </div>
                  {!subscribed && permission !== "denied" && (
                    <button onClick={subscribe}
                      style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0, marginLeft: 10 }}>
                      Enable
                    </button>
                  )}
                  {subscribed && (
                    <span style={{ fontSize: 11, color: BRAND.green, fontWeight: 600 }}>✓ Enabled</span>
                  )}
                </div>
              </Card>



              {/* Log out */}
              <div style={{ marginTop: "1rem", display: "flex", gap: 8 }}>
                <button onClick={handleLogout}
                  style={{ background: "#FEE2E2", color: "#991B1B", border: "none", padding: "10px 18px", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}