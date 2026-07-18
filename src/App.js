import { useState, useEffect } from "react";
import { isNativeIOS } from "./utils/platform";
import Nav from "./components/Nav";
import BottomNav from "./components/BottomNav";
import { OfflineBanner, InstallBanner, IOSInstallBanner } from "./components/Banners";
import StoreBadges from "./components/StoreBadges";
import HomePage from "./pages/HomePage";
import ReviewPage from "./pages/ReviewPage";
import DashboardPage from "./pages/DashboardPage";
import SignupPage from "./pages/SignupPage";
import AdminPage from "./pages/admin/AdminPage";
import AdminGate from "./pages/admin/AdminGate";
import InvitePage from "./pages/InvitePage";
import CompanySetupPage from "./pages/CompanySetupPage";
import PricingPage from "./pages/PricingPage";
import VerificationPending from "./pages/VerificationPending";
import VerificationRejected from "./pages/VerificationRejected";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import ContactPage from "./pages/ContactPage";
import NDAPage from "./pages/NDAPage";
import RealtorSignupPage from "./pages/RealtorSignupPage";
import RealtorHomePage from "./pages/RealtorHomePage";
import VerifiedProPage from "./pages/VerifiedProPage";
import HomeownerReportPage from "./pages/HomeownerReportPage";
import AGCLandingPage from "./pages/AGCLandingPage";
import SupportPage from "./pages/SupportPage";
import ResourcesPage from "./pages/ResourcesPage";
import MerchPage from "./pages/MerchPage";
import DemoPage from "./pages/DemoPage";
import BlogPage from "./pages/BlogPage";
import MissionPage from "./pages/MissionPage";
import LocalPage from "./pages/LocalPage";
import TradePage from "./pages/TradePage";
import AlabamaContractorsPage from "./pages/AlabamaContractorsPage";
import PartnerLandingPage, { PARTNERS } from "./pages/PartnerLandingPage";
import PartnerDashboardPage from "./pages/PartnerDashboardPage";
import BetaLanding from "./pages/BetaLanding";
import BetaWelcome from "./pages/BetaWelcome";
import FeedbackButton from "./components/FeedbackButton";
import useOnboarding from "./hooks/useOnboarding";
import Logo from "./components/Logo";
import LangToggle from "./components/LangToggle";
import { BRAND, TAGLINE } from "./data/constants";
import { saveSession, updatePassword } from "./api/auth";
import usePWA from "./hooks/usePWA";
import { useAuth } from "./hooks/useAuth";
import PushPrompt from "./components/PushPrompt";

