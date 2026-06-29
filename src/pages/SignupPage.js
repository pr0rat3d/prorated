import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { useState } from "react";
import { TRADES, BRAND, COMPANY_TIERS, PROMO_CODES } from "../data/constants";
import { Btn, Card } from "../components/UI";
import Logo from "../components/Logo";
import { signUp, signIn } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import { useLang } from "../hooks/useLang";
import { t } from "../i18n/translations";
import { validateLicense, getLicensePlaceholder } from "../data/licenseValidation";
import { getLicenseRequirement } from "../data/constants";
import { isNativeIOS, IOS_SUBSCRIPTION_MSG } from "../utils/platform";



const ADMIN_EMAIL       = "pr0rat3d@gmail.com";

export default function SignupPage({ go, goBack, initialMode }) {
  const { lang } = useLang();
  const { login } = useAuth();
  const [mode, setMode]    = useState(initialMode || "signup");
  const [step, setStep]    = useState(1);
  const [loading, setLoad]   = useState(false);
  const [termsAgreed, setTerms]   = useState(false);
  const [promoCode, setPromoCode]   = useState("");
  const [promoValid, setPromoValid] = useState(false);

  const [resetMode, setReset]     = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent]  = useState(false);
  const [resetLoading, setResetLoad] = useState(false);
  const aSignInSub  = t(lang, "auth.signInSubtitle");
  const aSignUpSub  = t(lang, "auth.signUpSubtitle");
  const aSignUpFree = t(lang, "auth.signUpFree");
  const aTradeLic   = t(lang, "auth.tradeLicense");
  const aPrimTrade  = t(lang, "auth.primaryTrade");
  const aLicCorrect = t(lang, "auth.licenseCorrect");
  const aValidFmt   = t(lang, "auth.validFormats");
  const aCreating   = t(lang, "auth.creating");
  const aCreateBtn  = t(lang, "auth.createBtn");
  const aSigningIn  = t(lang, "auth.signingIn");
  const aLoginTab   = t(lang, "auth.loginTab");
  const aSignupTab  = t(lang, "auth.signupTab");
  const [error, setError]       = useState(null);
  const [licenseErr, setLicErr]   = useState(null);
  const [licOverride, setOverride] = useState(false);
  const [form, setForm] = useState(() => {
    let invEmail = "";
    try { invEmail = JSON.parse(localStorage.getItem("pending_invite_context") || "null")?.invitedEmail || ""; } catch {}
    return { name: "", email: invEmail, phone: "", password: "", trade: "", state: "", license: "", company_name: "" };
  });

  // Check for pending invite — skip plan step, inherit company plan
  const inviteContext = (() => {
    try { return JSON.parse(localStorage.getItem("pending_invite_context") || "null"); }
    catch { return null; }
  })();
  const isInviteSignup = !!inviteContext;

  const [accountType, setAccountType] = useState(isInviteSignup ? "solo" : null);
  const [selectedTier, setSelectedTier] = useState(isInviteSignup ? (inviteContext?.plan || "bronze") : null);
  const [signupPromo, setSignupPromo]   = useState("");
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoError, setPromoError]     = useState(null);

  const checkPromo = () => {
    const result = PROMO_CODES[signupPromo.toUpperCase()];
    if (result) {
      setPromoApplied(result);
      setPromoError(null);
    } else {
      setPromoApplied(null);
      setPromoError("Invalid promo code");
    }
  };

  const handleReset = async () => {
    if (!resetEmail) return;
    setResetLoad(true);
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({
          email:       resetEmail,
          redirect_to: window.location.origin + "/",
        }),
      });
      setResetSent(true);
    } catch {}
    setResetLoad(false);
  };

  const licReq  = getLicenseRequirement(form.trade); // eslint-disable-line no-unused-vars
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp = { width: "100%", padding: "11px 13px", border: `1.5px solid ${BRAND.border}`, borderRadius: 10, fontSize: 14, background: "#F8FAFC", color: BRAND.dark, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", marginBottom: 10 };

  const STRIPE_LINKS = {
    bronze: "https://buy.stripe.com/4gMfZg9mL8TM9HI9szeQM00",
    silver: "https://buy.stripe.com/eVqcN4buT0ng6vw48feQM01",
    gold:   "https://buy.stripe.com/dRmeVc56v6LE3jk34beQM02",
  };

  const handleSignup = async () => {
    setLoad(true); setError(null);
    try {
      if (!isInviteSignup) {
        const licResult = validateLicense(form.license, form.state);
        if (!licResult.valid && !licOverride) {
          setLicErr(licResult);
          setLoad(false);
          return;
        }
      }

      const data = await signUp({
        email:        form.email,
        password:     form.password,
        name:         form.name,
        company_name: form.company_name || null,
        trade:        form.trade,
        state:        form.state,
        license:      form.license,
        accountType:  accountType || "solo",
        plan:         selectedTier || "free",
        promoCode:    promoApplied ? signupPromo.toUpperCase() : null,
        status:       isInviteSignup ? "approved" : "pending",
      });

      if (data.user) {
        login({
          ...data.user,
          name:         form.name,
          company_name: form.company_name || null,
          trade:        form.trade,
          state:        form.state,
          license:      form.license,
          plan:         selectedTier || "free",
          account_type: accountType || "solo",
          status:       isInviteSignup ? "approved" : "pending",
        });

        // Notify admin of new pending signup (non-invite only)
        if (!isInviteSignup) {
          fetch(`${SUPABASE_URL}/functions/v1/send-approval-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
            body: JSON.stringify({
              type:        "admin_notify",
              userName:    form.name,
              userEmail:   form.email,
              userTrade:   form.trade,
              userState:   form.state,
              userLicense: form.license,
            }),
          }).catch(() => {});
        }

        // Check for pending invite
        const pendingInvite = localStorage.getItem("pending_invite_token");

        // Always show NDA first
        if (isInviteSignup && pendingInvite) {
          // Invite member — skip Stripe, go back to invite page after NDA
          localStorage.setItem("post_nda_destination", JSON.stringify({
            type:  "invite",
            token: pendingInvite,
          }));
          localStorage.removeItem("pending_invite_context");
        } else if (selectedTier && STRIPE_LINKS[selectedTier]) {
          const params = new URLSearchParams({ prefilled_email: form.email });
          if (promoApplied) params.set("promo", signupPromo.toUpperCase());
          localStorage.setItem("post_nda_destination", JSON.stringify({
            type: "stripe",
            url: `${STRIPE_LINKS[selectedTier]}?${params}`,
            pendingInvite: pendingInvite || null,
          }));
        } else if (pendingInvite) {
          // After NDA, go back to invite page to complete linking
          localStorage.setItem("post_nda_destination", JSON.stringify({
            type: "invite",
            token: pendingInvite,
          }));
        } else {
          localStorage.setItem("post_nda_destination", JSON.stringify({ type: "pending" }));
        }
        go("nda");
      }
    } catch (err) { setError(err.message); }
    finally { setLoad(false); }
  };

  const handleLogin = async () => {
    setLoad(true); setError(null);
    try {
      const data = await signIn({ email: form.email, password: form.password });
      if (data.user) {
        // signIn() fetches the full contractor profile and saves to localStorage
        // Read it back so we get name, plan, status, license etc — not just auth fields
        const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
        login(session.user || data.user);
        // Resume pending invite if one exists
        const pendingInvite = localStorage.getItem("pending_invite_token");
        if (pendingInvite) {
          window.history.pushState({}, "", `/invite/${pendingInvite}`);
          go("invite");
        } else {
          go("home");
        }
      }
    } catch (err) { setError(err.message.includes("Invalid") ? "Incorrect email or password." : err.message); }
    finally { setLoad(false); }
  };

  return (
    <div style={{ maxWidth: 440, margin: "2rem auto", padding: "0 1.5rem" }}>

      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><Logo size={64} /></div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: BRAND.dark, marginBottom: 4 }}>
          {mode === "login" ? "Welcome back" : isInviteSignup ? `Join ${inviteContext.companyName || "your team"}` : "Join ProRated"}
        </h1>
        {isInviteSignup && mode === "signup" && (
          <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "8px 14px", marginTop: 8, fontSize: 12, color: "#1E40AF", fontWeight: 600 }}>
            🏗️ You've been invited — create your free account to join
          </div>
        )}
        <p style={{ fontSize: 13, color: BRAND.gray }}>{mode === "login" ? aSignInSub : aSignUpSub}</p>

      </div>

      {/* Mode toggle */}
      <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 12, padding: 4, marginBottom: "1.5rem" }}>
        {[["signup", aSignupTab],["login", aLoginTab]].map(([m, label]) => (
          <button key={m} onClick={() => { setMode(m); setStep(1); setError(null); setForm({ name: "", email: inviteContext?.invitedEmail || "", phone: "", password: "", trade: "", state: "", license: "", company_name: "" }); setReset(false); setResetSent(false); }}
            style={{ flex: 1, padding: "8px", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s", background: mode === m ? "#fff" : "transparent", color: mode === m ? BRAND.blue : BRAND.gray, boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
            {label}
          </button>
        ))}
      </div>

      {error && <div style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {/* Login */}
      {mode === "login" && !resetMode && (
        <Card style={{ animation: "fadeUp 0.2s ease both" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: "1rem" }}>Sign in</div>
          <input type="email" placeholder="Email address" value={form.email} onChange={upd("email")} autoComplete="username" style={inp} />
          <input type="password" placeholder="Password" autoComplete="current-password" value={form.password} onChange={upd("password")} style={{ ...inp, marginBottom: 0 }} />
          <div style={{ marginTop: "1rem" }}>
            <Btn fullWidth onClick={handleLogin} disabled={!form.email || !form.password || loading}>{loading ? aSigningIn : "Sign in →"}</Btn>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <p style={{ fontSize: 11, color: BRAND.gray, margin: 0 }}>
              No account?{" "}
              <button onClick={() => setMode("signup")} style={{ background: "none", border: "none", color: BRAND.blue, fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{aSignUpFree}</button>
            </p>
            <button onClick={() => { setReset(true); setError(null); }} style={{ background: "none", border: "none", color: BRAND.gray, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textDecoration: "underline" }}>Forgot password?</button>
          </div>
        </Card>
      )}

      {mode === "login" && resetMode && (
        <Card style={{ animation: "fadeUp 0.2s ease both" }}>
          {resetSent ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📧</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.dark, marginBottom: 8 }}>Check your email</div>
              <div style={{ fontSize: 13, color: BRAND.gray, lineHeight: 1.6, marginBottom: 20 }}>
                We sent a reset link to <strong>{resetEmail}</strong>. Follow the link to set a new password.
              </div>
              <Btn fullWidth onClick={() => { setReset(false); setResetSent(false); setResetEmail(""); }}>← Back to sign in</Btn>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.dark, marginBottom: 4 }}>Reset your password</div>
                <div style={{ fontSize: 12, color: BRAND.gray }}>Enter your email and we'll send you a reset link.</div>
              </div>
              {error && <div style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", fontSize: 12, marginBottom: 12 }}>{error}</div>}
              <input type="email" placeholder="Email address" value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleReset()}
                autoComplete="email"
                style={{ width: "100%", padding: "11px 13px", border: `1.5px solid ${BRAND.border}`, borderRadius: 10, fontSize: 14, background: "#F8FAFC", color: BRAND.dark, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", marginBottom: 12 }} />
              <Btn fullWidth onClick={handleReset} disabled={!resetEmail || resetLoading}>
                {resetLoading ? "Sending..." : "Send reset link →"}
              </Btn>
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <button onClick={() => { setReset(false); setError(null); }}
                  style={{ background: "none", border: "none", color: BRAND.blue, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  ← Back to sign in
                </button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Signup */}
      {mode === "signup" && (
        <>
          <div style={{ display: "flex", gap: 5, marginBottom: "1.5rem" }}>
            {[1,2,...(isInviteSignup ? [] : [3])].map(n => <div key={n} style={{ flex: 1, height: 4, borderRadius: 4, background: step >= n ? BRAND.blue : BRAND.border, transition: "background 0.3s" }} />)}
          </div>

          {step === 1 && (
            <Card style={{ animation: "fadeUp 0.25s ease both" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: "1rem" }}>Basic info</div>
              <input type="text"  placeholder="Full name"     value={form.name}         onChange={upd("name")}         style={inp} />
              <input type="text"  placeholder={isInviteSignup ? "Company name (optional)" : "Company name"} value={form.company_name} onChange={upd("company_name")} style={inp} />
              <input type="email" placeholder="Email address"  value={form.email}        onChange={upd("email")}
                readOnly={isInviteSignup && !!inviteContext?.invitedEmail}
                style={{ ...inp, ...(isInviteSignup && inviteContext?.invitedEmail ? { background: "#F1F5F9", color: BRAND.gray, cursor: "not-allowed" } : {}) }} />
              <input type="tel"      placeholder="Phone (optional)"  value={form.phone}    onChange={upd("phone")}    style={inp} />
              <input type="password" placeholder="Create a password (6+ chars)" autoComplete="new-password" value={form.password} onChange={upd("password")} style={{ ...inp, marginBottom: 0 }} />
              <div style={{ marginTop: "1rem" }}>
                <Btn fullWidth onClick={() => setStep(2)} disabled={!form.name || (!isInviteSignup && !form.company_name) || !form.email || form.password.length < 6}>Continue →</Btn>
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card style={{ animation: "fadeUp 0.25s ease both" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: "1rem" }}>{aTradeLic}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: BRAND.gray, marginBottom: 8 }}>{aPrimTrade}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 14 }}>
                {TRADES.map(t => (
                  <button key={t.id} onClick={() => setForm(f => ({ ...f, trade: t.id }))}
                    style={{ padding: "8px 3px", border: "1.5px solid", borderColor: form.trade === t.id ? BRAND.blue : BRAND.border, background: form.trade === t.id ? BRAND.blue : "#F8FAFC", color: form.trade === t.id ? "#fff" : BRAND.dark, borderRadius: 10, cursor: "pointer", textAlign: "center", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{t.icon}</div>
                    <div style={{ fontSize: 9, fontWeight: 700 }}>{t.label}</div>
                  </button>
                ))}
              </div>
              <select value={form.state} onChange={upd("state")}
                style={{ ...inp, color: form.state ? BRAND.dark : "#94A3B8", appearance: "none", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32 }}>
                <option value="">State / Territory</option>
                {["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC","PR","VI","GU"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                placeholder={isInviteSignup ? "License # (optional)" : (licReq.example || getLicensePlaceholder(form.state))}
                value={form.license}
                onChange={e => { upd("license")(e); setLicErr(null); setOverride(false); }}
                onBlur={() => { if (!isInviteSignup && form.license && form.state) { const r = validateLicense(form.license, form.state); if (!r.valid) setLicErr(r); } }}
                style={{ ...inp, fontFamily: "'DM Mono', monospace", borderColor: licenseErr && !licOverride ? "#FCA5A5" : undefined }}
              />
              {form.trade && licReq.hint && (
                <div style={{ fontSize: 10, color: BRAND.gray, marginTop: 3, marginBottom: 4 }}>
                  ℹ️ {licReq.hint}
                </div>
              )}

              {licenseErr && !licOverride && (
                <div style={{ background: licenseErr.warning ? "#FEF9C3" : "#FEE2E2", border: `1px solid ${licenseErr.warning ? "#FDE047" : "#FCA5A5"}`, borderRadius: 8, padding: "8px 12px", marginTop: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: licenseErr.warning ? "#854D0E" : "#991B1B", marginBottom: licenseErr.examples ? 4 : 0 }}>
                    {licenseErr.warning ? "⚠️" : "❌"} {licenseErr.error}
                  </div>

                  {licenseErr.warning && (
                    <button type="button" onClick={() => setOverride(true)}
                      style={{ background: "none", border: "1px solid #D97706", color: "#92400E", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                      {aLicCorrect}
                    </button>
                  )}
                </div>
              )}
              {licOverride && (
                <div style={{ fontSize: 10, color: "#16A34A", fontWeight: 600, marginTop: 3 }}>✓ License accepted — admin will verify manually</div>
              )}
              <div style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 9, padding: "8px 12px", marginBottom: 14, fontSize: 11, color: BRAND.gray }}>
                🔒 License used for verification only — never shown publicly.
              </div>

              {/* Terms & Privacy Agreement */}
              <div onClick={() => setTerms(t => !t)}
                style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", background: termsAgreed ? "#F0FDF4" : "#F8FAFC", border: `1.5px solid ${termsAgreed ? "#86EFAC" : BRAND.border}`, borderRadius: 10, marginBottom: 14, cursor: "pointer" }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${termsAgreed ? "#16A34A" : "#CBD5E1"}`, background: termsAgreed ? "#16A34A" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  {termsAgreed && <span style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}>✓</span>}
                </div>
                <div style={{ fontSize: 11, color: BRAND.gray, lineHeight: 1.6 }}>
                  I agree to the{" "}
                  <span onClick={e => { e.stopPropagation(); window.open("/terms", "_blank"); }}
                    style={{ color: BRAND.blue, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
                    Terms of Service
                  </span>
                  {" "}and{" "}
                  <span onClick={e => { e.stopPropagation(); window.open("/privacy", "_blank"); }}
                    style={{ color: BRAND.blue, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
                    Privacy Policy
                  </span>
                  . I confirm I am a licensed trade professional and my submitted reviews will be honest and accurate.
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="secondary" onClick={() => setStep(1)}>← Back</Btn>
                <Btn fullWidth onClick={() => { if (!form.trade || (!isInviteSignup && !form.license) || !form.state || !termsAgreed) { setError("Please complete all fields and agree to the terms."); return; } setError(null); if (isInviteSignup) { handleSignup(); } else { setStep(3); } }} disabled={!form.trade || (!isInviteSignup && !form.license) || !form.state || !termsAgreed}>
                  Continue →
                </Btn>
              </div>
            </Card>
          )}
          {step === 3 && (
            <Card style={{ animation: "fadeUp 0.25s ease both" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 4 }}>How are you using ProRated?</div>
              <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: 16 }}>Choose free to get started, or activate a paid plan now.</div>

              {/* Free option */}
              <div onClick={() => { setAccountType("solo"); setSelectedTier(null); }}
                style={{ border: `1.5px solid ${accountType === "solo" && !selectedTier ? BRAND.blue : BRAND.border}`, background: accountType === "solo" && !selectedTier ? "#EFF6FF" : "#F8FAFC", borderRadius: 12, padding: "12px 14px", marginBottom: 8, cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>🆓</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>Start free</div>
                    <div style={{ fontSize: 11, color: BRAND.gray }}>Limited searches · Single login · No credit card</div>
                  </div>
                  {accountType === "solo" && !selectedTier && <span style={{ marginLeft: "auto", color: BRAND.blue, fontWeight: 700 }}>✓</span>}
                </div>
              </div>

              {/* Paid tiers — hidden on iOS (Apple IAP policy) */}
              {isNativeIOS() ? (
                <div style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 10, padding: "10px 14px", marginTop: 8, fontSize: 12, color: BRAND.gray, lineHeight: 1.6, textAlign: "center" }}>
                  {IOS_SUBSCRIPTION_MSG}
                </div>
              ) : (
              <>
              <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.gray, textTransform: "uppercase", letterSpacing: "0.08em", margin: "12px 0 8px" }}>Paid plans — activate now</div>
              {Object.entries(COMPANY_TIERS).map(([id, tier]) => (
                <div key={id}
                  onClick={() => { setSelectedTier(id); setAccountType(id === "bronze" ? "solo" : "company"); }}
                  style={{ border: `1.5px solid ${selectedTier === id ? BRAND.blue : BRAND.border}`, background: selectedTier === id ? "#EFF6FF" : "#F8FAFC", borderRadius: 12, padding: "12px 14px", marginBottom: 8, cursor: "pointer", transition: "all 0.15s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{tier.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>{tier.name}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: BRAND.dark }}>{tier.price ? `$${tier.price}` : "Custom"}<span style={{ fontSize: 10, fontWeight: 400, color: BRAND.gray }}>{tier.price ? "/mo" : " pricing"}</span></div>
                      </div>
                      <div style={{ fontSize: 11, color: BRAND.gray }}>
                        {id === "bronze" ? "Solo pro or team of 1–5" :
                       id === "platinum" ? "40+ team members — contact us for pricing" :
                       `Up to ${tier.seatLimit} team logins`}
                      </div>
                    </div>
                    {selectedTier === id && <span style={{ color: BRAND.blue, fontWeight: 700, flexShrink: 0 }}>✓</span>}
                  </div>
                  {/* Bronze account type toggle */}
                  {selectedTier === "platinum" && id === "platinum" && (
                    <div style={{ marginTop: 10, borderTop: `1px solid ${BRAND.border}`, paddingTop: 10 }}>
                      <a href="mailto:hello@prorated.app?subject=Platinum%20Plan%20Inquiry"
                        style={{ display: "block", textAlign: "center", fontSize: 12, color: BRAND.blue, fontWeight: 700, textDecoration: "none" }}>
                        📧 We'll reach out to set up custom pricing →
                      </a>
                    </div>
                  )}
                  {selectedTier === "bronze" && id === "bronze" && (
                    <div style={{ marginTop: 10, borderTop: `1px solid ${BRAND.border}`, paddingTop: 10, display: "flex", gap: 8 }}>
                      {[["solo","👤 Just me"],["company","🏗️ My company (1–5)"]].map(([type, label]) => (
                        <button key={type} onClick={e => { e.stopPropagation(); setAccountType(type); }}
                          style={{ flex: 1, padding: "8px", border: `1.5px solid ${accountType === type ? BRAND.blue : BRAND.border}`, background: accountType === type ? BRAND.blue : "#fff", color: accountType === type ? "#fff" : BRAND.dark, borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Promo code note */}
              {selectedTier && (
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "10px 14px", marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: "#1E40AF", lineHeight: 1.6 }}>
                    🏷️ <strong>Have a promo code?</strong> Enter it on the next screen in Stripe checkout.
                  </div>
                </div>
              )}
              </>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <Btn variant="secondary" onClick={() => setStep(2)}>← Back</Btn>
                <Btn fullWidth
                  onClick={handleSignup}
                  disabled={(!accountType && !selectedTier) || (selectedTier === "bronze" && !accountType) || loading}>
                  {loading ? aCreating : selectedTier ? "Create account →" : "Create free account →"}
                </Btn>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
