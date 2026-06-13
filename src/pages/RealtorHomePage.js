import { SUPABASE_URL, SUPABASE_ANON_KEY, GOOGLE_MAPS_KEY } from "../config.js";
import { dbGet } from "../api/db";
import { useState, useEffect } from "react";
import { BRAND, Card } from "../components/UI";
import Logo from "../components/Logo";
import AddressInput from "../components/AddressInput";

const FREE_LOOKUP_LIMIT = 5;

const RATING_LABEL = (score) => {
  if (!score) return { label: "No data", color: BRAND.gray };
  if (score >= 4.5) return { label: "Excellent", color: "#16A34A" };
  if (score >= 3.5) return { label: "Good",      color: "#2563EB" };
  if (score >= 2.5) return { label: "Average",   color: "#D97706" };
  return               { label: "Poor",      color: "#DC2626" };
};

export default function RealtorHomePage({ go, user }) {

  useEffect(() => {
    document.title = "ProRated Realtor Portal — Property Intelligence";
    const desc = document.querySelector("meta[name='description']");
    if (desc) desc.setAttribute("content", "Look up any residential address to see contractor work history, payment ratings, and job site scores. Disclosure-ready property intelligence for Alabama realtors.");
    const og = document.querySelector("meta[property='og:title']");
    if (og) og.setAttribute("content", "ProRated Realtor Portal — Property Intelligence");
    const ogDesc = document.querySelector("meta[property='og:description']");
    if (ogDesc) ogDesc.setAttribute("content", "Look up any residential address to see contractor work history, payment ratings, and job site scores. Disclosure-ready property intelligence for Alabama realtors.");
    return () => {
      document.title = "ProRated — Bidding Made Better";
      if (desc) desc.setAttribute("content", "Contractor-to-contractor job site ratings. Know access, payment history, obstacles before you bid.");
    };
  }, []);

  const [query, setQuery]     = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError]     = useState(null);
  const [lookups, setLookups] = useState(0);

  // PWA install prompt for realtors
  const [showInstall, setShowInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone;
    if (isStandalone) return;

    // Check if already dismissed
    try { if (localStorage.getItem('pr_realtor_install_dismissed')) return; } catch {}

    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (ios) { setIsIOS(true); setShowInstall(true); return; }

    // Android/Chrome install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstall(true);
    });
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') setShowInstall(false);
    }
    setShowInstall(false);
  };

  const dismissInstall = () => {
    try { localStorage.setItem('pr_realtor_install_dismissed', '1'); } catch {}
    setShowInstall(false);
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem("pr_realtor_token");
      localStorage.removeItem("pr_realtor_user");
    } catch {}
    go("realtor-signup");
  };

  const search = async (q = query) => {
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 5) return;

    const realtorUser = (() => { try { return JSON.parse(localStorage.getItem("pr_realtor_user") || "{}"); } catch { return {}; } })();
    if (lookups >= FREE_LOOKUP_LIMIT && realtorUser?.plan !== "pro" && user?.plan !== "pro") {
      setError("limit");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const street = trimmed.split(",")[0].trim();
      // Use realtor session token if available, fall back to anon key
      const data = await dbGet(`/reviews`, {
        "address": `ilike.%${street}%`,
        "select": "overall_score,payment_score,access_score,communication_score,timeline_score,obstacles_score,work_category,work_item,work_label,created_at,trade,review_text",
        "order": "created_at.desc"
      });

      if (!Array.isArray(data) || data.length === 0) {
        setError("none");
      } else {
        setResults({ address: trimmed, reviews: data });
        setLookups(l => l + 1);

        // Log the lookup
        if (user?.id) {
          fetch(`${SUPABASE_URL}/rest/v1/realtor_lookups`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Prefer": "return=minimal" },
            body: JSON.stringify({ user_id: user.id, address: trimmed }),
          }).catch(() => {});
        }
      }
    } catch {
      setError("error");
    } finally {
      setLoading(false);
    }
  };

  const avgScore = results ? (results.reviews.reduce((s, r) => s + (r.overall_score || 0), 0) / results.reviews.length).toFixed(1) : null;
  const rating = RATING_LABEL(parseFloat(avgScore));

  // Group work by category
  const workHistory = results ? results.reviews.reduce((acc, r) => {
    if (r.work_label) {
      const year = new Date(r.created_at).getFullYear();
      const key = r.work_label;
      if (!acc[key]) acc[key] = { label: key, category: r.work_category, years: [] };
      if (!acc[key].years.includes(year)) acc[key].years.push(year);
    }
    return acc;
  }, {}) : {};

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}>

      {/* PWA Install Banner */}
      {showInstall && (
        <div style={{ background: "#1E3A5F", borderBottom: "1px solid #2563EB", padding: "10px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ fontSize: 20, flexShrink: 0 }}>📲</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#F8FAFC", marginBottom: 2 }}>
              Add ProRated to your home screen
            </div>
            {isIOS ? (
              <div style={{ fontSize: 11, color: "#93C5FD", lineHeight: 1.5 }}>
                Tap the <strong style={{ color: "#fff" }}>Share button</strong> at the bottom of Safari, then tap <strong style={{ color: "#fff" }}>"Add to Home Screen"</strong>
              </div>
            ) : (
              <div style={{ fontSize: 11, color: "#93C5FD" }}>
                Install the app for faster access to property lookups
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
            {!isIOS && (
              <button onClick={handleInstall}
                style={{ background: "#2563EB", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Install
              </button>
            )}
            <button onClick={dismissInstall}
              style={{ background: "transparent", color: "#64748B", border: "none", fontSize: 16, cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}>
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: BRAND.dark, padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {results ? (
            <button onClick={() => { setResults(null); setError(null); setQuery(""); }}
              style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: "4px 0", display: "flex", alignItems: "center", gap: 4 }}>
              ← New Search
            </button>
          ) : (
            <>
              <Logo size={32} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#F8FAFC" }}>ProRated</div>
                <div style={{ fontSize: 10, color: "#94A3B8" }}>Realtor Portal</div>
              </div>
            </>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 11, color: "#94A3B8" }}>{Math.max(0, FREE_LOOKUP_LIMIT - lookups)} lookups left</div>
          <button onClick={handleSignOut}
            style={{ background: "transparent", color: "#94A3B8", border: "1px solid #334155", padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem 1.25rem 4rem" }}>

        {/* Search */}
        <div style={{ background: "#fff", border: `1.5px solid ${BRAND.border}`, borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1.25rem", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 8 }}>🔍 Search a property address</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ flex: 1, border: `1.5px solid ${BRAND.border}`, borderRadius: 10, padding: "4px 12px", background: "#F8FAFC" }}>
              <AddressInput
                value={query}
                onChange={setQuery}
                onSelect={(val) => { setQuery(val); }}
                placeholder="Enter property address..."
                inputStyle={{ fontSize: 13, padding: "7px 0" }}
              />
            </div>
            <button onClick={() => search()}
              style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
              Search
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "3rem", color: BRAND.gray, fontSize: 14 }}>
            <div style={{ width: 24, height: 24, border: `3px solid ${BRAND.border}`, borderTop: `3px solid ${BRAND.blue}`, borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
            Searching property records...
          </div>
        )}

        {/* Limit error */}
        {error === "limit" && (
          <div style={{ background: "#FEF9C3", border: "1px solid #FDE047", borderRadius: 14, padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>⚡</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#854D0E", marginBottom: 8 }}>Monthly lookup limit reached</div>
            <div style={{ fontSize: 13, color: "#92400E", marginBottom: 16 }}>Upgrade to Pro for unlimited address lookups</div>
            <button onClick={() => go("realtor-pricing")}
              style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              View Pro plans →
            </button>
          </div>
        )}

        {/* No results */}
        {error === "none" && (
          <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "2rem", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: BRAND.dark, marginBottom: 8 }}>No records found for this address</div>
            <div style={{ fontSize: 13, color: BRAND.gray, lineHeight: 1.65 }}>
              No contractor work has been reported at this address yet. 
              This could mean no recent work was done, or it hasn't been logged by a contractor.
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div style={{ animation: "fadeUp 0.4s ease both" }}>

            {/* Street View */}
            <div style={{ borderRadius: "16px 16px 0 0", overflow: "hidden", marginBottom: 0 }}>
              <img
                src={`https://maps.googleapis.com/maps/api/streetview?size=680x200&location=${encodeURIComponent(results.address)}&key=${GOOGLE_MAPS_KEY || import.meta.env.VITE_GOOGLE_MAPS_KEY}&return_error_code=true`}
                alt="Property"
                style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
                onError={e => { e.target.parentElement.style.display = "none"; }}
              />
            </div>

            {/* Address header */}
            <div style={{ background: BRAND.dark, borderRadius: results ? "0 0 16px 16px" : 16, borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Property Report</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#F8FAFC" }}>{results.address}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>{results.reviews.length} contractor record{results.reviews.length !== 1 ? "s" : ""} found</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: rating.color, lineHeight: 1 }}>{avgScore}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: rating.color }}>{rating.label}</div>
              </div>
            </div>

            {/* Work history */}
            {Object.keys(workHistory).length > 0 && (
              <Card style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: BRAND.dark, marginBottom: "0.85rem" }}>🔨 Work History</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.values(workHistory).map(({ label, years }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#F8FAFC", borderRadius: 10, border: `1px solid ${BRAND.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ background: "#F0FDF4", color: "#166534", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 8 }}>✓</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: BRAND.dark }}>{label}</span>
                      </div>
                      <span style={{ fontSize: 11, color: BRAND.gray, fontWeight: 600 }}>
                        {years.sort().reverse().join(", ")}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Rating breakdown */}
            <Card style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: BRAND.dark, marginBottom: "0.85rem" }}>⭐ Contractor Ratings</div>
              <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: "0.75rem" }}>
                Based on {results.reviews.length} verified trade professional report{results.reviews.length !== 1 ? "s" : ""}
              </div>
              {[
                { label: "Overall", scores: results.reviews.map(r => r.overall_score) },
              ].map(({ label, scores }) => {
                const avg = scores.filter(Boolean).reduce((a, b) => a + b, 0) / (scores.filter(Boolean).length || 1);
                return (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: BRAND.dark }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: BRAND.blue }}>{avg.toFixed(1)}/5</span>
                    </div>
                    <div style={{ height: 6, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(avg / 5) * 100}%`, background: avg >= 4 ? BRAND.green : avg >= 3 ? BRAND.blue : "#F59E0B", borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </Card>

            {/* Recent activity */}
            <Card style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: BRAND.dark, marginBottom: "0.85rem" }}>📅 Recent Activity</div>
              {results.reviews.slice(0, 5).map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < Math.min(results.reviews.length, 5) - 1 ? `1px solid ${BRAND.border}` : "none" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark }}>
                      {r.work_label || r.trade || "Work performed"}
                    </div>
                    <div style={{ fontSize: 11, color: BRAND.gray }}>
                      {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {"⭐".repeat(Math.round(r.overall_score || 0))}
                    <span style={{ fontSize: 11, color: BRAND.gray }}>{r.overall_score}/5</span>
                  </div>
                </div>
              ))}
            </Card>

            {/* Disclaimer */}
            <div style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: "12px 16px", fontSize: 11, color: BRAND.gray, lineHeight: 1.65 }}>
              ℹ️ This report is based on voluntary reviews submitted by licensed trade professionals. 
              Contractor names and sensitive bidding details are not shown. 
              ProRated does not independently verify all data. Use as supplemental information only.
            </div>
          </div>
        )}

        {/* Empty state */}
        {!results && !loading && !error && (
          <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏡</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: BRAND.dark, marginBottom: 8 }}>Search any property address</div>
            <div style={{ fontSize: 13, color: BRAND.gray, lineHeight: 1.65, maxWidth: 340, margin: "0 auto" }}>
              See verified work history, contractor ratings, and property intelligence — sourced directly from licensed trade professionals.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
