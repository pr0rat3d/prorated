import { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY, GOOGLE_MAPS_KEY } from "../config.js";
import { getSaleWarning, getOwnershipFlags, submitOwnershipFlag, isStaleReview, getAgeLabel } from "../api/ownershipDetection.js";
import { TRADES, ISSUE_TAGS, RATING_CATEGORIES } from "../data/constants";
import { Badge, Stars, Pill, Bar, Btn, BRAND } from "./UI";
import { useAuth } from "../hooks/useAuth";
import { saveAddress, unsaveAddress } from "../api/auth";
import { useLang } from "../hooks/useLang";
import { translateReviews } from "../api/translate";
import NearbyPlaces from "./NearbyPlaces";
import { t } from "../i18n/translations";
import ReviewCard from "./ReviewCard";
import BidPrepSummary from "./BidPrepSummary";
import BidIntelligence from "./BidIntelligence";
import { calculateBidScore } from "../utils/bidScoring";

const toTitleCase = (str) => {
  if (!str) return "";
  const lower = ["a","an","the","and","but","or","for","nor","on","at","to","by","in","of","up"];
  return str.replace(/\w\S*/g, (word, offset) => {
    if (offset > 0 && lower.includes(word.toLowerCase())) return word.toLowerCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
};

export default function AddressCard({ address, go, goLogin, goReview, demoMode = false }) {
  const [tradeFilter, setTradeFilter]       = useState("all");
  const [expanded, setExpanded]             = useState(false);
  const [saved, setSaved]                   = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [translatedReviews, setTranslated]  = useState(address.reviews || []);
  const [translating, setTranslating]       = useState(false);
  const [ownershipFlags, setOwnershipFlags] = useState([]);
  const [saleWarning, setSaleWarning]       = useState(null);
  const [flagging, setFlagging]             = useState(false);
  const [flagged, setFlagged]               = useState(false);
  const [showFlagModal, setShowFlagModal]   = useState(false);
  const [flagNote, setFlagNote]             = useState("");
  const [showBidPrep, setShowBidPrep]       = useState(false);
  const [svError, setSvError]               = useState(false);
  const [propertyType, setPropertyType]     = useState(null);
  const { isLoggedIn, user } = useAuth();
  const { lang } = useLang();

  // Translate reviews when language changes
  useEffect(() => {
    if (lang === "en") {
      setTranslated(address.reviews || []);
      return;
    }
    let cancelled = false;
    setTranslating(true);
    translateReviews(address.reviews || [], lang).then(translated => {
      if (!cancelled) {
        setTranslated(translated);
        setTranslating(false);
      }
    });
    return () => { cancelled = true; };
  }, [lang, address.reviews]);

  // Fetch community property type votes for this address
  useEffect(() => {
    if (!isLoggedIn) return;
    const streetName = (address.street || "").toLowerCase().trim().split(",")[0];
    if (!streetName || streetName.length < 5) return;
    // property_type isn't in anon's column grant — this only ever runs for
    // logged-in users, so it must use their own token, not the anon key.
    let token = SUPABASE_ANON_KEY;
    try { token = JSON.parse(localStorage.getItem("prorated_session") || "{}").access_token || SUPABASE_ANON_KEY; } catch {}
    fetch(
      `${SUPABASE_URL}/rest/v1/reviews?select=property_type&address=ilike.${encodeURIComponent("%" + streetName + "%")}&property_type=not.is.null`,
      { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${token}` } }
    )
    .then(r => r.ok ? r.json() : [])
    .then(rows => {
      if (!Array.isArray(rows) || !rows.length) return;
      const votes = {};
      rows.forEach(r => { if (r.property_type) votes[r.property_type] = (votes[r.property_type] || 0) + 1; });
      const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
      if (sorted.length) setPropertyType({ type: sorted[0][0], votes: sorted[0][1], total: rows.length });
    })
    .catch(() => {});
  }, [address.street]);

  const handleFlag = async () => {
    if (!isLoggedIn) { go("signup"); return; }
    setFlagging(true);
    const addr = `${address.street}, ${address.city}, ${address.state}`;
    // demoMode addresses aren't real properties — never write a real
    // ownership-change flag for one.
    if (!demoMode) await submitOwnershipFlag(addr, user?.id, flagNote);
    setFlagged(true);
    setFlagging(false);
    setShowFlagModal(false);
    // Update warning
    const newFlags = [...ownershipFlags, { address: addr, created_at: new Date().toISOString() }];
    setOwnershipFlags(newFlags);
    setSaleWarning(getSaleWarning(address.reviews || [], newFlags));
  };

  const handleSave = async () => {
    if (!isLoggedIn) { if (goLogin) goLogin(); else go("signup"); return; }
    setSaving(true);
    const fullAddress = `${toTitleCase(address.street)}, ${toTitleCase(address.city)}, ${address.state} ${address.zip || ""}`.trim();
    // demoMode addresses aren't real properties — toggle the UI only, never
    // write a fake address into a real user's saved_addresses list.
    if (demoMode) {
      setSaved(s => !s);
    } else if (saved) {
      await unsaveAddress(fullAddress);
      setSaved(false);
    } else {
      await saveAddress(fullAddress);
      setSaved(true);
    }
    setSaving(false);
  };
  const tradesPresent = [...new Set((address.reviews || []).map(r => r.trade))];
  const filtered = tradeFilter === "all" ? translatedReviews : translatedReviews.filter(r => r.trade === tradeFilter);
  const shown = expanded ? filtered : filtered.slice(0, 2);
  const hdrBg = address.overallScore >= 4 ? "#F0FDF4" : address.overallScore >= 3 ? "#FEFCE8" : "#FFF1F2";
  const hdrBorder = address.overallScore >= 4 ? "#BBF7D0" : address.overallScore >= 3 ? "#FEF08A" : "#FECDD3";

  const fullAddr = `${toTitleCase(address.street)}, ${toTitleCase(address.city)}, ${address.state}`.trim();
  const svUrl = fullAddr && GOOGLE_MAPS_KEY
    ? `https://maps.googleapis.com/maps/api/streetview?size=600x220&location=${encodeURIComponent(fullAddr)}&key=${GOOGLE_MAPS_KEY}&return_error_code=true&fov=90&pitch=5`
    : null;

  const streetViewBanner = svUrl && !svError ? (
    <div style={{ width: "100%", height: 180, position: "relative", background: "#E2E8F0", overflow: "hidden" }}>
      <img
        src={svUrl}
        alt="Street view"
        onError={() => setSvError(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <div style={{ position: "absolute", bottom: 6, right: 8, background: "rgba(0,0,0,0.45)", color: "#fff", fontSize: 9, padding: "2px 6px", borderRadius: 4, fontFamily: "'DM Sans', sans-serif" }}>
        Google Street View
      </div>
    </div>
  ) : svError ? (
    <div style={{ width: "100%", height: 80, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <span style={{ fontSize: 20 }}>🏠</span>
      <span style={{ fontSize: 12, color: BRAND.gray }}>No street view available for this address</span>
    </div>
  ) : null;

  // Unauthenticated users only ever see the confirmed address + a lock card —
  // no rating, count, timing, or any other review-derived signal.
  if (!isLoggedIn) {
    return (
      <div style={{ background: "#FFF", border: `1px solid ${BRAND.border}`, borderRadius: 20, overflow: "hidden", marginBottom: "1.5rem", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", animation: "fadeUp 0.4s ease both" }}>
        {streetViewBanner}

        <div style={{ padding: "1.1rem 1.35rem 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
            <span style={{ fontSize: 16 }}>📍</span>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: BRAND.dark, margin: 0 }}>{toTitleCase(address.street)}</h2>
          </div>
          <div style={{ fontSize: 12, color: BRAND.gray, marginLeft: 23 }}>{toTitleCase(address.city)}, {address.state} {address.zip}</div>
        </div>

        <div style={{ padding: "1.25rem 1.35rem 1.5rem" }}>
          <div style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 10, color: BRAND.blue }}>🔒</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: BRAND.dark, marginBottom: 6 }}>Job site intelligence available</div>
            <p style={{ fontSize: 12.5, color: BRAND.gray, lineHeight: 1.6, marginBottom: 16, maxWidth: 340, marginLeft: "auto", marginRight: "auto" }}>
              This address has been reviewed by verified licensed trade professionals. Create your free account to access full job site data.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => go("signup")}
                style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "11px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Sign up free →
              </button>
              <button onClick={() => { if (goLogin) goLogin(); else go("signup"); }}
                style={{ background: "#F1F5F9", color: BRAND.dark, border: "none", padding: "11px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div style={{ background: "#FFF", border: `1px solid ${BRAND.border}`, borderRadius: 20, overflow: "hidden", marginBottom: "1.5rem", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", animation: "fadeUp 0.4s ease both" }}>

      {/* Street View Banner */}
      {streetViewBanner}

      {/* Header */}
      <div style={{ padding: "1.1rem 1.35rem", background: hdrBg, borderBottom: `1px solid ${hdrBorder}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
              <span style={{ fontSize: 16 }}>📍</span>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: BRAND.dark, margin: 0 }}>{toTitleCase(address.street)}</h2>
            </div>
            <div style={{ fontSize: 12, color: BRAND.gray, marginLeft: 23 }}>{toTitleCase(address.city)}, {address.state} {address.zip}</div>
            {propertyType && (
              <div style={{ marginLeft: 23, marginTop: 5, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  background: propertyType.type === "homestead" ? "#F0FDF4" : propertyType.type === "rental" ? "#FFF7ED" : propertyType.type === "commercial" ? "#F5F3FF" : "#EFF6FF",
                  color:      propertyType.type === "homestead" ? "#166534" : propertyType.type === "rental" ? "#C2410C" : propertyType.type === "commercial" ? "#6D28D9" : "#1E40AF",
                  border:     `1px solid ${propertyType.type === "homestead" ? "#86EFAC" : propertyType.type === "rental" ? "#FED7AA" : propertyType.type === "commercial" ? "#C4B5FD" : "#BFDBFE"}`,
                  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
                }}>
                  {propertyType.type === "homestead" ? "🏠 Primary Home" : propertyType.type === "rental" ? "🔑 Rental Property" : propertyType.type === "commercial" ? "🏢 Commercial / Business" : "🌴 Secondary / Vacation"}
                </span>
                <span style={{ fontSize: 9, color: "#94A3B8" }}>
                  {propertyType.votes}/{propertyType.total} trade professional{propertyType.total !== 1 ? "s" : ""} identified
                </span>
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, justifyContent: "flex-end", marginBottom: 3 }}>
              <Badge score={address.overallScore} large />
              <Stars score={address.overallScore} size={15} />
            </div>
            <div style={{ fontSize: 11, color: BRAND.gray }}>{address.reviewCount} contractor reviews</div>
            {address.reviews?.length > 0 && (() => {
              const latest = address.reviews.reduce((a, b) =>
                new Date(a.date) > new Date(b.date) ? a : b
              );
              const days = Math.floor((Date.now() - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24));
              const label = days === 0 ? "Today" : days === 1 ? "Yesterday" : days < 30 ? `${days}d ago` : days < 365 ? `${Math.floor(days/30)}mo ago` : `${Math.floor(days/365)}yr ago`;
              const fresh = days < 90;
              return (
                <div style={{ fontSize: 10, color: fresh ? "#166534" : "#854D0E", background: fresh ? "#DCFCE7" : "#FEF9C3", padding: "2px 7px", borderRadius: 10, fontWeight: 600, marginTop: 2, display: "inline-block" }}>
                  {fresh ? "🟢" : "🟡"} Most recent: {label}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      {/* Ratings */}
      {/* Ownership / Sale Warning Banner */}
      {saleWarning && (
        <div style={{
          background: saleWarning.level === "high" ? "#FFF7ED" : saleWarning.level === "medium" ? "#FFFBEB" : "#F0F9FF",
          borderBottom: `1px solid ${saleWarning.level === "high" ? "#FED7AA" : saleWarning.level === "medium" ? "#FEF08A" : "#BAE6FD"}`,
          padding: "10px 1.35rem",
          display: "flex", gap: 8, alignItems: "flex-start"
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{saleWarning.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: saleWarning.level === "high" ? "#C2410C" : saleWarning.level === "medium" ? "#854D0E" : "#0369A1", marginBottom: 2 }}>
              Possible Ownership Change
            </div>
            <div style={{ fontSize: 11, color: saleWarning.level === "high" ? "#9A3412" : saleWarning.level === "medium" ? "#713F12" : "#0C4A6E", lineHeight: 1.5 }}>
              {saleWarning.message}
            </div>
          </div>
        </div>
      )}

      {/* Flag ownership change button */}
      {isLoggedIn && !flagged && !demoMode && (
        <div style={{ padding: "6px 1.35rem", background: "#F8FAFC", borderBottom: `1px solid #F1F5F9`, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => setShowFlagModal(true)}
            style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
            🏠 Flag ownership change
          </button>
        </div>
      )}
      {flagged && (
        <div style={{ padding: "6px 1.35rem", background: "#F0FDF4", borderBottom: `1px solid #BBF7D0`, textAlign: "right" }}>
          <span style={{ fontSize: 10, color: "#166534", fontWeight: 600 }}>✓ Flagged — thanks for helping the community</span>
        </div>
      )}

      {/* Flag modal */}
      {showFlagModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 380, fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: BRAND.dark, marginBottom: 8 }}>🏠 Flag Ownership Change</div>
            <p style={{ fontSize: 13, color: BRAND.gray, marginBottom: 16, lineHeight: 1.6 }}>
              Let other trade professionals know the homeowner may have changed at this address. This helps keep ratings accurate.
            </p>
            <textarea
              value={flagNote}
              onChange={e => setFlagNote(e.target.value)}
              placeholder="Optional: When did you notice the change? (e.g. 'New owners since Spring 2024')"
              rows={3}
              style={{ width: "100%", padding: "10px", border: `1px solid ${BRAND.border}`, borderRadius: 10, fontSize: 12, fontFamily: "'DM Sans', sans-serif", resize: "none", outline: "none", boxSizing: "border-box", marginBottom: 14 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowFlagModal(false)}
                style={{ flex: 1, background: "#F1F5F9", color: BRAND.gray, border: "none", padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Cancel
              </button>
              <button onClick={handleFlag} disabled={flagging}
                style={{ flex: 1, background: BRAND.dark, color: "#fff", border: "none", padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: flagging ? 0.7 : 1 }}>
                {flagging ? "Submitting..." : "Submit Flag"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "1rem 1.35rem", borderBottom: `1px solid #F1F5F9` }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "8px 24px" }}>
          {RATING_CATEGORIES.map(cat => (
            <div key={cat.id}>
              <div style={{ fontSize: 11, color: BRAND.gray, fontWeight: 600, marginBottom: 3 }}>{t(lang, `categories.${cat.id}`)}</div>
              <Bar score={address.ratings?.[cat.id] || 0} />
            </div>
          ))}
        </div>
      </div>
      {/* Tags */}
      <div style={{ padding: "0.75rem 1.35rem", borderBottom: `1px solid #F1F5F9`, display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: BRAND.gray, textTransform: "uppercase", letterSpacing: "0.5px", marginRight: 4 }}>Flagged</span>
        {(address.tags || []).map(tid => { const tagObj = ISSUE_TAGS.find(x => x.id === tid); return tagObj ? <Pill key={tid} label={tagObj.label} sev={tagObj.severity} selected /> : null; })}
      </div>
      {/* Trade filter */}
      <div style={{ padding: "0.6rem 1.35rem", borderBottom: `1px solid #F1F5F9`, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: BRAND.gray, marginRight: 3 }}>Filter by trade:</span>
        {["all", ...tradesPresent].map(tid => {
          const tr = TRADES.find(t => t.id === tid);
          return <button key={tid} onClick={() => setTradeFilter(tid)}
            style={{ padding: "3px 10px", borderRadius: 20, border: "1.5px solid", borderColor: tradeFilter === tid ? BRAND.blue : "#CBD5E1", background: tradeFilter === tid ? BRAND.blue : "transparent", color: tradeFilter === tid ? "#fff" : BRAND.gray, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>
            {tid === "all" ? t(lang, "addressCard.allTrades") : `${tr?.icon} ${tr?.label}`}
          </button>;
        })}
      </div>
      {/* Reviews */}
      {translating && (
        <div style={{ padding: "0.5rem 1.35rem", fontSize: 11, color: BRAND.gray, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", border: `2px solid ${BRAND.border}`, borderTop: `2px solid ${BRAND.blue}`, animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
          Translating reviews...
        </div>
      )}
      <div style={{ padding: "0.25rem 1.35rem 1rem" }}>
        {filtered.length === 0
          ? <div style={{ textAlign: "center", padding: "1.5rem", color: BRAND.gray, fontSize: 13 }}>No reviews for this trade yet.</div>
          : <>{shown.map((r, i) => <ReviewCard key={r.id} review={r} idx={i} />)}
              {filtered.length > 2 && <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: "none", color: BRAND.blue, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "6px 0", fontFamily: "'DM Sans', sans-serif" }}>{expanded ? "↑ Show fewer" : `↓ ${filtered.length - 2} more`}</button>}
            </>
        }
      </div>
      {/* Bid Intelligence */}
      {translatedReviews.length > 0 && (
        <div style={{ padding: "0 1.35rem" }}>
          <BidIntelligence
            address={fullAddr}
            reviews={translatedReviews}
            bidScore={calculateBidScore(translatedReviews)}
            user={user}
            forceUnlock={demoMode}
          />
        </div>
      )}
      {/* Local Points of Interest — skipped in demoMode, address isn't real so
          there's nothing nearby to look up and it would just burn a real
          Places API call */}
      {!demoMode && (
        <NearbyPlaces
          address={`${toTitleCase(address.street)}, ${toTitleCase(address.city)}${address.state ? ", " + address.state : ""}`}
          trade={address.reviews?.[0]?.trade || "general"}
          go={go}
        />
      )}

      {/* Footer */}
      <div style={{ padding: "0.75rem 1.35rem", background: "#F8FAFC", borderTop: `1px solid ${BRAND.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: BRAND.gray }}>Worked here? Share your experience.</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setShowBidPrep(true)}
            style={{ background: "#1E3A5F", color: "#93C5FD", border: "1px solid #2563EB", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
            📋 Bid Prep
          </button>
          <button onClick={handleSave}
            style={{ background: saved ? "#DCFCE7" : "#F1F5F9", color: saved ? "#166534" : BRAND.gray, border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            {saving ? "..." : saved ? "★ Saved" : "☆ Save"}
          </button>
          {!demoMode && (
            <Btn small onClick={() => { const addr = `${address.street}, ${address.city}, ${address.state}`; if (goReview) goReview(addr); else go("review"); }}>+ Review</Btn>
          )}
        </div>
      </div>
    </div>

    {/* Bid Prep Modal */}
    {showBidPrep && (
      <BidPrepSummary
        address={address}
        onClose={() => setShowBidPrep(false)}
      />
    )}
    </>
  );
}
