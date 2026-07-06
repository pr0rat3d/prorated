import { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { BRAND, Btn, Card } from "../components/UI";
import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";
import { COMPANY_TIERS } from "../data/constants";

// Bronze/Silver/Gold are free through Dec 31, 2026 — applied automatically
// via the PRORATED2026 Stripe coupon, no user-facing promo entry.
const FREE_2026_COUPON = "PRORATED2026";
import { isNativeIOS, IOS_SUBSCRIPTION_MSG } from "../utils/platform";

const STRIPE_LINKS = {
  bronze: "https://buy.stripe.com/4gMfZg9mL8TM9HI9szeQM00",
  silver: "https://buy.stripe.com/eVqcN4buT0ng6vw48feQM01",
  gold:   "https://buy.stripe.com/dRmeVc56v6LE3jk34beQM02",
};

const SEAT_LIMITS = { bronze: 5, silver: 15, gold: 39, platinum: 999 };

export default function CompanySetupPage({ go, goBack }) {
  const { user } = useAuth();

  // Determine if user already has a paid plan
  const existingPlan = user?.plan && user.plan !== "free" ? user.plan : null;
  const alreadyPaid  = !!existingPlan || !!user?.stripe_customer_id;

  const [step, setStep]               = useState(1);
  const [companyName, setCompanyName] = useState(user?.company_name || "");
  const [selectedTier, setSelectedTier] = useState(existingPlan || null);
  const [accountType, setAccountType] = useState(existingPlan ? "company" : null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  // If user already has a company, fetch it
  const [existingCompany, setExistingCompany] = useState(null);
  const [members, setMembers]                 = useState([]);
  const [companyLoading, setCompanyLoading]   = useState(true);
  const [showSettings, setShowSettings]       = useState(false);
  const [renaming, setRenaming]               = useState(false);
  const [newName, setNewName]                 = useState("");
  const [renameLoading, setRenameLoading]     = useState(false);
  const [inviteEmail, setInviteEmail]         = useState("");
  const [inviteLoading, setInviteLoading]     = useState(false);
  const [inviteSuccess, setInviteSuccess]     = useState(false);
  const [inviteError, setInviteError]         = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    // Skip fetch if user just deleted their team
    if (sessionStorage.getItem("pr_team_deleted") === "1") {
      sessionStorage.removeItem("pr_team_deleted");
      setCompanyLoading(false);
      return;
    }
    const session   = JSON.parse(localStorage.getItem("prorated_session") || "{}");
    const token     = session.access_token;
    // Prefer company_id from session (set immediately after create) — avoids stale owner_id query
    const companyId = session.user?.company_id;

    const fetchCompany = async () => {
      try {
        const url = companyId
          ? `${SUPABASE_URL}/rest/v1/companies?id=eq.${companyId}&select=*&limit=1`
          : `${SUPABASE_URL}/rest/v1/companies?owner_id=eq.${user.id}&select=*&order=created_at.desc&limit=1`;

        const compRes   = await fetch(url, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
        });
        const companies = await compRes.json();
        if (companies?.[0]) {
          const comp = companies[0];
          setExistingCompany(comp);
          const memRes = await fetch(
            `${SUPABASE_URL}/rest/v1/contractors?company_id=eq.${comp.id}&select=id,name,email,trade,company_role,status,created_at`,
            { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } }
          );
          setMembers(await memRes.json() || []);
        }
      } catch { /* ignore */ }
      setCompanyLoading(false);
    };

    fetchCompany();
  }, [user?.id, user?.company_id]);

  const PAID_PLANS = ["bronze", "silver", "gold", "platinum", "pro"];

  const handleCreate = async () => {
    if (!companyName.trim() || !selectedTier) return;
    // Guard: free-plan users can't create companies
    if (!alreadyPaid && !PAID_PLANS.includes(selectedTier)) {
      setError("A paid plan is required to create a team workspace. Choose a plan below.");
      return;
    }
    setLoading(true); setError(null);

    try {
      const session   = JSON.parse(localStorage.getItem("prorated_session") || "{}");
      const token     = session.access_token;
      const seatLimit = SEAT_LIMITS[selectedTier] || 5;

      const res = await fetch(`${SUPABASE_URL}/rest/v1/companies`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`,
          "Content-Type": "application/json", Prefer: "return=representation",
        },
        body: JSON.stringify({
          name:             companyName.trim(),
          owner_id:         user.id,
          account_type:     accountType || "company",
          plan:             selectedTier,
          seat_limit:       seatLimit,
          status:           "active",
          anniversary_date: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const rawMsg = errBody?.message || errBody?.hint || "";
        const isRLS = errBody?.code === "42501" || rawMsg.includes("row-level security");
        throw new Error(isRLS
          ? "A paid plan is required to create a team workspace. Upgrade your plan to unlock team seats."
          : rawMsg || `Server error ${res.status}`);
      }

      const companies = await res.json();
      const company   = companies?.[0];
      if (!company) throw new Error("Failed to create company");

      await fetch(`${SUPABASE_URL}/rest/v1/contractors?id=eq.${user.id}`, {
        method: "PATCH",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: company.id, company_role: "owner", plan: selectedTier || existingPlan, account_type: "company" }),
      });

      // Update localStorage session so next mount picks up company_id immediately
      const updatedUser = { ...session.user, company_id: company.id, company_role: "owner", plan: selectedTier || existingPlan };
      localStorage.setItem("prorated_session", JSON.stringify({ ...session, user: updatedUser }));
      sessionStorage.setItem("pr_team_created", company.id);

      setLoading(false);

      // If already paid, skip Stripe — go straight to team view
      if (alreadyPaid || selectedTier === "platinum") {
        // Set existingCompany directly so we don't need a re-fetch
        setExistingCompany({ ...company, plan: selectedTier || existingPlan });
        setMembers([{ id: user.id, name: user.name, email: user.email, trade: user.trade, company_role: "owner", status: user.status }]);
        setCompanyLoading(false);
        return;
      }

      if (STRIPE_LINKS[selectedTier] && !isNativeIOS()) {
        const params = new URLSearchParams({
          prefilled_email:      user.email,
          prefilled_promo_code: FREE_2026_COUPON,
        });
        window.location.href = `${STRIPE_LINKS[selectedTier]}?${params}`;
      } else {
        go("dashboard");
      }
    } catch (err) {
      setError(err.message || "Could not create company. Please try again.");
      setLoading(false);
    }
  };

  const inp = { width: "100%", padding: "11px 13px", border: `1.5px solid ${BRAND.border}`, borderRadius: 10, fontSize: 14, background: "#F8FAFC", color: BRAND.dark, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" };
  const tierInfo = COMPANY_TIERS[existingPlan] || COMPANY_TIERS[selectedTier];

  // ── If user already has a company — show management summary ──────────────
  if (!companyLoading && existingCompany) {
    const plan      = existingCompany.plan || "bronze";
    const seatLimit = SEAT_LIMITS[plan] || 5;
    const tierMeta  = COMPANY_TIERS[plan] || {};
    const usedSeats = members.length;
    const seatsLeft = Math.max(0, seatLimit - usedSeats);
    const session   = JSON.parse(localStorage.getItem("prorated_session") || "{}");
    const token     = session.access_token;

    const handleRename = async () => {
      if (!newName.trim()) return;
      setRenameLoading(true);
      await fetch(`${SUPABASE_URL}/rest/v1/companies?id=eq.${existingCompany.id}`, {
        method: "PATCH",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      setExistingCompany(c => ({ ...c, name: newName.trim() }));
      setRenaming(false); setNewName(""); setRenameLoading(false);
    };

    const handleDeleteTeam = async () => {
      if (!window.confirm(`Delete "${existingCompany.name}" and remove all members? Cannot be undone.`)) return;
      // Navigate away FIRST — prevents re-mount refetch race
      sessionStorage.setItem("pr_team_deleted", "1");
      go("dashboard");
      // Then do the DB cleanup in background
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/contractors?company_id=eq.${existingCompany.id}`, {
          method: "PATCH",
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ company_id: null, company_role: null }),
        });
        await fetch(`${SUPABASE_URL}/rest/v1/contractors?id=eq.${user.id}`, {
          method: "PATCH",
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ company_id: null, company_role: null }),
        });
        await fetch(`${SUPABASE_URL}/rest/v1/companies?id=eq.${existingCompany.id}`, {
          method: "DELETE",
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
        });
        if (session.user) {
          localStorage.setItem("prorated_session", JSON.stringify({
            ...session, user: { ...session.user, company_id: null, company_role: null }
          }));
        }
      } catch (err) {
        console.warn("[ProRated] Delete team error:", err);
      }
    };

    const handleRemoveMember = async (memberId) => {
      if (!window.confirm("Remove this member from your team?")) return;
      await fetch(`${SUPABASE_URL}/rest/v1/contractors?id=eq.${memberId}`, {
        method: "PATCH",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: null, company_role: null }),
      });
      setMembers(m => m.filter(x => x.id !== memberId));
    };

    const handleInvite = async () => {
      if (!inviteEmail.trim()) return;
      setInviteLoading(true); setInviteError(null); setInviteSuccess(false);
      try {
        const seatLimit = SEAT_LIMITS[existingCompany.plan] || 5;
        if (members.length >= seatLimit) {
          setInviteError(`Seat limit reached (${seatLimit}). Upgrade to add more.`);
          setInviteLoading(false); return;
        }
        // Generate a unique token for the invite link
        const inviteToken = crypto.randomUUID();
        const expiresAt   = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

        await fetch(`${SUPABASE_URL}/rest/v1/invites`, {
          method: "POST",
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({
            company_id:  existingCompany.id,
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
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              type:          "invite",
              inviteEmail:   inviteEmail.toLowerCase().trim(),
              companyName:   existingCompany.name,
              invitedByName: user.name || user.email,
              inviteLink:    `https://prorated.app/invite/${inviteToken}`,
            }),
          });
          if (!emailRes.ok) {
            const errBody = await emailRes.text();
            console.warn("[ProRated] Invite email failed:", emailRes.status, errBody);
          }
        } catch (emailErr) {
          console.warn("[ProRated] Invite email error:", emailErr);
        }
        setInviteSuccess(true);
        setInviteEmail("");
        setTimeout(() => setInviteSuccess(false), 3000);
      } catch {
        setInviteError("Could not send invite. Please try again.");
      }
      setInviteLoading(false);
    };

    return (
      <div style={{ maxWidth: 560, margin: "2rem auto", padding: "0 1.25rem", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div style={{ textAlign: "center", flex: 1 }}>
            <Logo size={52} />
            {renaming ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", marginTop: 12 }}>
                <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenaming(false); }}
                  placeholder={existingCompany.name}
                  style={{ fontSize: 16, fontWeight: 700, border: `1.5px solid ${BRAND.blue}`, borderRadius: 8, padding: "4px 10px", fontFamily: "'DM Sans', sans-serif", color: BRAND.dark, outline: "none", width: 180 }} />
                <button onClick={handleRename} disabled={renameLoading || !newName.trim()}
                  style={{ background: BRAND.blue, color: "#fff", border: "none", borderRadius: 7, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  {renameLoading ? "..." : "Save"}
                </button>
                <button onClick={() => { setRenaming(false); setNewName(""); }}
                  style={{ background: "none", border: `1px solid ${BRAND.border}`, borderRadius: 7, padding: "5px 10px", fontSize: 11, color: BRAND.gray, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  Cancel
                </button>
              </div>
            ) : (
              <h1 style={{ fontSize: 20, fontWeight: 800, color: BRAND.dark, margin: "12px 0 4px" }}>🏗️ {existingCompany.name}</h1>
            )}
            <div style={{ fontSize: 12, color: BRAND.gray }}>Your team workspace</div>
          </div>
          <button onClick={() => setShowSettings(s => !s)}
            title="Team settings"
            style={{ background: showSettings ? "#EFF6FF" : "#F1F5F9", border: `1px solid ${showSettings ? BRAND.blue : BRAND.border}`, borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, fontSize: 15, marginTop: 4 }}>
            ⚙️
          </button>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <Card style={{ marginBottom: 14, border: `1px solid ${BRAND.blue}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, marginBottom: 10 }}>Team Settings</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => { setRenaming(true); setNewName(existingCompany.name); setShowSettings(false); }}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 9, padding: "9px 12px", fontSize: 12, fontWeight: 600, color: BRAND.dark, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
                ✏️ Rename company
              </button>
              <button onClick={() => go("pricing")}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 9, padding: "9px 12px", fontSize: 12, fontWeight: 600, color: BRAND.dark, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
                ⬆️ Upgrade / change plan
              </button>
              <button onClick={handleDeleteTeam}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 9, padding: "9px 12px", fontSize: 12, fontWeight: 600, color: "#DC2626", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
                🗑️ Delete team workspace
              </button>
            </div>
          </Card>
        )}

        {/* Plan card */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>{tierMeta.icon} {tierMeta.name || plan} Plan</div>
            </div>
            {!isNativeIOS() && (
              <button onClick={() => go("pricing")}
                style={{ fontSize: 11, fontWeight: 700, color: BRAND.blue, background: "#EFF6FF", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Upgrade →
              </button>
            )}
          </div>

          {/* Seat usage */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: BRAND.gray, marginBottom: 6 }}>
            <span>{usedSeats} of {seatLimit} seats used</span>
            <span style={{ color: seatsLeft <= 1 ? "#DC2626" : "#16A34A", fontWeight: 700 }}>{seatsLeft} left</span>
          </div>
          <div style={{ background: BRAND.border, borderRadius: 4, height: 8, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, (usedSeats / seatLimit) * 100)}%`, height: "100%", background: seatsLeft <= 1 ? "#DC2626" : BRAND.blue, borderRadius: 4, transition: "width 0.3s" }} />
          </div>
        </Card>

        {/* Team roster */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 12 }}>
            Team members ({usedSeats})
          </div>
          {members.length === 0 ? (
            <div style={{ fontSize: 12, color: BRAND.gray, textAlign: "center", padding: "12px 0" }}>No members yet — invite your team below</div>
          ) : members.map(m => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${BRAND.border}` }}>
              <div style={{ width: 32, height: 32, background: m.company_role === "owner" ? BRAND.blue : "#94A3B8", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                {(m.name || m.email || "?").charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>{m.name || "—"}</div>
                <div style={{ fontSize: 11, color: BRAND.gray, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.email}</div>
              </div>
              <div style={{ flexShrink: 0, display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: m.company_role === "owner" ? BRAND.blue : BRAND.gray, background: m.company_role === "owner" ? "#EFF6FF" : "#F1F5F9", padding: "2px 8px", borderRadius: 20 }}>
                  {m.company_role === "owner" ? "Owner" : "Member"}
                </span>
                <span style={{ fontSize: 10, color: m.status === "approved" ? "#16A34A" : "#D97706" }}>
                  {m.status === "approved" ? "✓ Verified" : "⏳ Pending"}
                </span>
                {m.company_role !== "owner" && (
                  <button onClick={() => handleRemoveMember(m.id)}
                    style={{ background: "none", border: "none", color: "#DC2626", fontSize: 14, cursor: "pointer", padding: "0 2px", lineHeight: 1 }} title="Remove member">
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </Card>

        {/* Invite section */}
        {seatsLeft > 0 ? (
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 4 }}>📨 Invite a team member</div>
            <div style={{ fontSize: 12, color: BRAND.gray, marginBottom: 12 }}>
              They'll get an email to create their ProRated account and join your team.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="email"
                placeholder="teammate@email.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleInvite()}
                style={{ flex: 1, padding: "10px 13px", border: `1.5px solid ${inviteError ? "#FCA5A5" : BRAND.border}`, borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", background: "#F8FAFC" }}
              />
              <button onClick={handleInvite} disabled={!inviteEmail || inviteLoading}
                style={{ padding: "10px 18px", background: BRAND.blue, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: inviteEmail && !inviteLoading ? "pointer" : "not-allowed", opacity: inviteEmail && !inviteLoading ? 1 : 0.6, fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
                {inviteLoading ? "..." : "Invite"}
              </button>
            </div>
            {inviteSuccess && <div style={{ fontSize: 12, color: "#16A34A", marginTop: 8, fontWeight: 600 }}>✓ Invite sent!</div>}
            {inviteError  && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 8 }}>{inviteError}</div>}
          </Card>
        ) : (
          <Card style={{ background: "#FEF3C7", border: "1px solid #FDE68A", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>⚠️ All seats filled</div>
            <div style={{ fontSize: 12, color: "#92400E" }}>Upgrade your plan to add more team members.</div>
            {isNativeIOS()
              ? <div style={{ marginTop: 10, fontSize: 12, color: BRAND.gray, lineHeight: 1.6 }}>{IOS_SUBSCRIPTION_MSG}</div>
              : <Btn onClick={() => go("pricing")} style={{ marginTop: 10 }}>Upgrade plan →</Btn>
            }
          </Card>
        )}

        <button onClick={() => go("dashboard")}
          style={{ display: "block", margin: "0 auto", background: "none", border: "none", color: BRAND.gray, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (companyLoading) {
    return (
      <div style={{ maxWidth: 460, margin: "4rem auto", textAlign: "center", fontFamily: "'DM Sans', sans-serif", color: BRAND.gray }}>
        Loading...
      </div>
    );
  }

  // ── New company setup flow ────────────────────────────────────────────────
  // For users with a paid plan, only show Step 1 (name) then go straight to creation
  const totalSteps = alreadyPaid ? 1 : 2;

  return (
    <div style={{ maxWidth: 460, margin: "2rem auto", padding: "0 1.25rem", fontFamily: "'DM Sans', sans-serif" }}>

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Logo size={56} />
        <h1 style={{ fontSize: 20, fontWeight: 800, color: BRAND.dark, margin: "12px 0 4px" }}>Set up your company</h1>
        <p style={{ fontSize: 13, color: BRAND.gray, margin: 0 }}>Invite your team and manage seats in one place.</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 5, marginBottom: "1.5rem" }}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: step > i ? BRAND.blue : BRAND.border, transition: "background 0.3s" }} />
        ))}
      </div>

      {/* Current plan notice (for paid users) */}
      {alreadyPaid && tierInfo && (
        <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#1E40AF" }}>
          {tierInfo.icon} Current plan: <strong>{tierInfo.name}</strong> — up to {SEAT_LIMITS[existingPlan]} seats
        </div>
      )}

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#991B1B", marginBottom: 12 }}>{error}</div>
      )}

      {/* Step 1 — Company name */}
      {step === 1 && (
        <Card style={{ animation: "fadeUp 0.25s ease both" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 4 }}>Company name</div>
          <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: 14 }}>This is how your company will appear to team members.</div>
          <input
            type="text"
            placeholder="e.g. Smith Roofing Co."
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && companyName.trim().length > 1) {
                alreadyPaid ? handleCreate() : setStep(2);
              }
            }}
            style={inp}
          />
          <div style={{ marginTop: 14 }}>
            <Btn fullWidth
              onClick={() => alreadyPaid ? handleCreate() : setStep(2)}
              disabled={companyName.trim().length < 2 || loading}>
              {loading ? "Setting up..." : alreadyPaid ? "Create company →" : "Continue →"}
            </Btn>
          </div>
          <p style={{ fontSize: 11, color: BRAND.gray, textAlign: "center", marginTop: 10 }}>
            <button onClick={() => goBack ? goBack() : go("dashboard")}
              style={{ background: "none", border: "none", color: BRAND.gray, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              ← Cancel
            </button>
          </p>
        </Card>
      )}

      {/* Step 2 — Plan selection (only for free-plan users) */}
      {step === 2 && !alreadyPaid && (
        <Card style={{ animation: "fadeUp 0.25s ease both" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 4 }}>Choose your plan</div>
          <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: 14 }}>Select the plan that fits your team size.</div>

          {Object.entries(COMPANY_TIERS).map(([id, tier]) => (
            <div key={id}
              onClick={() => { setSelectedTier(id); if (id !== "bronze") setAccountType("company"); }}
              style={{ border: `1.5px solid ${selectedTier === id ? BRAND.blue : BRAND.border}`, background: selectedTier === id ? "#EFF6FF" : "#F8FAFC", borderRadius: 12, padding: "12px 14px", marginBottom: 8, cursor: "pointer", transition: "all 0.15s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{tier.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.dark }}>{tier.name}</div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: tier.price ? "#16A34A" : BRAND.dark }}>{tier.price ? "Free through 2026" : "Custom pricing"}</div>
                      {tier.price && <div style={{ fontSize: 10, fontWeight: 400, color: BRAND.gray }}>then ${tier.price}/mo</div>}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: BRAND.gray }}>
                    {id === "bronze" ? "Solo or 1–5 team members" :
                     id === "silver" ? "6–15 team members" :
                     id === "gold"   ? "16–39 team members" :
                     "40+ team members — custom pricing"}
                  </div>
                </div>
                {selectedTier === id && <span style={{ color: BRAND.blue, fontWeight: 700 }}>✓</span>}
              </div>

              {selectedTier === "bronze" && id === "bronze" && (
                <div style={{ marginTop: 10, borderTop: `1px solid ${BRAND.border}`, paddingTop: 10, display: "flex", gap: 8 }}>
                  {[["solo","👤 Just me"],["company","🏗️ My company (1–5)"]].map(([type, label]) => (
                    <button key={type}
                      onClick={e => { e.stopPropagation(); setAccountType(type); }}
                      style={{ flex: 1, padding: "8px", border: `1.5px solid ${accountType === type ? BRAND.blue : BRAND.border}`, background: accountType === type ? BRAND.blue : "#fff", color: accountType === type ? "#fff" : BRAND.dark, borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {!isNativeIOS() && selectedTier !== "platinum" && (
            <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10, padding: "10px 14px", marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "#166534", lineHeight: 1.6 }}>
                🎉 <strong>Free through December 31, 2026.</strong> Card is collected at checkout but you won't be charged until January 2027.
              </div>
            </div>
          )}
          {isNativeIOS() && (
            <div style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 10, padding: "10px 14px", marginTop: 12, fontSize: 12, color: BRAND.gray, lineHeight: 1.6, textAlign: "center" }}>
              {IOS_SUBSCRIPTION_MSG}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <Btn variant="secondary" onClick={() => setStep(1)}>← Back</Btn>
            <Btn fullWidth
              onClick={handleCreate}
              disabled={!selectedTier || (selectedTier === "bronze" && !accountType) || loading || isNativeIOS()}>
              {loading ? "Setting up..." : "Create company →"}
            </Btn>
          </div>
        </Card>
      )}
    </div>
  );
}
