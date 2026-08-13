import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { useState, useEffect, useRef } from "react";
import { TRADES, DASH_REVIEWS, BRAND, FREE_PLAN_LABEL, COMPANY_TIERS } from "../data/constants";
import { getTagsForTrade } from "../data/tradeTags";
import { Badge, Stars, Pill, Btn, Card } from "../components/UI";
import PasswordInput from "../components/PasswordInput";
import { useAuth } from "../hooks/useAuth";
import { isNativeApp } from "../utils/platform";
import { hasSavedBiometricLogin, clearBiometricLogin, getBiometryLabel } from "../utils/biometricAuth";



import { fetchMyReviews, updateReview, deleteReview } from "../api/supabase";
import { getSavedAddresses, unsaveAddress, toggleAddressNotify, signIn, updatePassword, saveTradeMemberships, saveWatchlistOptIn, updateProfile } from "../api/auth";
import { enrollTotp, confirmEnrollment, unenrollFactor, getOwnFactors } from "../api/mfa";
import { requestPushPermission, getPushToken, savePushToken, onPushTokenReceived } from "../api/push";
import { PARTNERS } from "./PartnerLandingPage";
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

  // Face ID / Touch ID — status + off switch only; enabling happens right
  // after login (SignupPage.js), where the plaintext password is briefly
  // available. Nothing to enable from here without asking for it again.
  const nativeApp = isNativeApp();
  const [bioSaved, setBioSaved] = useState(false);
  const [bioLabel, setBioLabel] = useState("Face ID or Touch ID");
  useEffect(() => {
    if (!nativeApp) return;
    hasSavedBiometricLogin().then(setBioSaved);
    getBiometryLabel().then(setBioLabel);
  }, []);
  const handleDisableBiometric = async () => {
    await clearBiometricLogin();
    setBioSaved(false);
  };

  // 2FA (TOTP) — fully opt-in. Nothing here forces anyone into it; this is
  // just the settings screen for whoever chooses to turn it on. Enrollment
  // is a 3-step flow: start (get QR/secret) -> scan -> confirm with a code.
  const [mfaFactor, setMfaFactor]         = useState(null); // existing verified factor, if any
  const [mfaChecking, setMfaChecking]     = useState(true);
  const [mfaEnrollData, setMfaEnrollData] = useState(null); // { id, totp: {qr_code, secret} } — mid-enrollment only
  const [mfaEnrollCode, setMfaEnrollCode] = useState("");
  const [mfaSecretCopied, setMfaSecretCopied] = useState(false);
  const [mfaError, setMfaError]           = useState(null);
  const [mfaBusy, setMfaBusy]             = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
    if (!session.access_token) { setMfaChecking(false); return; }
    getOwnFactors(session.access_token)
      .then(factors => setMfaFactor(factors.find(f => f.status === "verified" && f.factor_type === "totp") || null))
      .catch(() => {})
      .finally(() => setMfaChecking(false));
  }, [isLoggedIn]);

  const handleStartMfaEnroll = async () => {
    setMfaBusy(true); setMfaError(null);
    try {
      const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
      const data = await enrollTotp(session.access_token, `ProRated (${user?.email || "account"})`);
      setMfaEnrollData(data);
    } catch (err) {
      setMfaError(err.message);
    } finally { setMfaBusy(false); }
  };

  const handleConfirmMfaEnroll = async () => {
    if (!mfaEnrollData || mfaEnrollCode.trim().length !== 6) return;
    setMfaBusy(true); setMfaError(null);
    try {
      const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
      await confirmEnrollment(session.access_token, mfaEnrollData.id, mfaEnrollCode.trim());
      setMfaFactor({ id: mfaEnrollData.id, status: "verified", factor_type: "totp" });
      setMfaEnrollData(null); setMfaEnrollCode("");
    } catch (err) {
      setMfaError(err.message.includes("Invalid") ? "Incorrect code — check your authenticator app and try again." : err.message);
    } finally { setMfaBusy(false); }
  };

  const handleCancelMfaEnroll = () => {
    setMfaEnrollData(null); setMfaEnrollCode(""); setMfaError(null);
  };

  const handleDisableMfa = async () => {
    if (!mfaFactor) return;
    if (!window.confirm("Turn off 2FA? You'll only need your password to sign in after this.")) return;
    setMfaBusy(true); setMfaError(null);
    try {
      const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
      await unenrollFactor(session.access_token, mfaFactor.id);
      setMfaFactor(null);
    } catch (err) {
      setMfaError(err.message);
    } finally { setMfaBusy(false); }
  };

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
  const [removeMemberError, setRemoveMemberError] = useState(null);
  const [showPwChange, setShowPwChange] = useState(false);
  const [pwForm, setPwForm]             = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError]           = useState(null);
  const [pwSuccess, setPwSuccess]       = useState(false);
  const [pwLoading, setPwLoading]       = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [showMemberships, setShowMemberships] = useState(false);
  const [selectedMemberships, setSelectedMemberships] = useState(() => user?.trade_memberships || []);
  const [membershipsSaving, setMembershipsSaving] = useState(false);
  const [membershipsSaved, setMembershipsSaved] = useState(false);

  // Profile edit — name/company/phone only. Email/state/trade/license are
  // intentionally not editable here (tied to account identity/verification).
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm]       = useState({ name: "", company_name: "", phone: "" });
  const [profileError, setProfileError]     = useState(null);
  const [profileSaving, setProfileSaving]   = useState(false);

  const handlePasswordChange = async () => {
    setPwError(null);
    if (!pwForm.current)               { setPwError(t(lang,"dashboard.errPwCurrent")); return; }
    if (pwForm.next.length < 6)        { setPwError(t(lang,"dashboard.errPwLength")); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError(t(lang,"dashboard.errPwMismatch")); return; }
    if (pwForm.next === pwForm.current) { setPwError(t(lang,"dashboard.errPwSame")); return; }
    setPwLoading(true);
    try {
      await signIn({ email: user.email, password: pwForm.current });
      await updatePassword(pwForm.next);
      setPwSuccess(true);
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => { setPwSuccess(false); setShowPwChange(false); }, 3000);
    } catch (err) {
      if (err.message?.toLowerCase().includes("invalid")) {
        setPwError(t(lang,"dashboard.errPwIncorrect"));
      } else {
        setPwError(err.message || t(lang,"dashboard.errPwGeneric"));
      }
    }
    setPwLoading(false);
  };

  const startEditingProfile = () => {
    setProfileForm({ name: user?.name || "", company_name: user?.company_name || "", phone: user?.phone || "" });
    setProfileError(null);
    setEditingProfile(true);
  };

  const handleProfileSave = async () => {
    setProfileError(null);
    setProfileSaving(true);
    try {
      await updateProfile(profileForm);
      await refreshUser();
      setEditingProfile(false);
    } catch (err) {
      setProfileError(err.message || t(lang,"dashboard.profileUpdateFailed"));
    }
    setProfileSaving(false);
  };

  // Trade associations picker — Home Builders Assoc (isRealtor entries
  // excluded, those are for realtors, not trade contractors), sorted so
  // associations matching the user's own in-app trade come first. Not a
  // hard filter — someone's declared trade doesn't capture every license
  // they hold (a roofer with a GC license may still be a real GC-association
  // member), so everything stays selectable either way.
  const membershipOptions = Object.entries(PARTNERS)
    .filter(([, p]) => !p.isRealtor)
    .sort(([, a], [, b]) => {
      const aMatch = a.relevantTrades?.includes(user?.trade) ? 0 : 1;
      const bMatch = b.relevantTrades?.includes(user?.trade) ? 0 : 1;
      return aMatch - bMatch;
    });
  const [watchlistOptInSaving, setWatchlistOptInSaving] = useState(false);
  const handleToggleWatchlistOptIn = async () => {
    const next = !user?.watchlist_email_opt_in;
    setWatchlistOptInSaving(true);
    try {
      await saveWatchlistOptIn(next);
      await refreshUser();
    } catch {
      // Non-critical — leave as-is so the user can just retry
    }
    setWatchlistOptInSaving(false);
  };

  const toggleMembership = (key) => {
    setSelectedMemberships(sel => sel.includes(key) ? sel.filter(k => k !== key) : [...sel, key]);
  };
  const handleSaveMemberships = async () => {
    setMembershipsSaving(true);
    try {
      await saveTradeMemberships(selectedMemberships);
      await refreshUser();
      setMembershipsSaved(true);
      setTimeout(() => setMembershipsSaved(false), 3000);
    } catch {
      // Non-critical — leave the selection as-is so the user can just retry
    }
    setMembershipsSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(t(lang,"dashboard.confirmDeleteAccount"))) return;
    setDeleteAccountLoading(true);
    try {
      const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
      const token = session.access_token;
      // Self-delete — the delete-user edge function authorizes this because the
      // bearer token's own user id matches userId. Immediate and complete, not
      // just a request flag (Apple 5.1.1(v) requires in-app deletion to actually
      // delete the account, not file a ticket for an admin to act on later).
      const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      await logout();
      go("home");
    } catch (err) {
      console.warn("[ProRated] Delete account error:", err);
      window.alert(err.message || t(lang,"dashboard.errDeleteAccount"));
      setDeleteAccountLoading(false);
    }
  };

  const [saved, setSaved]       = useState([]);
  const [loadingSaved, setLS]   = useState(false);
  const [myReviews, setMyReviews] = useState([]);
  const [loadingReviews, setLR]   = useState(false);
  const [notifyBusyId, setNotifyBusyId] = useState(null);
  const [pushSetupMsg, setPushSetupMsg] = useState(null);

  // registerPushToken() is called from two places: the tokenReceived
  // listener (the reliable path — fires whenever native APNs<->FCM
  // registration actually finishes, which is NOT synchronous with the
  // permission prompt resolving) and, as a fast-path, directly after
  // requestPermissions() in case a token is already cached. iOS in
  // particular can still be completing native registration at the
  // moment the JS permission promise resolves, so calling getToken()
  // immediately after can silently fail — the listener is what makes
  // this reliable rather than racy.
  const platformFor = () => /iPad|iPhone|iPod/.test(navigator.userAgent) ? "ios" : "android";
  const registerPushToken = async (token) => {
    if (!token || !user?.id) return;
    await savePushToken(user.id, token, platformFor());
  };

  useEffect(() => {
    if (!isLoggedIn || !isNativeApp()) return;
    // addListener resolves to the handle asynchronously — can't rely on
    // the return value synchronously, so capture it for cleanup instead.
    let handle;
    onPushTokenReceived((token) => { registerPushToken(token).catch(() => {}); })
      .then((h) => { handle = h; });
    return () => { handle?.remove?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user?.id]);

  // Contextual permission prompt: the first time a user turns alerts ON
  // for a saved address, not at onboarding, when it's tied to a moment
  // they actually understand. Native-only — on web/PWA the in-app
  // AnnouncementBanner already covers "push updates into the app."
  const handleToggleNotify = async (addr) => {
    const next = !addr.notify;
    setNotifyBusyId(addr.id);
    setSaved(prev => prev.map(a => a.id === addr.id ? { ...a, notify: next } : a));
    await toggleAddressNotify(addr.id, next);
    if (next && isNativeApp() && user?.id) {
      try {
        const permission = await requestPushPermission();
        if (permission === "granted") {
          setPushSetupMsg("Registering this device…");
          try {
            const token = await getPushToken();
            if (token) await registerPushToken(token);
          } catch {
            // Fast path failed — normal on iOS if native APNs<->FCM
            // registration hasn't finished yet. The tokenReceived
            // listener above will still catch it once it does.
          }
          setTimeout(() => setPushSetupMsg(null), 2500);
        } else if (permission === "denied") {
          setPushSetupMsg("Notifications blocked — enable them in your phone's Settings app to get alerts.");
          setTimeout(() => setPushSetupMsg(null), 4000);
        }
      } catch (err) {
        console.warn("[ProRated] Push permission/token flow failed:", err.message);
        setPushSetupMsg("Couldn't set up notifications — try again in a moment.");
        setTimeout(() => setPushSetupMsg(null), 4000);
      }
    }
    setNotifyBusyId(null);
  };

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
        setSeatError(`${t(lang,"dashboard.errSeatLimit")} (${seatLimit}). ${t(lang,"dashboard.errSeatLimitBody")}`);
        setInvLoad(false);
        return;
      }
      setSeatError(null);

      // Generate unique token for invite link
      const inviteToken = crypto.randomUUID();
      const expiresAt   = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Create invite record with token
      const inviteRes = await fetch(`${SUPABASE_URL}/rest/v1/invites`, {
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
      if (!inviteRes.ok) {
        const body = await inviteRes.text().catch(() => "");
        throw new Error(`Invite record failed (${inviteRes.status})${body ? ": " + body : ""}`);
      }

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
      setInvError(t(lang,"dashboard.errInvite"));
    }
    setInvLoad(false);
  };

  const handleRemoveMember = async (memberId) => {
    if (!company) return;
    if (!window.confirm(t(lang,"dashboard.confirmRemoveMember"))) return;
    setRemoveMemberError(null);
    try {
      const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
      const token   = session.access_token;
      // Plain PATCH doesn't work here — RLS only allows a user to update
      // their own row, so an owner PATCHing a teammate's row was always
      // silently rejected (0 rows affected, no error surfaced). This RPC
      // does the same job with its own server-side authorization check.
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/remove_team_member`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ p_member_id: memberId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || t(lang,"dashboard.errRemoveMember"));
      }
      setMembers(m => m.filter(x => x.id !== memberId));
    } catch (err) {
      console.warn("[ProRated] Remove member error:", err);
      setRemoveMemberError(err.message || t(lang,"dashboard.errRemoveMemberRetry"));
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
    if (!window.confirm(`${t(lang,"dashboard.confirmDeleteTeamPrefix")} "${company.name}"${t(lang,"dashboard.confirmDeleteTeamSuffix")}`)) return;
    try {
      const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
      const token   = session.access_token;

      // Plain PATCH/DELETE didn't work here — RLS blocked clearing other
      // members' company_id/company_role (self-only update policy), and
      // there was no DELETE policy on companies at all, so the company row
      // itself never actually got deleted either. This RPC does the whole
      // thing atomically server-side with its own owner authorization check.
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/delete_company_workspace`, {
        method: "POST",
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ p_company_id: company.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || t(lang,"dashboard.errDeleteTeam"));
      }

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
      window.alert(err.message || t(lang,"dashboard.errDeleteTeamRetry"));
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
            <div style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>{t(lang,"dashboard.paymentSuccessBanner")}</div>
            <div style={{ fontSize: 12, color: "#15803D", marginTop: 2 }}>{t(lang,"dashboard.paymentSuccessBannerSub")}</div>
          </div>
        </div>
      )}

      {/* Pending verification banner */}
      {isLoggedIn && user?.status === "pending" && (
        <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E" }}>{t(lang,"dashboard.verificationBanner")}</div>
          <div style={{ fontSize: 11, color: "#92400E", marginTop: 2 }}>{t(lang,"dashboard.verificationBannerSub")}</div>
        </div>
      )}

      {/* Profile header */}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 52, height: 52, background: "linear-gradient(135deg, #2563EB, #7C3AED)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 15, fontWeight: 800, letterSpacing: "-0.5px" }}>
            {(displayName.trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("")).toUpperCase()}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 19, fontWeight: 800, color: BRAND.dark, margin: 0 }}>{displayName}</h1>
              {isLoggedIn && user?.status === "approved" && <span style={{ background: "#DCFCE7", color: "#166534", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>✓ MEMBER</span>}
              {isLoggedIn && user?.status === "pending"  && <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>⏳ PENDING</span>}
            </div>
            <div style={{ fontSize: 12, color: BRAND.gray }}>
              {trade?.icon} {trade?.label || t(lang,"dashboard.contractor")}{user?.state ? ` · ${user.state}` : ""}
            </div>
            {isLoggedIn && (() => {
              const score = user?.trust_score || 0;
              const helpful = myReviews.reduce((sum, r) => sum + (r.helpfulCount || 0), 0);
              const tier = score >= 90 ? { badge: "🛡️", label: t(lang,"dashboard.tierElite"),     color: "#7C3AED" }
                         : score >= 75 ? { badge: "⭐", label: t(lang,"dashboard.tierVerified"),  color: "#D97706" }
                         : score >= 50 ? { badge: "🟢", label: t(lang,"dashboard.tierTrusted"),   color: "#16A34A" }
                         : score >= 25 ? { badge: "🔵", label: t(lang,"dashboard.tierEstablished"), color: "#2563EB" }
                         :               { badge: "⚪", label: t(lang,"dashboard.tierNew"),        color: "#64748B" };
              return (
                <div style={{ fontSize: 11, fontWeight: 700, color: tier.color, marginTop: 3 }}>
                  {tier.badge} {score}/100 · {tier.label}
                  {helpful > 0 && <span style={{ color: BRAND.gray, fontWeight: 600 }}> · 👍 {helpful} helpful</span>}
                </div>
              );
            })()}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={() => go("review")}>{t(lang,"dashboard.newReview")}</Btn>
          {isLoggedIn && (
            <button onClick={handleLogout}
              style={{ background: "none", border: `1px solid ${BRAND.border}`, color: BRAND.gray, padding: "8px 14px", borderRadius: 9, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              {t(lang,"dashboard.logOut")}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.6rem", marginBottom: "1.25rem" }}>
        {[
          [myReviews.length.toString(),              t(lang,"dashboard.reviewsSubmitted"), ""],
          [(user?.helpful_count ?? 0).toString(),    t(lang,"dashboard.helpfulVotes"), t(lang,"dashboard.fromPeers")],
          [saved.length.toString(),                  t(lang,"dashboard.saved"),        t(lang,"dashboard.watching")],
          [(user?.trust_score ?? 0).toString(),      t(lang,"dashboard.trustScore"),   t(lang,"dashboard.reviewerRating")],
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
              {t(lang,"dashboard.allSetTitle")}
            </h2>
            <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, marginBottom: 24 }}>
              {user?.status === "pending"
                ? t(lang,"dashboard.allSetPending")
                : t(lang,"dashboard.allSetActive")}
            </p>

            {/* Plan features list */}
            <div style={{ background: "#F0FDF4", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: 24, textAlign: "left" }}>
              {[
                t(lang,"dashboard.featLookups"),
                t(lang,"dashboard.featRatings"),
                t(lang,"dashboard.featBidPrep"),
                t(lang,"dashboard.featTeamLogins"),
                t(lang,"dashboard.featEmailAlerts"),
                t(lang,"dashboard.featPOI"),
                t(lang,"dashboard.featWatchlist"),
              ].map(f => (
                <div key={f} style={{ fontSize: 13, color: "#166534", fontWeight: 600, padding: "4px 0" }}>{f}</div>
              ))}
            </div>

            <button onClick={onPaymentAck}
              style={{ width: "100%", background: "linear-gradient(135deg, #16A34A, #059669)", color: "#fff", border: "none", padding: "14px", borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.3px" }}>
              {t(lang,"dashboard.letsGo")}
            </button>
            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 12, marginBottom: 0 }}>
              {t(lang,"dashboard.thankYouSupporting")}
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
              🛡️ {myReviews.length} {t(lang,"dashboard.reviewsSubmittedCount")}
            </div>
            <div style={{ fontSize: 11, color: "#15803D", marginTop: 4 }}>
              {t(lang,"dashboard.reviewActivityBody")}
            </div>
          </div>
        )}
        </>
      )}
      {tab === "reviews" && (
        <div>
          {loadingReviews ? (
            <div style={{ textAlign: "center", padding: "2rem", color: BRAND.gray, fontSize: 13 }}>{t(lang,"dashboard.loadingReviews")}</div>
          ) : myReviews.length === 0 ? (
            <Card style={{ textAlign: "center", padding: "1.5rem" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.dark, marginBottom: 4 }}>{t(lang,"dashboard.noReviewsYet")}</div>
              <div style={{ fontSize: 12, color: BRAND.gray, marginBottom: 16 }}>{t(lang,"dashboard.noReviewsBody")}</div>
              <Btn onClick={() => go("review")}>{t(lang,"dashboard.leaveFirstReview")}</Btn>
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
                        📍 {r.address ? toTitleCase(r.address) : t(lang,"dashboard.addressOnFile")}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <Stars score={score} size={12} />
                        <span style={{ fontSize: 11, color: BRAND.gray }}>
                          {tr?.icon} {tr?.label || r.trade}
                          {date && ` · ${new Date(date).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short", year: "numeric" })}`}
                        </span>
                        {(() => {
                          const s = user?.trust_score || 0;
                          const tr = s >= 90 ? { badge: "🛡️", label: t(lang,"dashboard.tierElite"),      color: "#7C3AED", bg: "#FAF5FF", border: "#DDD6FE" }
                                  : s >= 75 ? { badge: "⭐",  label: t(lang,"dashboard.tierVerified"),   color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" }
                                  : s >= 50 ? { badge: "🟢",  label: t(lang,"dashboard.tierTrusted"),    color: "#16A34A", bg: "#F0FDF4", border: "#86EFAC" }
                                  : s >= 25 ? { badge: "🔵",  label: t(lang,"dashboard.tierEstablished"), color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" }
                                  :           { badge: "⚪",  label: t(lang,"dashboard.tierNew"),        color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" };
                          return <span style={{ background: tr.bg, border: `1px solid ${tr.border}`, color: tr.color, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>{tr.badge} {tr.label}</span>;
                        })()}
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
                        const tag = getTagsForTrade(r.trade).find(x => x.id === tid);
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
                          🔧 <strong>{t(lang,"dashboard.workType")}:</strong> {workLabel}
                        </div>
                      )}

                      {/* Would return */}
                      {wouldReturn !== null && wouldReturn !== undefined && (
                        <div style={{ fontSize: 12, marginBottom: 10 }}>
                          {wouldReturn
                            ? <span style={{ color: "#16A34A", fontWeight: 600 }}>👍 {t(lang,"dashboard.wouldReturn")}</span>
                            : <span style={{ color: "#DC2626", fontWeight: 600 }}>👎 {t(lang,"dashboard.wouldNotReturn")}</span>}
                        </div>
                      )}

                      {/* All tags */}
                      {tags.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                          {tags.map(tid => {
                            const tag = getTagsForTrade(r.trade).find(x => x.id === tid);
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
                        <span style={{ fontSize: 11, color: BRAND.gray }}>👍 {r.helpful_count || r.helpfulCount || 0} {t(lang,"dashboard.foundHelpful")}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => go("home", r.address || "")}
                            style={{ background: "#EFF6FF", border: `1px solid #BFDBFE`, color: BRAND.blue, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 7, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                            🏠 {t(lang,"dashboard.view")}
                          </button>
                          <button
                            onClick={() => goReview ? goReview(r.address || "", r.id) : go("review")}
                            style={{ background: "none", border: `1px solid ${BRAND.border}`, color: BRAND.gray, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 7, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                            ✏️ {t(lang,"dashboard.edit")}
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm(t(lang,"dashboard.confirmDeleteReview"))) return;
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
            <div style={{ fontSize: 13, fontWeight: 600 }}>{t(lang,"dashboard.addReview")}</div>
          </div>
        </div>
      )}

      {/* Saved Addresses */}
      {tab === "saved" && (
        <div>
          {pushSetupMsg && (
            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "#1E40AF", textAlign: "center" }}>
              {pushSetupMsg}
            </div>
          )}
          {!isLoggedIn && (
            <div style={{ textAlign: "center", padding: "2rem", background: "#F8FAFC", borderRadius: 14, border: `1px solid ${BRAND.border}` }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🔒</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.dark, marginBottom: 6 }}>{t(lang,"dashboard.signInToSave")}</div>
              <div style={{ fontSize: 13, color: BRAND.gray, marginBottom: 16 }}>{t(lang,"dashboard.signInBody")}</div>
              <Btn onClick={() => go("signup")}>{t(lang,"dashboard.signUpFree")}</Btn>
            </div>
          )}
          {isLoggedIn && loadingSaved && (
            <div style={{ textAlign: "center", padding: "2rem", color: BRAND.gray }}>{t(lang,"dashboard.loadingAddresses")}</div>
          )}
          {isLoggedIn && !loadingSaved && saved.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem", background: "#F8FAFC", borderRadius: 14, border: `1px solid ${BRAND.border}` }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📍</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.dark, marginBottom: 6 }}>{t(lang,"dashboard.noSaved")}</div>
              <div style={{ fontSize: 13, color: BRAND.gray, marginBottom: 16 }}>{t(lang,"dashboard.noSavedBody")}</div>
              <Btn onClick={() => go("home")}>{t(lang,"dashboard.searchBtn")}</Btn>
            </div>
          )}
          {isLoggedIn && !loadingSaved && saved.map(addr => (
            <Card key={addr.id} style={{ marginBottom: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.dark, marginBottom: 2 }}>📍 {toTitleCase(addr.address)}</div>
                  <div style={{ fontSize: 12, color: BRAND.gray }}>{t(lang,"dashboard.savedOn")} {new Date(addr.created_at).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric" })}</div>
                </div>
                <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
                  <Btn small onClick={() => {
                    try { sessionStorage.setItem("pr_search_query", addr.address); } catch {}
                    go("home");
                  }}>{t(lang,"dashboard.view")}</Btn>
                  <button
                    onClick={() => handleToggleNotify(addr)}
                    disabled={notifyBusyId === addr.id}
                    title={addr.notify ? "Alerts on — tap to turn off" : "Alerts off — tap to turn on"}
                    style={{ background: "none", border: "none", fontSize: 16, cursor: notifyBusyId === addr.id ? "not-allowed" : "pointer", padding: 4, opacity: notifyBusyId === addr.id ? 0.5 : 1 }}
                  >{addr.notify ? "🔔" : "🔕"}</button>
                  <button
                    onClick={async () => {
                      await unsaveAddress(addr.address);
                      setSaved(prev => prev.filter(a => a.id !== addr.id));
                    }}
                    style={{ background: "#FEE2E2", color: "#991B1B", border: "none", borderRadius: 7, padding: "5px 9px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                    title={t(lang,"dashboard.removeSaved")}
                  >✕</button>
                </div>
              </div>
            </Card>
          ))}
          {isLoggedIn && !loadingSaved && (
            <Card style={{ marginTop: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 2 }}>📧 {t(lang,"dashboard.watchlistEmailTitle")}</div>
                  <div style={{ fontSize: 11, color: BRAND.gray }}>{t(lang,"dashboard.watchlistEmailSub")}</div>
                </div>
                <button onClick={handleToggleWatchlistOptIn} disabled={watchlistOptInSaving}
                  style={{ background: user?.watchlist_email_opt_in ? "#F1F5F9" : BRAND.blue, color: user?.watchlist_email_opt_in ? BRAND.gray : "#fff", border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: watchlistOptInSaving ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0, opacity: watchlistOptInSaving ? 0.6 : 1 }}>
                  {watchlistOptInSaving ? t(lang,"dashboard.saving") : user?.watchlist_email_opt_in ? t(lang,"dashboard.turnOff") : t(lang,"dashboard.turnOn")}
                </button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Company / Team */}
      {tab === "company" && (
        <div style={{ animation: "fadeUp 0.25s ease both" }}>
          {(() => {
            const currentUserIsOwner = user?.company_role === "owner" || (company && company.owner_id === user?.id);
            return (
          companyLoading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: BRAND.gray, fontSize: 13 }}>{t(lang,"dashboard.loadingTeam")}</div>
          ) : !company ? (
            // No company yet — only owners/paid solos see setup CTA; members shouldn't reach here
            user?.company_role === "member" ? (
              <Card>
                <div style={{ textAlign: "center", padding: "1rem 0" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.dark, marginBottom: 6 }}>{t(lang,"dashboard.teamLoadingEllipsis")}</div>
                  <div style={{ fontSize: 13, color: BRAND.gray }}>{t(lang,"dashboard.teamSyncing")}</div>
                </div>
              </Card>
            ) : (
            <Card>
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🏗️</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.dark, marginBottom: 6 }}>{t(lang,"dashboard.setUpCompanyTitle")}</div>
                <div style={{ fontSize: 13, color: BRAND.gray, marginBottom: 20, lineHeight: 1.6 }}>
                  {t(lang,"dashboard.setUpCompanyBody")}
                </div>
                <Btn fullWidth onClick={() => go("company-setup")}>{t(lang,"dashboard.setUpCompanyBtn")}</Btn>
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
                          {renameLoading ? "..." : t(lang,"dashboard.save")}
                        </button>
                        <button onClick={() => { setRenamingCompany(false); setNewCompanyName(""); }}
                          style={{ background: "none", border: `1px solid ${BRAND.border}`, borderRadius: 7, padding: "4px 10px", fontSize: 11, color: BRAND.gray, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                          {t(lang,"dashboard.cancel")}
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: 16, fontWeight: 800, color: BRAND.dark }}>{company.name}</div>
                    )}
                    <div style={{ fontSize: 12, color: BRAND.gray, marginTop: 2 }}>
                      {COMPANY_TIERS[company.plan]?.icon} {COMPANY_TIERS[company.plan]?.name} {t(lang,"dashboard.planWord")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark }}>
                        {companyMembers.length} / {company.plan === "gold" ? "∞" : COMPANY_TIERS[company.plan]?.seatLimit} {t(lang,"dashboard.seats")}
                      </div>
                      <div style={{ fontSize: 10, color: BRAND.gray }}>{t(lang,"dashboard.teamMembers")}</div>
                    </div>
                    {currentUserIsOwner && (
                      <button onClick={() => setShowTeamSettings(s => !s)}
                        title={t(lang,"dashboard.teamSettings")}
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
                    🎁 {t(lang,"dashboard.trialActive")} {new Date(company.trial_ends_at).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                )}

                {/* Team settings panel */}
                {showTeamSettings && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BRAND.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, marginBottom: 10 }}>{t(lang,"dashboard.teamSettings")}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button
                        onClick={() => { setRenamingCompany(true); setNewCompanyName(company.name); setShowTeamSettings(false); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 9, padding: "9px 12px", fontSize: 12, fontWeight: 600, color: BRAND.dark, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
                        ✏️ {t(lang,"dashboard.renameCompany")}
                      </button>
                      <button
                        onClick={() => go("pricing")}
                        style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 9, padding: "9px 12px", fontSize: 12, fontWeight: 600, color: BRAND.dark, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
                        ⬆️ {t(lang,"dashboard.upgradeChangePlan")}
                      </button>
                      <button
                        onClick={handleDeleteTeam}
                        style={{ display: "flex", alignItems: "center", gap: 8, background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 9, padding: "9px 12px", fontSize: 12, fontWeight: 600, color: "#DC2626", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
                        🗑️ {t(lang,"dashboard.deleteTeamWorkspace")}
                      </button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Invite member — owners only */}
              {currentUserIsOwner && <Card style={{ marginBottom: "0.85rem" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 4 }}>{t(lang,"dashboard.inviteMember")}</div>
                <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: 12 }}>{t(lang,"dashboard.inviteMemberSub")}</div>

                {seatError && (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#991B1B", marginBottom: 10 }}>
                    {seatError}
                    <button onClick={() => go("pricing")} style={{ background: "none", border: "none", color: BRAND.blue, fontSize: 12, fontWeight: 700, cursor: "pointer", marginLeft: 8, fontFamily: "'DM Sans', sans-serif" }}>{t(lang,"dashboard.upgradeArrow")}</button>
                  </div>
                )}

                {inviteSuccess && (
                  <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#166534", fontWeight: 600, marginBottom: 10 }}>
                    {t(lang,"dashboard.inviteSent")}
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
                    {inviteLoading ? "..." : t(lang,"dashboard.invite")}
                  </button>
                </div>
              </Card>}

              {/* Team members list */}
              <Card style={{ marginBottom: "0.85rem" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 12 }}>{t(lang,"dashboard.teamMembers")} ({companyMembers.length})</div>
                {removeMemberError && (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#991B1B", marginBottom: 10 }}>
                    {removeMemberError}
                  </div>
                )}
                {companyMembers.length === 0 ? (
                  <div style={{ fontSize: 13, color: BRAND.gray, textAlign: "center", padding: "1rem 0" }}>{t(lang,"dashboard.noTeamMembers")}</div>
                ) : (
                  companyMembers.map(member => {
                    const trade = member.trade ? (TRADES.find(t => t.id === member.trade)?.label || member.trade) : "—";
                    const isOwner = member.company_role === "owner";
                    return (
                      <div key={member.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${BRAND.border}` }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>
                            {member.name || "—"}
                            {isOwner && <span style={{ fontSize: 10, background: "#EFF6FF", color: BRAND.blue, fontWeight: 700, padding: "2px 7px", borderRadius: 6, marginLeft: 6 }}>{t(lang,"dashboard.owner")}</span>}
                          </div>
                          <div style={{ fontSize: 11, color: BRAND.gray }}>{member.email} · {trade}</div>
                        </div>
                        {currentUserIsOwner && !isOwner && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            style={{ background: "none", border: "1px solid #FCA5A5", color: "#DC2626", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 7, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
                            {t(lang,"dashboard.remove")}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </Card>

              {/* Upgrade plan — owners only */}
              {currentUserIsOwner && company.plan !== "gold" && (
                <div onClick={() => go("pricing")}
                  style={{ background: "linear-gradient(135deg, #0F172A, #1E3A5F)", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#F8FAFC", marginBottom: 2 }}>{t(lang,"dashboard.needMoreSeats")}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>
                      {company.plan === "bronze" ? t(lang,"dashboard.upgradeSilverBody") : t(lang,"dashboard.upgradeGoldBody")}
                    </div>
                  </div>
                  <button style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "8px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
                    {t(lang,"dashboard.upgradeArrow")}
                  </button>
                </div>
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
                  {paymentSuccess ? t(lang,"dashboard.paymentReceivedLogin") : t(lang,"dashboard.loginPrompt")}
                </div>
                <div style={{ fontSize: 13, color: BRAND.gray, marginBottom: 16 }}>
                  {paymentSuccess ? t(lang,"dashboard.paymentReceivedBody") : t(lang,"dashboard.loginBody")}
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <Btn onClick={() => goLogin ? goLogin() : go("signup")}>{t(lang,"dashboard.logIn")}</Btn>
                  {!paymentSuccess && <Btn variant="secondary" onClick={() => go("signup")}>{t(lang,"dashboard.signUpFree")}</Btn>}
                </div>
              </div>

            </div>
          ) : (
            <div>
              {/* Trust Score Card */}
              {(() => {
                const score = user?.trust_score || 0;
                const tierLabel = (min) =>
                  min >= 90 ? t(lang,"dashboard.tierElite")
                  : min >= 75 ? t(lang,"dashboard.tierVerified")
                  : min >= 50 ? t(lang,"dashboard.tierTrusted")
                  : min >= 25 ? t(lang,"dashboard.tierEstablished")
                  : t(lang,"dashboard.tierNew");
                const tiers = [
                  { min: 90, max: 100, badge: "🛡️", color: "#7C3AED", bg: "#FAF5FF" },
                  { min: 75, max: 89,  badge: "⭐", color: "#D97706", bg: "#FFFBEB" },
                  { min: 50, max: 74,  badge: "🟢", color: "#16A34A", bg: "#F0FDF4" },
                  { min: 25, max: 49,  badge: "🔵", color: "#2563EB", bg: "#EFF6FF" },
                  { min: 0,  max: 24,  badge: "⚪", color: "#64748B", bg: "#F8FAFC" },
                ];
                const tier = tiers.find(tr => score >= tr.min && score <= tr.max) || tiers[4];
                const tierIdx = tiers.indexOf(tier);
                const nextTier = tierIdx > 0 ? tiers[tierIdx - 1] : null;
                const pct = Math.round(((score - tier.min) / Math.max(tier.max - tier.min, 1)) * 100);
                return (
                  <div style={{ background: tier.bg, border: `1.5px solid ${tier.color}44`, borderRadius: 16, padding: "1.25rem", marginBottom: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: tier.color, marginBottom: 4 }}>{t(lang,"dashboard.trustScore")}</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                          <span style={{ fontSize: 48, fontWeight: 900, color: tier.color, lineHeight: 1 }}>{score}</span>
                          <span style={{ fontSize: 16, color: tier.color, opacity: 0.5 }}>/100</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 22 }}>{tier.badge}</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: tier.color, marginTop: 4 }}>{tierLabel(tier.min)}</div>
                      </div>
                    </div>
                    <div style={{ height: 6, background: "rgba(0,0,0,0.08)", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: tier.color, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 11, color: tier.color, opacity: 0.8, marginBottom: 10 }}>
                      {nextTier ? `${nextTier.min - score} ${t(lang,"dashboard.ptsToNext")} ${tierLabel(nextTier.min)}` : t(lang,"dashboard.maxTier")}
                    </div>
                    <div style={{ paddingTop: 10, borderTop: `1px solid ${tier.color}22`, display: "flex", gap: 14, fontSize: 11, color: tier.color, opacity: 0.7, flexWrap: "wrap" }}>
                      <span>{t(lang,"dashboard.scoreRuleReviews")}</span>
                      <span>{t(lang,"dashboard.scoreRuleHelpful")}</span>
                      <span>{t(lang,"dashboard.scoreRuleAge")}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Account details */}
              <Card style={{ marginBottom: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>{t(lang,"dashboard.accountDetails")}</div>
                  {!editingProfile && (
                    <button onClick={startEditingProfile}
                      style={{ background: "none", border: "none", color: BRAND.blue, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                      ✏️ {t(lang,"dashboard.edit")}
                    </button>
                  )}
                </div>

                {editingProfile ? (
                  <>
                    {[
                      ["name", t(lang,"dashboard.fieldName")],
                      ["company_name", t(lang,"dashboard.fieldCompany")],
                      ["phone", t(lang,"dashboard.fieldPhone")],
                    ].map(([key, label]) => (
                      <div key={key} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: 4 }}>{label}</div>
                        <input
                          value={profileForm[key]}
                          onChange={e => setProfileForm(f => ({ ...f, [key]: e.target.value }))}
                          style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${BRAND.border}`, borderRadius: 9, fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: BRAND.dark, outline: "none", boxSizing: "border-box" }}
                        />
                      </div>
                    ))}
                    {profileError && <div style={{ fontSize: 12, color: "#DC2626", marginBottom: 10 }}>{profileError}</div>}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={handleProfileSave} disabled={profileSaving}
                        style={{ flex: 1, background: BRAND.blue, color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontSize: 12, fontWeight: 700, cursor: profileSaving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: profileSaving ? 0.6 : 1 }}>
                        {profileSaving ? "..." : t(lang,"dashboard.save")}
                      </button>
                      <button onClick={() => setEditingProfile(false)} disabled={profileSaving}
                        style={{ flex: 1, background: "none", border: `1px solid ${BRAND.border}`, borderRadius: 8, padding: "9px", fontSize: 12, color: BRAND.gray, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                        {t(lang,"dashboard.cancel")}
                      </button>
                    </div>
                  </>
                ) : (
                  [
                    [t(lang,"dashboard.fieldName"),    user?.name         || "—"],
                    [t(lang,"dashboard.fieldCompany"), user?.company_name || "—"],
                    [t(lang,"dashboard.fieldPhone"),   user?.phone        || "—"],
                    [t(lang,"dashboard.fieldEmail"),   user?.email        || "—"],
                    [t(lang,"dashboard.fieldState"),   user?.state        || "—"],
                    [t(lang,"dashboard.fieldTrade"),   trade?.label       || "—"],
                    [t(lang,"dashboard.fieldLicense"), user?.license      || "—"],
                    [t(lang,"dashboard.fieldPlan"), (
                      <>
                        {user?.plan === "bronze" ? "🥉 Bronze" :
                         user?.plan === "silver" ? "🥈 Silver" :
                         user?.plan === "gold"   ? "🥇 Gold" :
                         user?.plan === "platinum" ? "💎 Platinum" :
                         FREE_PLAN_LABEL}
                        {user?.plan && user.plan !== "free" && (
                          <button onClick={() => go("pricing")}
                            style={{ background: "none", border: "none", color: BRAND.blue, fontSize: 11, fontWeight: 700, cursor: "pointer", marginLeft: 8, fontFamily: "'DM Sans', sans-serif" }}>
                            {t(lang,"dashboard.changePlan")}
                          </button>
                        )}
                      </>
                    )],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${BRAND.border}`, fontSize: 13 }}>
                      <span style={{ color: BRAND.gray }}>{l}</span>
                      <span style={{ fontWeight: 600, color: BRAND.dark }}>{v}</span>
                    </div>
                  ))
                )}
              </Card>

              {/* Company card — shown for paid members */}
              {user?.plan && user.plan !== "free" && user?.company_name && (
                <Card style={{ marginBottom: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 2 }}>🏗️ {user.company_name}</div>
                      <div style={{ fontSize: 11, color: BRAND.gray }}>
                        {user.company_id
                          ? t(lang,"dashboard.teamActive")
                          : t(lang,"dashboard.teamSetupPrompt")}
                      </div>
                    </div>
                    {!user.company_id && (
                      <button onClick={() => go("company-setup")}
                        style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
                        {t(lang,"dashboard.setUpTeam")}
                      </button>
                    )}
                    {user.company_id && (
                      <button onClick={() => setTab("company")}
                        style={{ background: "#EFF6FF", color: BRAND.blue, border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
                        {t(lang,"dashboard.viewTeam")}
                      </button>
                    )}
                  </div>
                </Card>
              )}

              {/* Review Points */}
              {user?.plan !== "platinum" && (
                <Card style={{ marginBottom: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>⭐ {t(lang,"dashboard.reviewPoints")}</div>
                      <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 2 }}>{t(lang,"dashboard.pointsRule")}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: BRAND.blue }}>{reviewPoints}</div>
                      <div style={{ fontSize: 10, color: BRAND.gray }}>{t(lang,"dashboard.points")}</div>
                    </div>
                  </div>

                  {/* Points progress bar */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ height: 8, background: BRAND.border, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                      <div style={{ height: "100%", width: `${Math.min((reviewPoints % 40) / 40 * 100, 100)}%`, background: BRAND.blue, borderRadius: 4, transition: "width 0.4s ease" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: BRAND.gray }}>
                      <span>{reviewPoints % 40} / 40 {t(lang,"dashboard.towardNextReward")}</span>
                      <span style={{ fontWeight: 700, color: BRAND.dark }}>{t(lang,"dashboard.totalValue")}: ${pointsValue}</span>
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
                        <div style={{ fontSize: 9, color: m.reached ? BRAND.blue : BRAND.gray }}>{m.pts} {t(lang,"dashboard.points")}</div>
                      </div>
                    ))}
                  </div>

                  {/* Redeem CTA */}
                  {reviewPoints >= 40 ? (
                    <a href={`mailto:hello@prorated.app?subject=Points%20Redemption%20Request&body=Hi%20ProRated%20Team%2C%0A%0AI%20would%20like%20to%20redeem%20my%20review%20points%20for%20merch%20store%20credit.%0A%0AAccount%20email%3A%20${encodeURIComponent(user?.email || "")}%0APoints%20balance%3A%20${reviewPoints}%20points%20($${pointsValue})%0A%0APlease%20let%20me%20know%20how%20to%20proceed!`}
                      style={{ display: "block", width: "100%", padding: "10px", background: BRAND.blue, color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 700, textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>
                      {t(lang,"dashboard.redeemPoints")}
                    </a>
                  ) : (
                    <div style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 12, color: BRAND.gray, textAlign: "center" }}>
                      {t(lang,"dashboard.earnPointsPrefix")} {40 - reviewPoints} {t(lang,"dashboard.earnPointsSuffix")}
                    </div>
                  )}
                </Card>
              )}

              {/* Change Password */}
              <Card style={{ marginBottom: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onClick={() => { setShowPwChange(s => !s); setPwError(null); setPwSuccess(false); }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>🔑 {t(lang,"dashboard.changePassword")}</div>
                    {!showPwChange && <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 2 }}>{t(lang,"dashboard.changePasswordSub")}</div>}
                  </div>
                  <span style={{ fontSize: 18, color: BRAND.gray, cursor: "pointer" }}>{showPwChange ? "−" : "+"}</span>
                </div>
                {showPwChange && (
                  <div style={{ marginTop: 14, borderTop: `1px solid ${BRAND.border}`, paddingTop: 14 }}>
                    {pwSuccess ? (
                      <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#166534", textAlign: "center" }}>
                        {t(lang,"dashboard.passwordUpdated")}
                      </div>
                    ) : (
                      <>
                        {pwError && (
                          <div style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", fontSize: 12, marginBottom: 10 }}>{pwError}</div>
                        )}
                        {[
                          { key: "current", placeholder: t(lang,"dashboard.pwCurrent") },
                          { key: "next",    placeholder: t(lang,"dashboard.pwNext") },
                          { key: "confirm", placeholder: t(lang,"dashboard.pwConfirm") },
                        ].map(({ key, placeholder }) => (
                          <PasswordInput
                            key={key}
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
                          {pwLoading ? t(lang,"dashboard.updating") : t(lang,"dashboard.updatePassword")}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </Card>

              {/* Trade Associations */}
              <Card style={{ marginBottom: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                  onClick={() => setShowMemberships(s => !s)}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>🤝 {t(lang,"dashboard.tradeAssociations")}</div>
                    {!showMemberships && (
                      <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 2 }}>
                        {(user?.trade_memberships || []).length > 0
                          ? `${user.trade_memberships.length} ${t(lang,"dashboard.membershipsOnFile")}`
                          : t(lang,"dashboard.membershipsPrompt")}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 18, color: BRAND.gray, cursor: "pointer" }}>{showMemberships ? "−" : "+"}</span>
                </div>
                {showMemberships && (
                  <div style={{ marginTop: 14, borderTop: `1px solid ${BRAND.border}`, paddingTop: 14 }}>
                    {(!user?.trade_memberships || user.trade_memberships.length === 0) && (
                      <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#1E40AF", fontWeight: 600, marginBottom: 12 }}>
                        {t(lang,"dashboard.earnMembershipPoints")}
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, maxHeight: 280, overflowY: "auto" }}>
                      {membershipOptions.map(([key, p]) => (
                        <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: `1px solid ${selectedMemberships.includes(key) ? BRAND.blue : BRAND.border}`, background: selectedMemberships.includes(key) ? "#EFF6FF" : "#F8FAFC", cursor: "pointer" }}>
                          <input type="checkbox" checked={selectedMemberships.includes(key)} onChange={() => toggleMembership(key)}
                            style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: 16, flexShrink: 0 }}>{p.icon}</span>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: BRAND.dark }}>{p.name}</span>
                        </label>
                      ))}
                    </div>
                    {membershipsSaved ? (
                      <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#166534", fontWeight: 700, textAlign: "center" }}>
                        {t(lang,"dashboard.savedExclaim")}
                      </div>
                    ) : (
                      <button
                        onClick={handleSaveMemberships}
                        disabled={membershipsSaving}
                        style={{ width: "100%", padding: "10px", background: BRAND.blue, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: membershipsSaving ? "not-allowed" : "pointer", opacity: membershipsSaving ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif" }}>
                        {membershipsSaving ? t(lang,"dashboard.saving") : t(lang,"dashboard.saveArrow")}
                      </button>
                    )}
                  </div>
                )}
              </Card>

              {/* Upgrade to Pro */}
              {(!user?.plan || user?.plan === "free") && !user?.stripe_customer_id && (
                <div onClick={() => go("pricing")} style={{ background: "linear-gradient(135deg, #0F172A, #1E3A5F)", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#F8FAFC", marginBottom: 2 }}>{t(lang, "upgrade.title")}</div>
                    <div style={{ fontSize: 11, color: "#86EFAC", fontWeight: 700 }}>{t(lang,"dashboard.freeThrough2026")}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); go("pricing"); }}
                    style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
                    {t(lang,"dashboard.viewPlans")}
                  </button>
                </div>
              )}



              {/* Face ID / Touch ID sign-in — status + off switch only */}
              {nativeApp && bioSaved && (
                <Card style={{ marginBottom: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 2 }}>🔓 {bioLabel} {t(lang,"dashboard.signIn")}</div>
                      <div style={{ fontSize: 11, color: BRAND.gray }}>{t(lang,"dashboard.bioEnabled")}</div>
                    </div>
                    <button onClick={handleDisableBiometric}
                      style={{ background: "#F1F5F9", color: BRAND.gray, border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0, marginLeft: 10 }}>
                      {t(lang,"dashboard.turnOff")}
                    </button>
                  </div>
                </Card>
              )}

              {/* 2FA (TOTP) — fully opt-in, never required to sign in */}
              {!mfaChecking && (
                <Card style={{ marginBottom: "0.85rem" }}>
                  {mfaError && (
                    <div style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", fontSize: 12, marginBottom: 12 }}>{mfaError}</div>
                  )}

                  {/* Already enrolled — status + turn off */}
                  {mfaFactor && !mfaEnrollData && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 2 }}>🔐 Two-factor authentication</div>
                        <div style={{ fontSize: 11, color: BRAND.gray }}>Enabled — a code from your authenticator app is required to sign in.</div>
                      </div>
                      <button onClick={handleDisableMfa} disabled={mfaBusy}
                        style={{ background: "#F1F5F9", color: BRAND.gray, border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0, marginLeft: 10 }}>
                        {mfaBusy ? "…" : t(lang,"dashboard.turnOff")}
                      </button>
                    </div>
                  )}

                  {/* Not enrolled, not mid-flow — offer to enable */}
                  {!mfaFactor && !mfaEnrollData && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 2 }}>🔐 Two-factor authentication</div>
                        <div style={{ fontSize: 11, color: BRAND.gray }}>Optional — add an authenticator-app code as a second sign-in step.</div>
                      </div>
                      <button onClick={handleStartMfaEnroll} disabled={mfaBusy}
                        style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0, marginLeft: 10 }}>
                        {mfaBusy ? "…" : "Enable"}
                      </button>
                    </div>
                  )}

                  {/* Mid-enrollment — QR + secret + confirm code */}
                  {mfaEnrollData && (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 10 }}>🔐 Scan with your authenticator app</div>
                      <div
                        style={{ width: 180, height: 180, margin: "0 auto 12px", background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 10, padding: 8 }}
                        dangerouslySetInnerHTML={{ __html: mfaEnrollData.totp?.qr_code || "" }}
                      />
                      <div style={{ background: "#EFF6FF", border: `1px solid #BFDBFE`, borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#1E40AF", marginBottom: 6 }}>
                          On this same phone? You can't scan a code it's also displaying — enter this instead:
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <div style={{ flex: 1, fontSize: 12, fontFamily: "ui-monospace, monospace", background: "#fff", border: "1px solid #BFDBFE", borderRadius: 8, padding: "8px 10px", wordBreak: "break-all" }}>
                            {mfaEnrollData.totp?.secret}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(mfaEnrollData.totp?.secret || "");
                              setMfaSecretCopied(true);
                              setTimeout(() => setMfaSecretCopied(false), 2000);
                            }}
                            style={{ background: BRAND.blue, color: "#fff", border: "none", borderRadius: 8, padding: "8px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
                            {mfaSecretCopied ? "Copied ✓" : "Copy"}
                          </button>
                        </div>
                        <div style={{ fontSize: 10, color: "#1E40AF", marginTop: 6 }}>
                          Open your authenticator app (Google Authenticator, Authy, etc.), choose "Enter a setup key" instead of scanning, and paste this in.
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: 6 }}>Then enter the 6-digit code it shows:</div>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="000000"
                        value={mfaEnrollCode}
                        onChange={e => setMfaEnrollCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        style={{ width: "100%", boxSizing: "border-box", textAlign: "center", fontSize: 20, letterSpacing: 6, fontWeight: 700, padding: "10px", borderRadius: 8, border: `1px solid ${BRAND.border}`, fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn fullWidth onClick={handleConfirmMfaEnroll} disabled={mfaEnrollCode.length !== 6 || mfaBusy}>
                          {mfaBusy ? "Verifying…" : "Confirm →"}
                        </Btn>
                      </div>
                      <button onClick={handleCancelMfaEnroll}
                        style={{ background: "none", border: "none", color: BRAND.gray, fontSize: 12, cursor: "pointer", marginTop: 10, fontFamily: "'DM Sans', sans-serif", width: "100%" }}>
                        Cancel
                      </button>
                    </div>
                  )}
                </Card>
              )}

              {/* Delete Account */}
              <Card style={{ marginBottom: "0.85rem", border: showDeleteAccount ? "1.5px solid #FCA5A5" : undefined }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                  onClick={() => setShowDeleteAccount(s => !s)}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>🗑️ {t(lang,"dashboard.deleteAccount")}</div>
                    {!showDeleteAccount && <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 2 }}>{t(lang,"dashboard.deleteAccountSub")}</div>}
                  </div>
                  <span style={{ fontSize: 18, color: BRAND.gray }}>{showDeleteAccount ? "−" : "+"}</span>
                </div>
                {showDeleteAccount && (
                  <div style={{ marginTop: 14, borderTop: `1px solid ${BRAND.border}`, paddingTop: 14 }}>
                    <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#991B1B", lineHeight: 1.6, marginBottom: 14 }}>
                      <strong>{t(lang,"dashboard.cannotBeUndone")}</strong> {t(lang,"dashboard.deleteWarningBody")}
                    </div>
                    {user?.plan && user.plan !== "free" && (
                      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#92400E", lineHeight: 1.6, marginBottom: 14 }}>
                        <strong>{t(lang,"dashboard.doesNotCancel")}</strong>{" "}
                        {user.plan_source === "revenuecat"
                          ? t(lang,"dashboard.stillBilledApple")
                          : t(lang,"dashboard.stillBilledEmail")}
                      </div>
                    )}
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteAccountLoading}
                      style={{ width: "100%", padding: "10px", background: "#DC2626", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: deleteAccountLoading ? "not-allowed" : "pointer", opacity: deleteAccountLoading ? 0.6 : 1, fontFamily: "'DM Sans', sans-serif" }}>
                      {deleteAccountLoading ? t(lang,"dashboard.submittingRequest") : t(lang,"dashboard.requestDeletion")}
                    </button>
                  </div>
                )}
              </Card>

              {/* Log out */}
              <div style={{ marginTop: "1rem", display: "flex", gap: 8 }}>
                <button onClick={handleLogout}
                  style={{ background: "#FEE2E2", color: "#991B1B", border: "none", padding: "10px 18px", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  {t(lang,"dashboard.logOut")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}