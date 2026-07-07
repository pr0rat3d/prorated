import { useState } from "react";
import { DEMO_ADDRESSES, DEMO_DATA, BRAND, FREE_MONTHLY_LOOKUPS } from "../data/constants";
import { generateAddressData } from "../api/claude";
import { fetchReviewsForAddress, buildAddressFromReviews } from "../api/supabase";
import { Btn, Spinner } from "../components/UI";
import Logo from "../components/Logo";
import AddressCard from "../components/AddressCard";
import AddressInput from "../components/AddressInput";
import { saveAddress, unsaveAddress } from "../api/auth";
import { useLang } from "../hooks/useLang";
import { useAuth } from "../hooks/useAuth";
import { canDoLookup, logLookup } from "../api/lookupCounter";
import { loadSession } from "../api/auth";
import { translateAddressData } from "../api/translate";
import { t } from "../i18n/translations";

export default function HomePage({ go, goLogin, goReview, initialQuery, onQueryUsed }) {
  const { lang } = useLang();
  const { user, isLoggedIn } = useAuth();

  // Auto-search if coming from saved address View button or review "View address"
  const pendingSearch = (() => {
    if (initialQuery) { if (onQueryUsed) onQueryUsed(); return initialQuery; }
    try {
      const stored = sessionStorage.getItem("pr_search_query");
      if (stored) { sessionStorage.removeItem("pr_search_query"); return stored; }
    } catch {}
    return null;
  })();

  const [query, setQuery]         = useState("");
  const [querySaved, setQuerySaved] = useState(false);
  const [savingQuery, setSavingQuery] = useState(false);
  const [lookupBlocked, setBlocked] = useState(false);
  const [remaining, setRemaining]   = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Trigger pending search from saved address View
  if (pendingSearch && !results && !loading) {
    setTimeout(() => { setQuery(pendingSearch); search(pendingSearch); }, 100);
  }

  const search = async (q = query) => {
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 5) return;

    // 0. Gate — must be logged in and verified
    if (!isLoggedIn) {
      setError("gate_login");
      setLoading(false);
      return;
    }
    const isApproved = user?.status === "approved" || user?.plan === "pro";

    if (!isApproved && user?.status === "pending") {
      setError("gate_pending");
      setLoading(false);
      return;
    }
    if (!isApproved && user?.status === "rejected") {
      setError("gate_rejected");
      setLoading(false);
      return;
    }

    // 1. Check lookup limit (skip for demo data — free to access)
    const isDemoAddress = Object.keys(DEMO_DATA).some(k =>
      k.toLowerCase().includes(trimmed.toLowerCase().split(",")[0].toLowerCase())
    );

    if (!isDemoAddress) {
      const check = await canDoLookup();
      if (!check.allowed) {
        setBlocked(true);
        setLoading(false);
        return;
      }
      // Log the lookup
      const session = loadSession();
      if (session?.user) logLookup(session.user.id, trimmed);
      setRemaining(check.remaining != null ? check.remaining - 1 : null);
    }

    // 1. Check Supabase for real submitted reviews
    setLoading(true); setError(null); setResults(null);
    try {
      const storedRows = await fetchReviewsForAddress(trimmed);
      if (storedRows.length > 0) {
        setResults([buildAddressFromReviews(trimmed, storedRows)]);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("[ProRated] Search fallback triggered");
    }

    // 2. Check pre-loaded demo data
    const demoKey = Object.keys(DEMO_DATA).find(k =>
      k.toLowerCase().includes(trimmed.toLowerCase().split(",")[0].toLowerCase())
    );
    if (demoKey) {
      setResults([DEMO_DATA[demoKey]]);
      setLoading(false);
      return;
    }

    // 3. Fall back to Claude AI
    try {
      const data = await generateAddressData(trimmed);
      if (!data || !data.street) throw new Error("No data");
      // Translate if Spanish
      const translated = lang === "es"
        ? await translateAddressData(data, lang)
        : data;
      setResults([translated]);
    } catch {
      setError(t(lang, "home.errorMsg"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      {!results && !loading && !error && (
        <div style={{ background: `linear-gradient(135deg, ${BRAND.dark} 0%, #1E3A5F 50%, #14532D 100%)`, padding: "4.5rem 1.5rem 6rem", textAlign: "center", position: "relative", overflow: "visible" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(59,130,246,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.07) 1px,transparent 1px)", backgroundSize: "42px 42px", pointerEvents: "none", overflow: "hidden" }} />
          <div style={{ position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)", width: 700, height: 500, background: "radial-gradient(ellipse,rgba(37,99,235,0.18) 0%,transparent 65%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", maxWidth: 660, margin: "0 auto" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20, animation: "fadeUp 0.5s ease both", gap: 8 }}>
              <Logo size={110} dark={true} />
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(148,163,184,0.85)", fontFamily: "'DM Sans', sans-serif" }}>
                Built by Pros, Built for Pros
              </div>
            </div>
            <div style={{ display: "inline-block", background: "rgba(59,130,246,0.15)", color: "#93C5FD", fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", padding: "5px 16px", borderRadius: 20, border: "1px solid rgba(59,130,246,0.3)", marginBottom: 18, animation: "fadeUp 0.5s ease 0.05s both" }}>
              {t(lang, "home.badge")}
            </div>
            <h1 style={{ fontSize: "clamp(34px,5vw,54px)", fontWeight: 800, color: "#F8FAFC", lineHeight: 1.08, marginBottom: 16, letterSpacing: "-1px", animation: "fadeUp 0.5s ease 0.1s both" }}>
              {t(lang, "home.headline1")}<br /><span style={{ color: "#4ADE80" }}>{t(lang, "home.headline2")}</span>
            </h1>
            <p style={{ fontSize: 16, color: "#94A3B8", lineHeight: 1.7, maxWidth: 460, margin: "0 auto 24px", animation: "fadeUp 0.5s ease 0.2s both" }}>
              {t(lang, "home.subheadline")}
            </p>
            {!isLoggedIn && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 20, padding: "5px 14px", marginBottom: 16, animation: "fadeUp 0.5s ease 0.25s both" }}>
                <span style={{ fontSize: 11 }}>🔐</span>
                <span style={{ fontSize: 11, color: "#93C5FD", fontWeight: 600 }}>Verified trade professionals only · <button onClick={() => go("signup")} style={{ background: "none", border: "none", color: "#60A5FA", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: 0, textDecoration: "underline" }}>Create free account</button></span>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, background: "#FFF", borderRadius: 14, padding: "5px 5px 5px 14px", maxWidth: 560, margin: "0 auto 16px", boxShadow: "0 16px 48px rgba(0,0,0,0.4)", animation: "fadeUp 0.5s ease 0.3s both", alignItems: "center", position: "relative", zIndex: 500 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>🔍</span>
              <AddressInput
                value={query}
                onChange={setQuery}
                onSelect={(addr) => { setQuery(addr); setQuerySaved(false); search(addr); }}
                placeholder={t(lang, "home.searchPlaceholder")}
              />
              <Btn onClick={() => search()}>{t(lang, "home.searchBtn")}</Btn>
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, animation: "fadeUp 0.5s ease 0.35s both" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "4px 12px" }}>
                <span style={{ fontSize: 11 }}>📍</span>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>Beta focused on <strong style={{ color: "#F8FAFC" }}>Alabama</strong> — expanding soon</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", animation: "fadeUp 0.5s ease 0.4s both" }}>
              <span style={{ fontSize: 11, color: "#475569", alignSelf: "center" }}>{t(lang, "home.tryLabel")}</span>
              {DEMO_ADDRESSES.map(d => (
                <button key={d} onClick={() => { setQuery(d); search(d); }}
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#94A3B8", fontSize: 11, padding: "4px 12px", borderRadius: 20, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  {d.split(",")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "1.5rem" }}>


        {/* Pending verification banner */}
        {isLoggedIn && user?.status === "pending" && (
          <div style={{ background: "#FEF9C3", border: "1px solid #FDE047", borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#854D0E" }}>⏳ Verification in progress</div>
              <div style={{ fontSize: 11, color: "#92400E", marginTop: 2 }}>You can browse while you wait — reviews unlock once approved (usually under 24hrs)</div>
            </div>
          </div>
        )}

        {/* Lookup limit warning */}
        {remaining !== null && remaining <= 5 && remaining > 0 && (
          <div style={{ background: "#FEF9C3", border: "1px solid #FDE047", borderRadius: 10, padding: "8px 14px", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#854D0E", fontWeight: 600 }}>
              ⚠️ {remaining} lookup{remaining !== 1 ? "s" : ""} remaining this month
            </span>
            <button onClick={() => go("pricing")}
              style={{ background: "#D97706", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Upgrade →
            </button>
          </div>
        )}

        {/* Lookup limit reached */}
        {lookupBlocked && (
          <div style={{ background: "#fff", border: "1px solid #FCA5A5", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", marginBottom: "1rem" }}>
            <div style={{ background: "linear-gradient(135deg, #7F1D1D, #991B1B)", padding: "2rem", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#FEF2F2", marginBottom: 8 }}>Monthly lookup limit reached</h2>
              <p style={{ fontSize: 13, color: "#FECACA", lineHeight: 1.65 }}>
                You've used all {FREE_MONTHLY_LOOKUPS} free lookups this month. Upgrade to a paid plan for unlimited access.
              </p>
            </div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
              <button onClick={() => go("pricing")}
                style={{ width: "100%", maxWidth: 320, background: "#2563EB", color: "#fff", border: "none", padding: "13px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                🚀 Upgrade — Free through 2026
              </button>
              <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center" }}>
                Resets on the 1st of next month · You can still leave reviews for free
              </p>
              <button onClick={() => { setBlocked(false); setQuery(""); }}
                style={{ background: "none", border: "none", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                ← Search demo addresses instead
              </button>
            </div>
          </div>
        )}

        {(results || loading || error) && (
          <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", flex: 1, gap: 8, background: "#FFF", borderRadius: 11, padding: "5px 10px", border: `1.5px solid ${BRAND.border}`, alignItems: "center" }}>
              <span style={{ fontSize: 16 }}>🔍</span>
              <AddressInput
                value={query}
                onChange={setQuery}
                onSelect={(addr) => { setQuery(addr); setQuerySaved(false); search(addr); }}
                placeholder={t(lang, "home.searchPlaceholder")}
                inputStyle={{ fontSize: 13 }}
              />
            </div>
            <Btn onClick={() => search()}>{t(lang, "home.searchBtn")}</Btn>
          </div>
        )}

        {loading && <Spinner />}

        {error && !loading && (
          <>
            {/* Gate: not logged in */}
            {error === "gate_login" && (
              <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", animation: "fadeUp 0.4s ease both" }}>
                <div style={{ background: "linear-gradient(135deg, #0F172A, #1E3A5F)", padding: "2rem", textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#F8FAFC", marginBottom: 8 }}>Sign in to search addresses</h2>
                  <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.65, maxWidth: 340, margin: "0 auto" }}>
                    ProRated is a verified trade professional platform. Create a free account to access job site ratings.
                  </p>
                </div>
                <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                  <button onClick={() => go("signup")}
                    style={{ width: "100%", maxWidth: 320, background: BRAND.blue, color: "#fff", border: "none", padding: "13px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    Create free account →
                  </button>
                  <button onClick={() => go("signup")}
                    style={{ background: "none", border: "none", color: BRAND.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    Already have an account? Sign in
                  </button>
                </div>
              </div>
            )}

            {/* Gate: pending verification */}
            {error === "gate_pending" && (
              <div style={{ background: "#fff", border: `1px solid #FDE047`, borderRadius: 20, overflow: "hidden", animation: "fadeUp 0.4s ease both" }}>
                <div style={{ background: "linear-gradient(135deg, #78350F, #92400E)", padding: "2rem", textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#FEF9C3", marginBottom: 8 }}>License verification in progress</h2>
                  <p style={{ fontSize: 14, color: "#FDE68A", lineHeight: 1.65, maxWidth: 340, margin: "0 auto" }}>
                    Your contractor license is being verified. This usually takes less than 24 hours. You'll be able to search addresses once approved.
                  </p>
                </div>
                <div style={{ padding: "1.5rem", textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: BRAND.gray, marginBottom: 12 }}>Questions? Email us at <a href="mailto:hello@prorated.app" style={{ color: BRAND.blue }}>hello@prorated.app</a></p>
                  <button onClick={() => { setError(null); setQuery(""); }}
                    style={{ background: "none", border: "none", color: BRAND.gray, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {/* Gate: rejected */}
            {error === "gate_rejected" && (
              <div style={{ background: "#fff", border: `1px solid #FCA5A5`, borderRadius: 20, overflow: "hidden", animation: "fadeUp 0.4s ease both" }}>
                <div style={{ background: "linear-gradient(135deg, #7F1D1D, #991B1B)", padding: "2rem", textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#FEF2F2", marginBottom: 8 }}>Verification unsuccessful</h2>
                  <p style={{ fontSize: 14, color: "#FECACA", lineHeight: 1.65, maxWidth: 340, margin: "0 auto" }}>
                    We couldn't verify your contractor license. Please contact us to appeal.
                  </p>
                </div>
                <div style={{ padding: "1.5rem", textAlign: "center" }}>
                  <a href="mailto:hello@prorated.app?subject=License Verification Appeal"
                    style={{ display: "inline-block", background: BRAND.blue, color: "#fff", textDecoration: "none", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                    Contact us to appeal →
                  </a>
                </div>
              </div>
            )}

            {/* Normal: no reviews found */}
            {error !== "gate_login" && error !== "gate_pending" && error !== "gate_rejected" && (
              <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", animation: "fadeUp 0.4s ease both" }}>
                <div style={{ background: "linear-gradient(135deg, #0F172A, #1E3A5F)", padding: "2rem", textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📍</div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#F8FAFC", marginBottom: 8 }}>No reviews yet for this address</h2>
                  <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.65, maxWidth: 340, margin: "0 auto" }}>
                    Be the first trade professional to rate this job site and help others bid smarter.
                  </p>
                </div>
                <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                  <button onClick={() => { if (!isLoggedIn) { if (goLogin) goLogin(); else go("signup"); return; } if (goReview) goReview(query); else go("review"); }}
                    style={{ width: "100%", maxWidth: 320, background: BRAND.green, color: "#fff", border: "none", padding: "13px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    ⭐ Be the first to review this address
                  </button>
                  {isLoggedIn && (
                    <button
                      onClick={async () => {
                        if (!isLoggedIn) { if (goLogin) goLogin(); else go("signup"); return; }
                        if (!query) return;
                        setSavingQuery(true);
                        if (querySaved) {
                          await unsaveAddress(query);
                          setQuerySaved(false);
                        } else {
                          await saveAddress(query);
                          setQuerySaved(true);
                        }
                        setSavingQuery(false);
                      }}
                      style={{ width: "100%", maxWidth: 320, background: querySaved ? "#F0FDF4" : "#F8FAFC", color: querySaved ? "#166534" : BRAND.gray, border: `1px solid ${querySaved ? "#86EFAC" : BRAND.border}`, padding: "11px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                      {savingQuery ? "..." : querySaved ? "★ Watching this address" : "☆ Watch this address for new reviews"}
                    </button>
                  )}
                  <button onClick={() => { setError(null); setQuery(""); setQuerySaved(false); }}
                    style={{ background: "none", border: "none", color: BRAND.gray, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    ← Search a different address
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {!loading && results && (
          <>
            <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 13, color: BRAND.gray }}>
                {results.length} {results.length !== 1 ? t(lang, "home.resultsFoundPlural") : t(lang, "home.resultsFound")}
              </p>
              <button onClick={() => { setResults(null); setQuery(""); setError(null); }}
                style={{ background: "none", border: "none", color: BRAND.gray, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                {t(lang, "home.newSearch")}
              </button>
            </div>
            {results.map((a, i) => <AddressCard key={i} address={a} go={go} goLogin={goLogin} goReview={goReview} />)}
          </>
        )}

        {!results && !loading && !error && (
          <div style={{ background: `linear-gradient(135deg, ${BRAND.dark}, #1E3A5F)`, borderRadius: 18, padding: "1.75rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginTop: "0.5rem" }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#F8FAFC", marginBottom: 6 }}>{t(lang, "home.ctaTitle")}</h3>
              <p style={{ fontSize: 13, color: "#94A3B8" }}>{t(lang, "home.ctaBody")}</p>
            </div>
            <button onClick={() => { if (!isLoggedIn) { if (goLogin) goLogin(); else go("signup"); return; } if (goReview) goReview(query); else go("review"); }}
              style={{ background: BRAND.green, color: "#fff", border: "none", padding: "10px 22px", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              {t(lang, "home.ctaBtn")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
