import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { useState, useEffect, useRef } from "react";
import { TRADES, ISSUE_TAGS, DASH_REVIEWS, BRAND, FREE_PLAN_LABEL, COMPANY_TIERS } from "../data/constants";
import { Badge, Stars, Pill, Btn, Card } from "../components/UI";
import { useAuth } from "../hooks/useAuth";



import { fetchMyReviews, updateReview, deleteReview } from "../api/supabase";
import { getSavedAddresses, unsaveAddress, signIn, updatePassword } from "../api/auth";
import { isNativeIOS, IOS_SUBSCRIPTION_MSG } from "../utils/platform";
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

export default function DashboardPage({ go, goBack, goLogin, goReview, paymentSuccess, onPaymentAck }) {
  const { user, logout, isLoggedIn, refreshUser } = useAuth();

  const [planUpdated, setPlanUpdated] = useState(false);

  // On payment success: refresh immediately then again after 4s for webhook lag
  useEffect(() => {
    if (paymentSuccess && refreshUser) {
      setPlanUpdated(true);
      // Immediate refresh (catches fast webhooks)
      refreshUser();
      // Second refresh after 4s (catches slow webhooks)
      const t = setTimeout(() => {
        refreshUser();
        // Auto-dismiss banner after 6s total
        setTimeout(() => { setPlanUpdated(false); if (onPaymentAck) onPaymentAck(); }, 2000);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [paymentSuccess]);
  const { subscribed, permission, subscribe, unsubscribe } = usePush();
  const { lang } = useLang();

  const [tab, setTab]           = useState("reviews");
  const reviewPoints   = user?.review_points || 0;
  const [expandedReview, setExpandedReview] = useState(null);
  const pointsValue    = (reviewPoints * 0.25).toFixed(2);

  // ── Company state ─────────────────────────────────────────
  const [company, setCompany]       = useState(null);
  const [companyMembers, setMembers] = useState([]);
  const [companyLoading, setCoLoad]  = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInvLoad]   = useState(false);
  const [inviteSuccess, setInvSuccess] = useState(false);
  const [inviteError, setInvError]    = useState(null);
  const [showTeamSettings, setShowTeamSettings] = useState(false);
  const [renamingCompany, setRenamingCompany]   = useState(false);
  const [newCompanyName, setNewCompanyName]     = useState("");
  const [renameLoading, setRenameLoading]       = useState(false);
  const companyDeletedRef = useRef(false); // prevents refetch after delete
  const [seatError, setSeatError]     = useState(null);
  const [showPwChange, setShowPwChange] = useState(false);
  const [pwForm, setPwForm]             = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError]           = useState(null);
  const [pwSuccess, setPwSuccess]       = useState(false);
  const [pwLoading, setPwLoading]       = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  const handlePasswordChange = async () => {
    setPwError(null);
    if (!pwForm.current)               { setPwError("Please enter your current password."); return; }
    if (pwForm.next.length < 6)        { setPwError("New password must be at least 6 characters."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("New passwords don't match."); return; }
    if (pwForm.next === pwForm.current) { setPwError("New password must be different from your current password."); return; }
    setPwLoading(true);
    try {
      await signIn({ email: user.email, password: pwForm.current });
      await updatePassword(pwForm.next);
      setPwSuccess(true);
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => { setPwSuccess(false); setShowPwChange(false); }, 3000);
    } catch (err) {
      if (err.message?.toLowerCase().includes("invalid")) {
        setPwError("Current password is incorrect.");
      } else {
        setPwError(err.message || "Could not update password. Please try again.");
      }
    }
    setPwLoading(false);
  };
  const handleDeleteAccount = async () => {
    if (!window.confirm("Request account deletion? Your data will be permanently removed and cannot be recovered.")) return;
    setDeleteAccountLoading(true);
    try {
      const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
      const token = session.access_token;
      await fetch(`${SUPABASE_URL}/rest/v1/contractors?id=eq.${user.id}`, {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deletion_requested: true }),
      });
      await logout();
      go("home");
    } catch (err) {
      console.warn("[ProRated] Delete account error:", err);
      setDeleteAccountLoading(false);
    }
  };

  const [saved, setSaved]       = useState([]);
  const [loadingSaved, setLS]   = useState(false);
  const [myReviews, setMyReviews] = useState([]);
  const [loadingReviews, setLR]   = useState(false);

  useEffect(() => {
    if (isLoggedIn && tab === "company" && !companyDeletedRef.current) {
      fetchCompanyData();
    }
  }, [tab, isLoggedIn]);

  // Pre-fetch company data on mount if user has a company_id — avoids delay on tab click
  useEffect(() => {
    if (isLoggedIn && !companyDeletedRef.current) {
      const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
      if (session.user?.company_id) fetchCompanyData();
    }
  }, [isLoggedIn]);

  const fetchCompanyData = async () => {
    setCoLoad(true);
    try {
      const session   = JSON.parse(localStorage.getItem("prorated_session") || "{}");
      const token     = session.access_token;
      if (!token) return;
      const companyId = session.user?.company_id;

      // Use company_id from session if available (avoids stale owner_id query)
      const url = companyId
        ? `${SUPABASE_URL}/rest/v1/companies?id=eq.${companyId}&select=*&limit=1`
        : `${SUPABASE_URL}/rest/v1/companies?owner_id=eq.${user.id}&select=*&order=created_at.desc&limit=1`;

      const compRes   = await fetch(url, {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${token}` }
      });
      const companies = await compRes.json();
      if (companies?.[0]) {
        setCompany(companies[0]);
        const memRes = await fetch(
          `${SUPABASE_URL}/rest/v1/contractors?company_id=eq.${companies[0].id}&select=id,name,email,trade,status,company_role,created_at`,
          { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${token}` } }
        );
        const members = await memRes.json();
        setMembers(members || []);
      }
    } catch (err) {
      console.warn("[ProRated] Company fetch error:", err);
    }
    setCoLoad(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail || !company) return;
    setInvLoad(true); setInvError(null); setInvSuccess(false);
    try {
      const session     = JSON.parse(localStorage.getItem("prorated_session") || "{}");
      const token       = session.access_token;
      const seatLimit   = COMPANY_TIERS[company.plan]?.seatLimit || 5;
      if (companyMembers.length >= seatLimit) {
        setSeatError(`Seat limit reached (${seatLimit}). Upgrade your plan to add more team members.`);
        setInvLoad(false);
        return;
      }
      setSeatError(null);

      // Generate unique token for invite link
      const inviteToken = crypto.randomUUID();
      const expiresAt   = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Create invite record with token
      await fetch(`${SUPABASE_URL}/rest/v1/invites`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          company_id:  company.id,
          email:       inviteEmail.toLowerCase().trim(),
          invited_by:  user.id,
          token:       inviteToken,
          expires_at:  expiresAt,
        }),
      });

      // Send invite email
      try {
        const emailRes = await fetch(`${SUPABASE_URL}/functions/v1/send-approval-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
          body: JSON.stringify({
            type:          "invite",
            inviteEmail:   inviteEmail.toLowerCase().trim(),
            companyName:   company.name,
            invitedByName: user.name || user.email,
            inviteLink:    `https://prorated.app/invite/${inviteToken}`,
          }),
        });
        if (!emailRes.ok) console.warn("[ProRated] Invite email failed:", emailRes.status, await emailRes.text().catch(() => ""));
      } catch (emailErr) {
        console.warn("[ProRated] Invite email error:", emailErr);
      }

      setInvSuccess(true);
      setInviteEmail("");
      setTimeout(() => setInvSuccess(false), 3000);
    } catch (err) {
      setInvError("Could not send invite. Please try again.");
    }
    setInvLoad(false);
  };

  const handleRemoveMember = async (memberId) => {
    if (!company) return;
    if (!window.confirm("Remove this member from your team? They'll keep their account but lose access to team features.")) return;
    try {
      const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
      const token   = session.access_token;
      await fetch(
        `${SUPABASE_URL}/rest/v1/contractors?id=eq.${memberId}`,
        {
          method: "PATCH",
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ company_id: null, company_role: null }),
        }
      );
      setMembers(m => m.filter(x => x.id !== memberId));
    } catch (err) {
      console.warn("[ProRated] Remove member error:", err);
    }
  };

  const handleRenameCompany = async () => {
    if (!company || !newCompanyName.trim()) return;
    setRenameLoading(true);
    try {
      const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
      const token   = session.access_token;
      await fetch(`${SUPABASE_URL}/rest/v1/companies?id=eq.${company.id}`, {
        method: "PATCH",
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCompanyName.trim() }),
      });
      setCompany(c => ({ ...c, name: newCompanyName.trim() }));
      setRenamingCompany(false);
      setNewCompanyName("");
    } catch (err) {
      console.warn("[ProRated] Rename company error:", err);
    }
    setRenameLoading(false);
  };

  const handleDeleteTeam = async () => {
    if (!company) return;
    if (!window.confirm(`Delete "${company.name}" and remove all team members? This cannot be undone.`)) return;
    try {
      const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
      const token   = session.access_token;

      // Remove company_id from ALL members (including owner)
      await fetch(`${SUPABASE_URL}/rest/v1/contractors?company_id=eq.${company.id}`, {
        method: "PATCH",
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: null, company_role: null }),
      });

      // Also explicitly null the current user's row in case RLS scoping missed it
      await fetch(`${SUPABASE_URL}/rest/v1/contractors?id=eq.${user.id}`, {
        method: "PATCH",
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: null, company_role: null }),
      });

      // Delete the company record
      await fetch(`${SUPABASE_URL}/rest/v1/companies?id=eq.${company.id}`, {
        method: "DELETE",
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${token}` },
      });

      // Update localStorage session — do NOT call refreshUser (would re-fetch company)
      if (session.user) {
        const updatedUser = { ...session.user, company_id: null, company_role: null };
        localStorage.setItem("prorated_session", JSON.stringify({ ...session, user: updatedUser }));
      }

      // Update React state directly — company is gone
      // Mark as deleted so tab switch won't re-fetch
      companyDeletedRef.current = true;
      setCompany(null);
      setMembers([]);
      setShowTeamSettings(false);
      setTab("reviews");
    } catch (err) {
      console.warn("[ProRated] Delete team error:", err);
    }
  };

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

      {/* Plan updated success banner */}
      {planUpdated && (
        <div style={{ background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🎉</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>Payment successful! Your plan is being activated.</div>
            <div style={{ fontSize: 12, color: "#15803D", marginTop: 2 }}>Your Team tab will appear once your plan is confirmed (usually within seconds).</div>
          </div>
        </div>
      )}

      {/* Pending verification banner */}
      {isLoggedIn && user?.status === "pending" && (
        <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E" }}>⏳ Verification in progress</div>
          <div style={{ fontSize: 11, color: "#92400E", marginTop: 2 }}>You can browse while you wait — reviews unlock once approved (usually under 24hrs)</div>
        </div>
      )}

      {/* Profile header */}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 52, height: 52, background: BRAND.blue, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 800 }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 19, fontWeight: 800, color: BRAND.dark, margin: 0 }}>{displayName}</h1>
              {isLoggedIn && user?.status === "approved" && <span style={{ background: "#DCFCE7", color: "#166534", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>✓ MEMBER</span>}
              {isLoggedIn && user?.status === "pending"  && <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>⏳ PENDING</span>}
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
          [myReviews.length.toString(),              t(lang,"dashboard.reviewsSubmitted"), ""],
          [(user?.helpful_count ?? 0).toString(),    "Helpful votes", "From peers"],
          [saved.length.toString(),                  "Saved",         "Watching"],
          [(user?.trust_score ?? 0).toString(),      "Trust score",   "Reviewer rating"],
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
              You're all set!
            </h2>
            <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, marginBottom: 24 }}>
              Your plan is now active. You have full access to all features included with your tier — including unlimited address lookups and team management.
            </p>

            {/* Plan features list */}
            <div style={{ background: "#F0FDF4", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: 24, textAlign: "left" }}>
              {[
                "✓  Unlimited address lookups",
                "✓  Full 5-category rating breakdowns",
                "✓  Bid Prep Summary + Would-Return rate",
                "✓  Team logins (based on your plan)",
                "✓  Push notifications for saved addresses",
                "✓  Local Points of Interest",
                "✓  Watchlist alerts before you bid",
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
        {[["reviews", t(lang,"dashboard.myReviews")],["saved", t(lang,"dashboard.savedAddresses")],["profile", t(lang,"dashboard.profile")],...(user?.plan && user.plan !== "free" ? [["company","🏗️ Team"]] : [])].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: "9px 16px", border: "none", background: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: tab === id ? BRAND.dark : BRAND.gray, borderBottom: tab === id ? `2px solid ${BRAND.blue}` : "2px solid transparent", marginBottom: -2, transition: "color 0.15s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* My Reviews */}
      {tab === "reviews" && (
        <>
          {/* Review activity — replaced old reward system */}
        {myReviews.length > 0 && (
          <div style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1rem" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#166534" }}>
              🛡️ {myReviews.length} review{myReviews.length !== 1 ? "s" : ""} submitted
            </div>
            <div style={{ fontSize: 11, color: "#15803D", marginTop: 4 }}>
              Your reviews help the whole community bid smarter. Keep it up.
            </div>
          </div>
        )}
        </>
      )}
      {tab === "reviews" && (
        <div>
          {loadingReviews ? (
            <div style={{ textAlign: "center", padding: "2rem", color: BRAND.gray, fontSize: 13 }}>Loading reviews...</div>
          ) : myReviews.length === 0 ? (
            <Card style={{ textAlign: "center", padding: "1.5rem" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.dark, marginBottom: 4 }}>No reviews yet</div>
              <div style={{ fontSize: 12, color: BRAND.gray, marginBottom: 16 }}>Your submitted reviews will appear here.</div>
              <Btn onClick={() => go("review")}>+ Leave your first review</Btn>
            </Card>
          ) : (
            myReviews.map(r => {
              const isExpanded = expandedReview === r.id;
              const tr = TRADES.find(t => t.id === r.trade);
              const score = r.overall_score ?? r.overallScore ?? r.overall ?? 0;
              const date = r.created_at || r.date;
              const tags = r.tags || [];
              const notes = r.review_text || r.text || "";
              const workLabel = r.work_label || r.workLabel || r.work_category || "";
              const wouldReturn = r.would_return;

              return (
                <Card key={r.id}
                  style={{ marginBottom: "0.85rem", cursor: "pointer", transition: "box-shadow 0.15s" }}
                  onClick={() => setExpandedReview(isExpanded ? null : r.id)}>

                  {/* Header row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        📍 {r.address ? toTitleCase(r.address) : "Address on file"}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <Stars score={score} size={12} />
                        <span style={{ fontSize: 11, color: BRAND.gray }}>
                          {tr?.icon} {tr?.label || r.trade}
                          {date && ` · ${new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <Badge score={score} />
                      <span style={{ fontSize: 16, color: BRAND.gray, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>⌄</span>
                    </div>
                  </div>

                  {/* Tags preview (collapsed) */}
                  {!isExpanded && tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                      {tags.slice(0, 4).map(tid => {
                        const tag = ISSUE_TAGS.find(x => x.id === tid);
                        return tag ? <Pill key={tid} label={tag.label} sev={tag.severity} small selected /> : null;
                      })}
                      {tags.length > 4 && <span style={{ fontSize: 11, color: BRAND.gray, alignSelf: "center" }}>+{tags.length - 4} more</span>}
                    </div>
                  )}

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ marginTop: 14, borderTop: `1px solid ${BRAND.border}`, paddingTop: 14 }}
                      onClick={e => e.stopPropagation()}>

                      {/* Work type */}
                      {workLabel && (
                        <div style={{ fontSize: 12, color: BRAND.gray, marginBottom: 10 }}>
                          🔧 <strong>Work type:</strong> {workLabel}
                        </div>
                      )}

                      {/* Would return */}
                      {wouldReturn !== null && wouldReturn !== undefined && (
                        <div style={{ fontSize: 12, marginBottom: 10 }}>
                          {wouldReturn
                            ? <span style={{ color: "#16A34A", fontWeight: 600 }}>👍 Would return to this job site</span>
                            : <span style={{ color: "#DC2626", fontWeight: 600 }}>👎 Would not return to this job site</span>}
                        </div>
                      )}

                      {/* All tags */}
                      {tags.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                          {tags.map(tid => {
                            const tag = ISSUE_TAGS.find(x => x.id === tid);
                            return tag ? <Pill key={tid} label={tag.label} sev={tag.severity} small selected /> : null;
                          })}
                        </div>
                      )}

                      {/* Notes */}
                      {notes && (
                        <div style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 12, color: BRAND.dark, lineHeight: 1.6, marginBottom: 10 }}>
                          "{notes}"
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: BRAND.gray }}>👍 {r.helpful_count || r.helpfulCount || 0} found helpful</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => go("home", r.address || "")}
                            style={{ background: "#EFF6FF", border: `1px solid #BFDBFE`, color: BRAND.blue, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 7, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                            🏠 View
                          </button>
                          <button
                            onClick={() => goReview ? goReview(r.address || "", r.id) : go("review")}
                            style={{ background: "none", border: `1px solid ${BRAND.border}`, color: BRAND.gray, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 7, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                            ✏️ Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm("Delete this review? This cannot be undone.")) return;
                              const ok = await deleteReview(r.id);
                              if (ok) setMyReviews(prev => prev.filter(x => x.id !== r.id));
                            }}
                            style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#DC2626", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 7, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
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

      {/* Company / Team */}
      {tab === "company" && (
        <div style={{ animation: "fadeUp 0.25s ease both" }}>
          {(() => {
            const currentUserIsOwner = user?.company_role === "owner" || (company && company.owner_id === user?.id);
            return (
          companyLoading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: BRAND.gray, fontSize: 13 }}>Loading team data...</div>
          ) : !company ? (
            // No company yet — only owners/paid solos see setup CTA; members shouldn't reach here
            user?.company_role === "member" ? (
              <Card>
                <div style={{ textAlign: "center", padding: "1rem 0" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.dark, marginBottom: 6 }}>Team loading…</div>
                  <div style={{ fontSize: 13, color: BRAND.gray }}>Your team info is syncing. Try refreshing in a moment.</div>
                </div>
              </Card>
            ) : (
            <Card>
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🏗️</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.dark, marginBottom: 6 }}>Set up your company account</div>
                <div style={{ fontSize: 13, color: BRAND.gray, marginBottom: 20, lineHeight: 1.6 }}>
                  Create a company profile to invite your team, manage seats, and track your collective review stats.
                </div>
                <Btn fullWidth onClick={() => go("company-setup")}>Set up company →</Btn>
              </div>
            </Card>
            )
          ) : (
            <>
              {/* Company header */}
              <Card style={{ marginBottom: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    {renamingCompany ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          autoFocus
                          value={newCompanyName}
                          onChange={e => setNewCompanyName(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") handleRenameCompany(); if (e.key === "Escape") setRenamingCompany(false); }}
                          placeholder={company.name}
                          style={{ fontSize: 15, fontWeight: 700, border: `1.5px solid ${BRAND.blue}`, borderRadius: 8, padding: "4px 8px", fontFamily: "'DM Sans', sans-serif", color: BRAND.dark, outline: "none", width: 180 }}
                        />
                        <button onClick={handleRenameCompany} disabled={renameLoading || !newCompanyName.trim()}
                          style={{ background: BRAND.blue, color: "#fff", border: "none", borderRadius: 7, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                          {renameLoading ? "..." : "Save"}
                        </button>
                        <button onClick={() => { setRenamingCompany(false); setNewCompanyName(""); }}
                          style={{ background: "none", border: `1px solid ${BRAND.border}`, borderRadius: 7, padding: "4px 10px", fontSize: 11, color: BRAND.gray, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: 16, fontWeight: 800, color: BRAND.dark }}>{company.name}</div>
                    )}
                    <div style={{ fontSize: 12, color: BRAND.gray, marginTop: 2 }}>
                      {COMPANY_TIERS[company.plan]?.icon} {COMPANY_TIERS[company.plan]?.name} Plan · ${COMPANY_TIERS[company.plan]?.price}/mo
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark }}>
                        {companyMembers.length} / {company.plan === "gold" ? "∞" : COMPANY_TIERS[company.plan]?.seatLimit} seats
                      </div>
                      <div style={{ fontSize: 10, color: BRAND.gray }}>team members</div>
                    </div>
                    {currentUserIsOwner && (
                      <button onClick={() => setShowTeamSettings(s => !s)}
                        title="Team settings"
                        style={{ background: showTeamSettings ? "#EFF6FF" : "#F1F5F9", border: `1px solid ${showTeamSettings ? BRAND.blue : BRAND.border}`, borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, fontSize: 14 }}>
                        ⚙️
                      </button>
                    )}
                  </div>
                </div>

                {/* Seat usage bar */}
                <div style={{ height: 6, background: BRAND.border, borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min((companyMembers.length / (COMPANY_TIERS[company.plan]?.seatLimit || 5)) * 100, 100)}%`,
                    background: companyMembers.length >= (COMPANY_TIERS[company.plan]?.seatLimit || 5) ? "#DC2626" : BRAND.blue,
                    borderRadius: 3,
                    transition: "width 0.4s ease",
                  }} />
                </div>

                {company.trial_ends_at && new Date(company.trial_ends_at) > new Date() && (
                  <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 8, padding: "6px 10px", fontSize: 11, color: "#166534", fontWeight: 600 }}>
                    🎁 Free trial active — billing starts {new Date(company.trial_ends_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                )}

                {/* Team settings panel */}
                {showTeamSettings && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BRAND.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, marginBottom: 10 }}>Team Settings</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button
                        onClick={() => { setRenamingCompany(true); setNewCompanyName(company.name); setShowTeamSettings(false); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 9, padding: "9px 12px", fontSize: 12, fontWeight: 600, color: BRAND.dark, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
                        ✏️ Rename company
                      </button>
                      <button
                        onClick={() => go("pricing")}
                        style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 9, padding: "9px 12px", fontSize: 12, fontWeight: 600, color: BRAND.dark, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
                        ⬆️ Upgrade / change plan
                      </button>
                      <button
                        onClick={handleDeleteTeam}
                        style={{ display: "flex", alignItems: "center", gap: 8, background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 9, padding: "9px 12px", fontSize: 12, fontWeight: 600, color: "#DC2626", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
                        🗑️ Delete team workspace
                      </button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Invite member — owners only */}
              {currentUserIsOwner && <Card style={{ marginBottom: "0.85rem" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 4 }}>Invite a team member</div>
                <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: 12 }}>They'll get an email to create their ProRated account and join your team.</div>

                {seatError && (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#991B1B", marginBottom: 10 }}>
                    {seatError}
                    {!isNativeIOS() && <button onClick={() => go("pricing")} style={{ background: "none", border: "none", color: BRAND.blue, fontSize: 12, fontWeight: 700, cursor: "pointer", marginLeft: 8, fontFamily: "'DM Sans', sans-serif" }}>Upgrade →</button>}
                  </div>
                )}

                {inviteSuccess && (
                  <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#166534", fontWeight: 600, marginBottom: 10 }}>
                    ✅ Invite sent! They'll receive an email shortly.
                  </div>
                )}

                {inviteError && (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#991B1B", marginBottom: 10 }}>
                    {inviteError}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="email"
                    placeholder="teammate@email.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleInvite()}
                    style={{ flex: 1, padding: "10px 12px", border: `1.5px solid ${BRAND.border}`, borderRadius: 10, fontSize: 13, background: "#F8FAFC", color: BRAND.dark, outline: "none", fontFamily: "'DM Sans', sans-serif" }}
                  />
                  <button
                    onClick={handleInvite}
                    disabled={!inviteEmail || inviteLoading}
                    style={{ padding: "10px 16px", background: BRAND.blue, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: inviteEmail && !inviteLoading ? "pointer" : "not-allowed", opacity: inviteEmail && !inviteLoading ? 1 : 0.6, fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
                    {inviteLoading ? "..." : "Invite"}
                  </button>
                </div>
              </Card>}

              {/* Team members list */}
              <Card style={{ marginBottom: "0.85rem" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 12 }}>Team members ({companyMembers.length})</div>
                {companyMembers.length === 0 ? (
                  <div style={{ fontSize: 13, color: BRAND.gray, textAlign: "center", padding: "1rem 0" }}>No team members yet. Send your first invite above.</div>
                ) : (
                  companyMembers.map(member => {
                    const trade = member.trade ? (TRADES.find(t => t.id === member.trade)?.label || member.trade) : "—";
                    const isOwner = member.company_role === "owner";
                    return (
                      <div key={member.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${BRAND.border}` }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>
                            {member.name || "—"}
                            {isOwner && <span style={{ fontSize: 10, background: "#EFF6FF", color: BRAND.blue, fontWeight: 700, padding: "2px 7px", borderRadius: 6, marginLeft: 6 }}>Owner</span>}
                          </div>
                          <div style={{ fontSize: 11, color: BRAND.gray }}>{member.email} · {trade}</div>
                        </div>
                        {currentUserIsOwner && !isOwner && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            style={{ background: "none", border: "1px solid #FCA5A5", color: "#DC2626", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 7, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </Card>

              {/* Upgrade plan — owners only */}
              {currentUserIsOwner && company.plan !== "gold" && (
                isNativeIOS() ? (
                  <div style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "0.85rem", fontSize: 12, color: BRAND.gray, textAlign: "center", lineHeight: 1.6 }}>
                    {IOS_SUBSCRIPTION_MSG}
                  </div>
                ) : (
                  <div onClick={() => go("pricing")}
                    style={{ background: "linear-gradient(135deg, #0F172A, #1E3A5F)", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#F8FAFC", marginBottom: 2 }}>Need more seats?</div>
                      <div style={{ fontSize: 11, color: "#94A3B8" }}>
                        {company.plan === "bronze" ? "Upgrade to Silver for up to 15 team members" : "Upgrade to Gold for unlimited team members"}
                      </div>
                    </div>
                    <button style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "8px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
                      Upgrade →
                    </button>
                  </div>
                )
              )}
            </>
          )
            );
          })()}
        </div>
      )}

      {/* Profile */}
      {tab === "profile" && (
        <div>
          {!isLoggedIn ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ textAlign: "center", padding: "2rem", background: "#F8FAFC", borderRadius: 14, border: `1px solid ${BRAND.border}` }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{paymentSuccess ? "🎉" : "👤"}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.dark, marginBottom: 6 }}>
                  {paymentSuccess ? "Payment received! Log in to activate your plan." : "Create your trade professional profile"}
                </div>
                <div style={{ fontSize: 13, color: BRAND.gray, marginBottom: 16 }}>
                  {paymentSuccess ? "Log in to your account to see your new plan and Team tab." : "Sign up to track your reviews, save addresses, and build your trust score."}
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <Btn onClick={() => goLogin ? goLogin() : go("signup")}>Log in</Btn>
                  {!paymentSuccess && <Btn variant="secondary" onClick={() => go("signup")}>Sign up free</Btn>}
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
                      <span>+2 pts/month account age</span>
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
                  ["Plan", (
                    user?.plan === "bronze" ? `🥉 Bronze — $${COMPANY_TIERS.bronze.price}/mo` :
                    user?.plan === "silver" ? `🥈 Silver — $${COMPANY_TIERS.silver.price}/mo` :
                    user?.plan === "gold"   ? `🥇 Gold — $${COMPANY_TIERS.gold.price}/mo` :
                    user?.plan === "platinum" ? "💎 Platinum — Custom" :
                    FREE_PLAN_LABEL
                  )],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${BRAND.border}`, fontSize: 13 }}>
                    <span style={{ color: BRAND.gray }}>{l}</span>
                    <span style={{ fontWeight: 600, color: BRAND.dark }}>{v}</span>
                  </div>
                ))}
              </Card>

              {/* Review Points */}
              {user?.plan !== "platinum" && (
                <Card style={{ marginBottom: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>⭐ Review Points</div>
                      <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 2 }}>1 point per review · $0.25/point · never expire</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: BRAND.blue }}>{reviewPoints}</div>
                      <div style={{ fontSize: 10, color: BRAND.gray }}>points</div>
                    </div>
                  </div>

                  {/* Points progress bar */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ height: 8, background: BRAND.border, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                      <div style={{ height: "100%", width: `${Math.min((reviewPoints % 40) / 40 * 100, 100)}%`, background: BRAND.blue, borderRadius: 4, transition: "width 0.4s ease" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: BRAND.gray }}>
                      <span>{reviewPoints % 40} / 40 toward next $10 reward</span>
                      <span style={{ fontWeight: 700, color: BRAND.dark }}>Total value: ${pointsValue}</span>
                    </div>
                  </div>

                  {/* Milestones */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    {[
                      { pts: 40,  label: "$10",  reached: reviewPoints >= 40  },
                      { pts: 80,  label: "$20",  reached: reviewPoints >= 80  },
                      { pts: 120, label: "$30",  reached: reviewPoints >= 120 },
                      { pts: 200, label: "$50",  reached: reviewPoints >= 200 },
                    ].map(m => (
                      <div key={m.pts} style={{ flex: 1, textAlign: "center", padding: "6px 4px", borderRadius: 8, background: m.reached ? "#EFF6FF" : "#F8FAFC", border: `1.5px solid ${m.reached ? BRAND.blue : BRAND.border}` }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: m.reached ? BRAND.blue : BRAND.gray }}>{m.label}</div>
                        <div style={{ fontSize: 9, color: m.reached ? BRAND.blue : BRAND.gray }}>{m.pts} pts</div>
                      </div>
                    ))}
                  </div>

                  {/* Redeem CTA */}
                  {reviewPoints >= 40 ? (
                    <a href={`mailto:hello@prorated.app?subject=Points%20Redemption%20Request&body=Hi%20ProRated%20Team%2C%0A%0AI%20would%20like%20to%20redeem%20my%20review%20points%20for%20merch%20store%20credit.%0A%0AAccount%20email%3A%20${encodeURIComponent(user?.email || "")}%0APoints%20balance%3A%20${reviewPoints}%20points%20($${pointsValue})%0A%0APlease%20let%20me%20know%20how%20to%20proceed!`}
                      style={{ display: "block", width: "100%", padding: "10px", background: BRAND.blue, color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 700, textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>
                      Redeem points for merch →
                    </a>
                  ) : (
                    <div style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 12, color: BRAND.gray, textAlign: "center" }}>
                      Earn {40 - reviewPoints} more point{40 - reviewPoints !== 1 ? "s" : ""} to unlock your first $10 merch reward 🎁
                    </div>
                  )}
                </Card>
              )}

              {/* Change Password */}
              <Card style={{ marginBottom: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onClick={() => { setShowPwChange(s => !s); setPwError(null); setPwSuccess(false); }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>🔑 Change Password</div>
                    {!showPwChange && <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 2 }}>Update your account password</div>}
                  </div>
                  <span style={{ fontSize: 18, color: BRAND.gray, cursor: "pointer" }}>{showPwChange ? "−" : "+"}</span>
                </div>
                {showPwChange && (
                  <div style={{ marginTop: 14, borderTop: `1px solid ${BRAND.border}`, paddingTop: 14 }}>
                    {pwSuccess ? (
                      <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#166534", textAlign: "center" }}>
                        ✅ Password updated successfully!
                      </div>
                    ) : (
                      <>
                        {pwError && (
                          <div style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", fontSize: 12, marginBottom: 10 }}>{pwError}</div>
                        )}
                        {[
                          { key: "current", placeholder: "Current password" },
                          { key: "next",    placeholder: "New password (6+ characters)" },
                          { key: "confirm", placeholder: "Confirm new password" },
                        ].map(({ key, placeholder }) => (
                          <input
                            key={key}
                            type="password"
                            placeholder={placeholder}
                            value={pwForm[key]}
                            onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                            style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${BRAND.border}`, borderRadius: 10, fontSize: 13, background: "#F8FAFC", color: BRAND.dark, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", marginBottom: 8 }}
                          />
                        ))}
                        <button
                          onClick={handlePasswordChange}
                          disabled={!pwForm.current || !pwForm.next || !pwForm.confirm || pwLoading}
                          style={{ width: "100%", padding: "10px", background: BRAND.blue, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: pwForm.current && pwForm.next && pwForm.confirm && !pwLoading ? "pointer" : "not-allowed", opacity: pwForm.current && pwForm.next && pwForm.confirm && !pwLoading ? 1 : 0.6, fontFamily: "'DM Sans', sans-serif" }}>
                          {pwLoading ? "Updating..." : "Update password →"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </Card>

              {/* Upgrade to Pro */}
              {(!user?.plan || user?.plan === "free") && !user?.stripe_customer_id && (
                isNativeIOS() ? (
                  <div style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "0.75rem", fontSize: 12, color: BRAND.gray, textAlign: "center", lineHeight: 1.6 }}>
                    {IOS_SUBSCRIPTION_MSG}
                  </div>
                ) : (
                <div onClick={() => go("pricing")} style={{ background: "linear-gradient(135deg, #0F172A, #1E3A5F)", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#F8FAFC", marginBottom: 2 }}>{t(lang, "upgrade.title")}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>Bronze from $9.99/mo · Silver $19.99/mo · Gold $29.99/mo</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); go("pricing"); }}
                    style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
                    View plans →
                  </button>
                </div>
                )
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



              {/* Delete Account */}
              <Card style={{ marginBottom: "0.85rem", border: showDeleteAccount ? "1.5px solid #FCA5A5" : undefined }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                  onClick={() => setShowDeleteAccount(s => !s)}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>🗑️ Delete Account</div>
                    {!showDeleteAccount && <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 2 }}>Permanently remove your account and data</div>}
                  </div>
                  <span style={{ fontSize: 18, color: BRAND.gray }}>{showDeleteAccount ? "−" : "+"}</span>
                </div>
                {showDeleteAccount && (
                  <div style={{ marginTop: 14, borderTop: `1px solid ${BRAND.border}`, paddingTop: 14 }}>
                    <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#991B1B", lineHeight: 1.6, marginBottom: 14 }}>
                      <strong>This cannot be undone.</strong> Your account will be permanently deleted and your reviews anonymized. You'll be logged out immediately.
                    </div>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteAccountLoading}
                      style={{ width: "100%", padding: "10px", background: "#DC2626", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: deleteAccountLoading ? "not-allowed" : "pointer", opacity: deleteAccountLoading ? 0.6 : 1, fontFamily: "'DM Sans', sans-serif" }}>
                      {deleteAccountLoading ? "Submitting request..." : "Request account deletion →"}
                    </button>
                  </div>
                )}
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