export default function App() {
  const getInitialPage = () => {
    try {
      const path = window.location.pathname;
      if (path === "/beta" || path === "/beta/") return "beta";
      if (path === "/privacy")  return "privacy";
      if (path === "/terms")    return "terms";
      if (path === "/pricing")  return "pricing";
      if (path === "/contact" || path === "/contact/") return "contact";
      if (path === "/admin" || path === "/admin/") return "admin";
      if (path === "/verified-pros" || path === "/directory") return "verified-pro";
      if (path === "/report" || path === "/homeowner-report") return "homeowner-report";
      if (path === "/agc" || path === "/agc/") return "agc";
      // Trade association partner pages
      const partnerPaths = ["acca","phcc","iec","nrca","pca","nalp","aar","abc","hba","neca","bar"];
      for (const pid of ["agc", ...partnerPaths]) {
        if (path === `/${pid}` || path === `/${pid}/`) return `partner-${pid}`;
        if (path === `/${pid}/dashboard` || path === `/${pid}/dashboard/`) return `partner-dash-${pid}`;
      }
      if (path === "/realtor" || path === "/realtor/") return "realtor-signup";
      // Blog — list page and individual article permalinks (slug handled inside BlogPage)
      if (path === "/blog" || path === "/blog/" || path.startsWith("/blog/")) return "blog";
      // Trade-specific SEO landing pages
      const tradeSlugPaths = {
        "roofing-contractors":    "roofing",
        "electrical-contractors": "electrical",
        "plumbing-contractors":   "plumbing",
        "hvac-contractors":       "hvac",
        "general-contractors":    "general",
      };
      for (const [slugPath, trade] of Object.entries(tradeSlugPaths)) {
        if (path === `/${slugPath}` || path === `/${slugPath}/`) return `trade-${trade}`;
      }
      // Legacy /trades/:trade paths already promised in sitemap.xml
      for (const trade of Object.values(tradeSlugPaths)) {
        if (path === `/trades/${trade}` || path === `/trades/${trade}/`) return `trade-${trade}`;
      }
      // Statewide SEO landing page
      if (path === "/alabama-contractors" || path === "/alabama-contractors/") return "alabama-contractors";
      // City-specific SEO landing pages
      const citySlugs = ["birmingham", "huntsville", "mobile", "montgomery", "tuscaloosa"];
      for (const city of citySlugs) {
        if (path === `/${city}` || path === `/${city}/`) return `local-${city}`;
        if (path === `/alabama/${city}` || path === `/alabama/${city}/`) return `local-${city}`;
      }
      // Handle Supabase password recovery link
      const hash = window.location.hash;
      if (hash.includes("type=recovery") && hash.includes("access_token")) return "reset-password";
      // Handle team invite links
      if (path.startsWith("/invite/")) return "invite";
      if (path === "/company-setup" || path === "/company-setup/") return "company-setup";
      if (path === "/dashboard") return "dashboard";
      return "home";
    } catch { return "home"; }
  };
  const [page, setPage]               = useState(getInitialPage);
  const [reviewAddress, setReviewAddress] = useState("");
  const [editReviewId, setEditReviewId]   = useState(null);
  const [loginMode, setLoginMode]         = useState("signup");
  const [history, setHistory]         = useState([getInitialPage()]);
  const [searchQuery, setSearchQuery] = useState("");

  const [paymentSuccess, setPaymentSuccess] = useState(() => {
    try {
      const isSuccess = new URLSearchParams(window.location.search).get("payment") === "success";
      if (isSuccess) {
        // Clean the URL immediately so it doesn't stick
        window.history.replaceState({}, "", window.location.pathname);
      }
      return isSuccess;
    }
    catch { return false; }
  });
  const [showInstall, setShowInstall] = useState(false);
  const [showIOS, setShowIOS]         = useState(false);
  const [showPush, setShowPush]       = useState(false);
  const { installPrompt, isInstalled, promptInstall } = usePWA();
  const { user, isLoggedIn, refreshUser } = useAuth(); // eslint-disable-line no-unused-vars

  // If arriving with payment=success but not logged in, auto-show login
  useEffect(() => {
    if (!paymentSuccess) return;
    const t = setTimeout(() => {
      if (!isLoggedIn) {
        // Session didn't survive Stripe redirect — prompt login
        setLoginMode("login");
        setPage("signup");
        setHistory(h => [...h, "signup"]);
      } else if (refreshUser) {
        refreshUser();
      }
    }, 600);
    return () => clearTimeout(t);
  }, [paymentSuccess, isLoggedIn]);

  // Pages that are completely self-contained — no trade pro shell at all
  const ISOLATED_PAGES = ["admin", "realtor-signup", "realtor-home", "demo"];
  const isIsolated = ISOLATED_PAGES.includes(page) ||
    Object.keys(PARTNERS).some(pid => page === `partner-dash-${pid}`);
  const [ndaSigned, setNdaSigned] = useState(() => { // eslint-disable-line no-unused-vars
    try { return localStorage.getItem("pr_nda_signed") === "true"; } catch { return false; }
  });
  const { showBetaWelcome, completeBetaWelcome } = useOnboarding();

  // Show install banner after 6s
  useEffect(() => {
    if (isInstalled) return;
    // Show push prompt after 30s
    // Show push prompt after 8s if not already subscribed/denied
    const pushTimer = setTimeout(async () => {
      if (typeof Notification !== "undefined" && Notification.permission !== "denied") {
        try {
          const reg = await navigator.serviceWorker?.getRegistration();
          const sub = await reg?.pushManager?.getSubscription();
          if (!sub) setShowPush(true);
        } catch { setShowPush(true); }
      }
    }, 8000);

    const t = setTimeout(() => {
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      if (!isStandalone) {
        if (isIOS) setShowIOS(true);
        else if (installPrompt) setShowInstall(true);
      }
    }, 6000);
    return () => { clearTimeout(t); clearTimeout(pushTimer); };
  }, [isInstalled, installPrompt]);

  // ── Password Reset Page ─────────────────────────────────────
  const ResetPasswordPage = () => {
    const [pw, setPw]     = useState("");
    const [pw2, setPw2]   = useState("");
    const [done, setDone] = useState(false);
    const [err, setErr]   = useState(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
      const hash = new URLSearchParams(window.location.hash.replace("#", "?"));
      const token = hash.get("access_token");
      const type  = hash.get("type");
      if (token && type === "recovery") {
        saveSession({ access_token: token, expires_at: Date.now() / 1000 + 3600 });
      }
    }, []);

    const handleUpdate = async () => {
      if (pw.length < 6) { setErr("Password must be at least 6 characters."); return; }
      if (pw !== pw2)    { setErr("Passwords don't match."); return; }
      setBusy(true); setErr(null);
      try {
        await updatePassword(pw);
        setDone(true);
        setTimeout(() => go("home"), 3000);
      } catch (e) {
        setErr(e.message || "Could not update password. Please try again.");
      }
      setBusy(false);
    };

    const inp = { width: "100%", padding: "11px 13px", border: `1.5px solid ${BRAND.border}`, borderRadius: 10, fontSize: 14, background: "#F8FAFC", color: BRAND.dark, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", marginBottom: 10 };

    return (
      <div style={{ maxWidth: 400, margin: "80px auto", padding: "0 1.25rem", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Logo size={56} />
          <div style={{ fontSize: 20, fontWeight: 700, color: BRAND.dark, marginTop: 12 }}>Set new password</div>
          <div style={{ fontSize: 13, color: BRAND.gray, marginTop: 4 }}>Choose a strong password for your ProRated account.</div>
        </div>
        {done ? (
          <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 12, padding: "16px", textAlign: "center", color: "#166534", fontSize: 14 }}>
            ✅ Password updated! Redirecting you to the app...
          </div>
        ) : (
          <div style={{ background: "#fff", border: `1.5px solid ${BRAND.border}`, borderRadius: 14, padding: "1.5rem" }}>
            {err && <div style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>{err}</div>}
            <input type="password" placeholder="New password (6+ characters)" value={pw}  onChange={e => setPw(e.target.value)}  style={inp} />
            <input type="password" placeholder="Confirm new password"          value={pw2} onChange={e => setPw2(e.target.value)} style={{ ...inp, marginBottom: 0 }} />
            <div style={{ marginTop: "1rem" }}>
              <button onClick={handleUpdate} disabled={!pw || !pw2 || busy}
                style={{ width: "100%", padding: "12px", background: BRAND.blue, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: pw && pw2 && !busy ? "pointer" : "not-allowed", opacity: pw && pw2 && !busy ? 1 : 0.6, fontFamily: "'DM Sans', sans-serif" }}>
                {busy ? "Updating..." : "Update password →"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Navigate forward — tracks history for back button
  const go = (p, query = "") => {
    if (query) setSearchQuery(query);
    if (p === "signup") setLoginMode("signup");
    setPage(p);
    setHistory(h => [...h, p]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Go back in history
  const goBack = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      const prev = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setPage(prev);
    } else {
      setPage("home");
      setHistory(["home"]);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Navigate to login (not signup) for gated actions
  const goLogin = () => {
    setLoginMode("login");
    setHistory(h => [...h, "signup"]);
    setPage("signup");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Navigate to review with address pre-filled
  const goReview = (address, reviewId = null) => {
    setReviewAddress(address || "");
    setEditReviewId(reviewId || null);
    setHistory(h => [...h, "review"]);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPage("review");
  };

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) setShowInstall(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=DM+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        *, *::before, *::after { box-sizing: border-box; }
        html { height: 100%; overflow: hidden; }
        body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; overscroll-behavior: none; -webkit-text-size-adjust: 100%; touch-action: pan-y; }
        #root { position: fixed; top: 0; left: 0; right: 0; bottom: 0; overflow-y: scroll; overflow-x: hidden; -webkit-overflow-scrolling: touch; overscroll-behavior: none; padding-bottom: calc(80px + env(safe-area-inset-bottom)); }
        input, textarea, button, select { font-family: inherit; }
        /* iOS Safari safe area fixes */
        body { padding-bottom: env(safe-area-inset-bottom); }
        .bottom-nav-safe { padding-bottom: calc(8px + env(safe-area-inset-bottom)) !important; }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        /* Remove tap highlight on mobile */
        button { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {!isIsolated && showBetaWelcome && <BetaWelcome onDone={completeBetaWelcome} />}
      {!isIsolated && <OfflineBanner />}
      {!isIsolated && showIOS     && <IOSInstallBanner onDismiss={() => setShowIOS(false)} />}
      {!isIsolated && showInstall && !showIOS && (
        <InstallBanner onInstall={handleInstall} onDismiss={() => setShowInstall(false)} />
      )}

      {/* Top nav — hidden on mobile, not shown on isolated pages */}
      {!isIsolated && (
      <div style={{ display: "none" }} className="desktop-nav">
        <Nav page={page} go={go} />
      </div>
      )}
      <style>{`@media(min-width:640px){ .desktop-nav { display: block !important; } }`}</style>

      {/* Mobile top bar — just logo + back button — not on isolated pages */}
      <style>{`@media(min-width:640px){ .mobile-topbar { display: none !important; } }`}</style>
      {!isIsolated && <div className="mobile-topbar" style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,0.97)", backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${BRAND.border}`,
        padding: "0 1rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", height: 52, gap: 8 }}>
          {/* Back button — show when not on home */}
          {page !== "home" && page !== "admin" && page !== "beta" && (
            <button onClick={goBack}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 8px 6px 0", display: "flex", alignItems: "center", gap: 4, color: BRAND.blue, fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
              ← Back
            </button>
          )}

          {/* Logo centered */}
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
            <button onClick={() => go("home")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <Logo size={36} />
              <div style={{ fontSize: 9, color: BRAND.gray, letterSpacing: "0.8px", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>
                Built by Pros, Built for Pros
              </div>
            </button>
          </div>

          {/* Language toggle — right side */}
          <LangToggle style={{ flexShrink: 0 }} />
        </div>
      </div>}

      <main style={{ paddingBottom: 0 }}>
        {!isIsolated && showPush && <PushPrompt onDismiss={() => { setShowPush(false); try { localStorage.setItem("pr_push_dismissed", Date.now()); } catch {} }} />}
        {page === "home"      && <HomePage      go={go} goLogin={goLogin} goReview={goReview} initialQuery={searchQuery} onQueryUsed={() => setSearchQuery("")} />}
        {page === "review"    && <ReviewPage    go={go} goBack={goBack} initialAddress={reviewAddress} editReviewId={editReviewId} />}
        {page === "dashboard" && <DashboardPage go={go} goBack={goBack} goLogin={goLogin} goReview={goReview} paymentSuccess={paymentSuccess} onPaymentAck={() => setPaymentSuccess(false)} />}
        {page === "signup"    && <SignupPage    go={go} goBack={goBack} initialMode={loginMode} />}
        {page === "pricing"   && <PricingPage        go={go} goBack={goBack} />}
        {page === "pending"   && <VerificationPending go={go} />}
        {page === "privacy"   && <PrivacyPage go={go} goBack={goBack} />}
        {page === "terms"     && <TermsPage   go={go} goBack={goBack} />}
        {page === "contact"   && <ContactPage go={go} goBack={goBack} />}
        {page === "support"     && <SupportPage go={go} />}
        {page === "resources"   && <ResourcesPage go={go} />}
        {page === "merch"       && <MerchPage go={go} />}
        {page === "demo"       && <DemoPage go={go} />}
        {page === "blog"       && <BlogPage go={go} />}
        {page === "mission"    && <MissionPage go={go} />}
        {page === "local-birmingham" && <LocalPage go={go} city="birmingham" />}
        {page === "local-huntsville" && <LocalPage go={go} city="huntsville" />}
        {page === "local-mobile"     && <LocalPage go={go} city="mobile" />}
        {page === "local-montgomery" && <LocalPage go={go} city="montgomery" />}
        {page === "local-tuscaloosa" && <LocalPage go={go} city="tuscaloosa" />}
        {page === "trade-roofing"    && <TradePage go={go} trade="roofing" />}
        {page === "trade-electrical" && <TradePage go={go} trade="electrical" />}
        {page === "trade-plumbing"   && <TradePage go={go} trade="plumbing" />}
        {page === "trade-hvac"       && <TradePage go={go} trade="hvac" />}
        {page === "trade-general"    && <TradePage go={go} trade="general" />}
        {page === "alabama-contractors" && <AlabamaContractorsPage go={go} />}
        {page === "nda" && <NDAPage go={go} user={user} onAccepted={async () => {
          localStorage.setItem("pr_nda_signed", "true");
          setNdaSigned(true);
          const stored = localStorage.getItem("post_nda_destination");
          localStorage.removeItem("post_nda_destination");
          if (stored) {
            try {
              const dest = JSON.parse(stored);
              if (dest.type === "stripe") {
                if (!isNativeIOS()) { window.location.href = dest.url; }
                else { go("dashboard"); }
                return;
              }
              if (dest.type === "iap") {
                // pending_iap_tier was set at signup — PricingPage opens the
                // UpgradeModal (real Apple IAP purchase) for it on mount.
                go("pricing");
                return;
              }
              if (dest.type === "invite") {
                // Auto-accept — user signed up specifically to join this team, no need for a second click
                const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
                try {
                  const acceptRes = await fetch("/api/accept-invite", {
                    method:  "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
                    body:    JSON.stringify({ token: dest.token }),
                  });
                  if (acceptRes.ok) {
                    const data = await acceptRes.json();
                    if (session.user && data.company_id) {
                      session.user.company_id   = data.company_id;
                      session.user.company_role = "member";
                      localStorage.setItem("prorated_session", JSON.stringify(session));
                    }
                    localStorage.removeItem("pending_invite_token");
                    go("dashboard");
                    return;
                  }
                } catch {}
                // Fallback: show InvitePage for manual accept if the call failed
                window.history.pushState({}, "", `/invite/${dest.token}`);
                go("invite"); return;
              }
              if (dest.type === "pending") { go("pending"); return; }
            } catch {}
          }
          go(user?.status === "approved" ? "home" : "pending");
        }} />}
        {page === "reset-password" && <ResetPasswordPage />}
        {page === "invite"          && <InvitePage go={go} goLogin={goLogin} />}
        {page === "company-setup"   && <CompanySetupPage go={go} goBack={goBack} />}
        {page === "realtor-signup" && <RealtorSignupPage go={go} />}
        {page === "realtor-home"     && <RealtorHomePage     go={go} user={user} />}
        {page === "verified-pro"     && <VerifiedProPage     go={go} />}
        {page === "homeowner-report" && <HomeownerReportPage go={go} />}
        {page === "agc"              && <AGCLandingPage          go={go} />}
        {/* Trade association partner pages */}
        {Object.keys(PARTNERS).map(pid => (
          page === `partner-${pid}` &&
          <PartnerLandingPage key={pid} go={go} partnerId={pid} />
        ))}
        {Object.keys(PARTNERS).map(pid => (
          page === `partner-dash-${pid}` &&
          <PartnerDashboardPage key={`dash-${pid}`} partnerId={pid} />
        ))}
        {page === "beta"      && <BetaLanding go={go} />}
        {page === "rejected"  && <VerificationRejected go={go} />}
        {page === "admin"     && <AdminGate     go={go} />}
      </main>

      {/* Footer — not shown on isolated pages */}
      {!isIsolated && (
      <footer style={{ borderTop: `1px solid ${BRAND.border}`, padding: "1.25rem 1rem", textAlign: "center", background: "#fff", paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Logo size={48} />
        </div>
        <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: "0.75rem", letterSpacing: "0.5px" }}>{TAGLINE}</div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 8 }}>
          {[
            { label: "Terms of Service", page: "terms"   },
            { label: "Privacy Policy",   page: "privacy" },
            { label: "Contact Us",       page: "contact" },
            { label: "Support",          page: "support" },
            { label: "Resources",        page: "resources" },
            { label: "Merch",            page: "merch", hideOnIOS: true },
            { label: "Blog",             page: "blog" },
            { label: "Our Mission",      page: "mission" },
          ].filter(item => !(item.hideOnIOS && isNativeIOS())).map(({ label, page: p }) => (
            <button key={label} onClick={() => go(p)}
              style={{ background: "none", border: "none", color: BRAND.gray, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: 0, textDecoration: "underline", textDecorationColor: BRAND.border }}>
              {label}
            </button>
          ))}
          {/* No account needed — property owners disputing a review can't log in */}
          <a href="mailto:disputes@prorated.app?subject=Content%20Report"
            style={{ color: BRAND.gray, fontSize: 11, fontFamily: "'DM Sans', sans-serif", textDecoration: "underline", textDecorationColor: BRAND.border }}>
            Dispute a Review
          </a>
        </div>
        <div style={{ marginBottom: 8 }}>
          <StoreBadges />
        </div>
        <p style={{ fontSize: 10, color: "#94A3B8", margin: "4px 0 0" }}>
          © 2026 ProRated · Built by Pros, Built for Pros · 🔒 We never sell your personal data
        </p>
      </footer>
      )}

      {/* Feedback button — not on isolated pages */}
      {!isIsolated && <FeedbackButton page={page} />}

      {/* Bottom nav — mobile only, not on isolated pages */}
      <style>{`@media(min-width:640px){ .mobile-bottom-nav { display: none !important; } }`}</style>
      {!isIsolated && (
      <div className="mobile-bottom-nav">
        <BottomNav page={page} go={go} />
      </div>
      )}
    </div>
  );
}
