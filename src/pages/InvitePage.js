import { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js"; // still used in handleAccept PATCH
import { BRAND } from "../components/UI";
import { Btn, Card } from "../components/UI";
import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";

// ── InvitePage ────────────────────────────────────────────────
// Handles prorated.app/invite/[token]
// Accepts a team invite and links the user to the company

export default function InvitePage({ go, goLogin }) {
  const { user, isLoggedIn } = useAuth();
  const [invite, setInvite]   = useState(null);
  const [company, setCompany] = useState(null);
  const [status, setStatus]   = useState("loading"); // loading|valid|invalid|expired|accepted
  const [accepting, setAccepting] = useState(false);
  const [error, setError]     = useState(null);

  // Extract token from URL, fall back to localStorage for SPA navigation paths
  const token = window.location.pathname.split("/invite/")[1]?.split("/")[0]
    || localStorage.getItem("pending_invite_token");

  const ANON = SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZHJiZG9qbnptdHduZHN3cHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NzI3OTgsImV4cCI6MjA5NTA0ODc5OH0.2PJv-XQUjmbMhzaXkZSjWzCeDUtTWAmcAvobjJymQDs";

  useEffect(() => {
    if (token) fetchInvite();
  }, [token]);

  const fetchInvite = async () => {
    try {
      const res = await fetch(`/api/invite-lookup?token=${token}`);

      if (res.status === 404) { setStatus("invalid"); return; }
      if (!res.ok) { setStatus("invalid"); return; }

      const { invite: inv, company: comp } = await res.json();

      if (!inv) { setStatus("invalid"); return; }
      if (inv.accepted_at) { setStatus("accepted"); return; }
      if (inv.expires_at && new Date(inv.expires_at) < new Date()) { setStatus("expired"); return; }

      setInvite(inv);
      setCompany(comp);
      setStatus("valid");
    } catch (err) {
      console.warn("[ProRated] Invite error:", err);
      setStatus("invalid");
    }
  };

  const storeInviteContext = () => {
    localStorage.setItem("pending_invite_token", token);
    localStorage.setItem("pending_invite_context", JSON.stringify({
      token,
      companyId:    invite.company_id,
      companyName:  company?.name,
      plan:         company?.plan || "bronze",
      invitedEmail: invite.email,
    }));
  };

  const handleAccept = async () => {
    // Verify the logged-in user's email matches the invite
    if (invite.email && user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      setError(`This invite was sent to ${invite.email}. Please sign in with that email address.`);
      return;
    }

    setAccepting(true); setError(null);
    try {
      const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
      const tok     = session.access_token;

      // Link contractor to company
      await fetch(
        `${SUPABASE_URL}/rest/v1/contractors?id=eq.${user.id}`,
        {
          method: "PATCH",
          headers: {
            "apikey":         ANON,
            "Authorization":  `Bearer ${tok}`,
            "Content-Type":   "application/json",
          },
          body: JSON.stringify({
            company_id:   company?.id || invite.company_id,
            company_role: "member",
          }),
        }
      );

      // Mark invite as accepted
      await fetch(
        `${SUPABASE_URL}/rest/v1/invites?token=eq.${token}`,
        {
          method: "PATCH",
          headers: {
            "apikey":         ANON,
            "Authorization":  `Bearer ${tok}`,
            "Content-Type":   "application/json",
          },
          body: JSON.stringify({ accepted_at: new Date().toISOString() }),
        }
      );

      // Sync company into session so dashboard team tab loads correctly
      try {
        const currentSession = JSON.parse(localStorage.getItem("prorated_session") || "{}");
        if (currentSession.user) {
          currentSession.user.company_id   = company?.id || invite.company_id;
          currentSession.user.company_role = "member";
          localStorage.setItem("prorated_session", JSON.stringify(currentSession));
        }
      } catch {}

      localStorage.removeItem("pending_invite_token");
      setStatus("joined");
      setTimeout(() => go("home"), 2500);
    } catch (err) {
      setError("Could not accept invite. Please try again or contact support.");
    }
    setAccepting(false);
  };

  const TIER_LABELS = { bronze: "🥉 Bronze", silver: "🥈 Silver", gold: "🥇 Gold" };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: "0 1.25rem", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Logo size={56} />
      </div>

      {!token && (
        <Card>
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>❌</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.dark, marginBottom: 8 }}>Invalid invite link</div>
            <div style={{ fontSize: 13, color: BRAND.gray, marginBottom: 20 }}>No invite token found in the URL.</div>
            <Btn fullWidth onClick={() => go("home")}>Go to ProRated</Btn>
          </div>
        </Card>
      )}

      {status === "loading" && token && (
        <div style={{ textAlign: "center", color: BRAND.gray, fontSize: 14, padding: "2rem 0" }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
          Checking your invite...
        </div>
      )}

      {status === "invalid" && (
        <Card>
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>❌</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.dark, marginBottom: 8 }}>Invalid invite link</div>
            <div style={{ fontSize: 13, color: BRAND.gray, marginBottom: 20 }}>This invite link is not valid or has expired. Please ask your team admin to send a new one.</div>
            <Btn fullWidth onClick={() => go("home")}>Go to ProRated</Btn>
          </div>
        </Card>
      )}

      {status === "expired" && (
        <Card>
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏰</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.dark, marginBottom: 8 }}>Invite expired</div>
            <div style={{ fontSize: 13, color: BRAND.gray, marginBottom: 20 }}>This invite link expired after 7 days. Ask your team admin to send a new invite.</div>
            <Btn fullWidth onClick={() => go("home")}>Go to ProRated</Btn>
          </div>
        </Card>
      )}

      {status === "accepted" && (
        <Card>
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.dark, marginBottom: 8 }}>
              {isLoggedIn ? "Already accepted" : "This invite was already used"}
            </div>
            <div style={{ fontSize: 13, color: BRAND.gray, marginBottom: 20 }}>
              {isLoggedIn
                ? "This invite has already been accepted."
                : "This invite link has already been used. If you haven't created your account yet, ask your team admin to send a new invite."}
            </div>
            {isLoggedIn
              ? <Btn fullWidth onClick={() => go("dashboard")}>Go to Dashboard →</Btn>
              : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Btn fullWidth onClick={() => go("signup")}>Create an account</Btn>
                  <button onClick={() => go("signup")}
                    style={{ background: "none", border: "none", color: BRAND.blue, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    Already have an account? Sign in →
                  </button>
                </div>
            }
          </div>
        </Card>
      )}

      {status === "joined" && (
        <Card>
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.dark, marginBottom: 8 }}>You're in!</div>
            <div style={{ fontSize: 13, color: BRAND.gray }}>You've joined {company?.name || "the team"}. Redirecting you now...</div>
          </div>
        </Card>
      )}

      {status === "valid" && invite && (
        <Card>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🏗️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.dark, marginBottom: 6 }}>
              You've been invited to join
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: BRAND.dark, marginBottom: 6 }}>{company?.name || "your team"}</div>
            {company?.plan && (
              <div style={{ display: "inline-block", background: "#EFF6FF", color: BRAND.blue, fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>
                {TIER_LABELS[company.plan] || company.plan} Plan
              </div>
            )}
          </div>

          <div style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 12, color: BRAND.gray, lineHeight: 1.7 }}>
            By accepting this invite you'll join the team, contribute to shared review stats, and get full Pro access included with the company plan.
          </div>

          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#991B1B", marginBottom: 12 }}>
              {error}
            </div>
          )}

          {isLoggedIn ? (
            <Btn fullWidth onClick={handleAccept} disabled={accepting}>
              {accepting ? "Joining..." : `Join ${company?.name || "team"} →`}
            </Btn>
          ) : (
            <>
              {invite.email && (
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#1E40AF", marginBottom: 12, textAlign: "center" }}>
                  📧 Invite sent to <strong>{invite.email}</strong>
                </div>
              )}
              <Btn fullWidth onClick={() => { storeInviteContext(); go("signup"); }}>
                Create account to join →
              </Btn>
              <p style={{ fontSize: 11, color: BRAND.gray, textAlign: "center", marginTop: 10, marginBottom: 0 }}>
                Already have an account?{" "}
                <button onClick={() => { storeInviteContext(); if (goLogin) goLogin(); else go("signup"); }}
                  style={{ background: "none", border: "none", color: BRAND.blue, fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                  Sign in →
                </button>
              </p>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
