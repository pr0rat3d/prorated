import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { useState } from "react";
import { TRADES, BRAND } from "../data/constants";
import { Btn, Card } from "../components/UI";
import Logo from "../components/Logo";
import { signUp, signIn } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import { useLang } from "../hooks/useLang";
import { t } from "../i18n/translations";
import { validateLicense, getLicensePlaceholder } from "../data/licenseValidation";
import { getLicenseRequirement } from "../data/constants";



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
  const VALID_PROMOS = ["AGC2026", "BETA2026"];
  const [resetMode, setReset]     = useState(false);
  const referredBy = new URLSearchParams(window.location.search).get('ref');
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
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    trade: "", state: "", license: "",
  });

  const handleReset = async () => {
    if (!resetEmail) return;
    setResetLoad(true);
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: resetEmail }),
      });
      setResetSent(true);
    } catch {}
    setResetLoad(false);
  };

  const licReq  = getLicenseRequirement(form.trade); // eslint-disable-line no-unused-vars
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp = { width: "100%", padding: "11px 13px", border: `1.5px solid ${BRAND.border}`, borderRadius: 10, fontSize: 14, background: "#F8FAFC", color: BRAND.dark, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", marginBottom: 10 };

  const handleSignup = async () => {
    if (!termsAgreed) { setError(t(lang, "auth.termsRequired") || "Please agree to the Terms of Service to continue."); return; }
    setLoad(true); setError(null);
    try {
      // Validate license format
      const licResult = validateLicense(form.license, form.state);
      if (!licResult.valid && !licOverride) {
        setLicErr(licResult);
        setLoad(false);
        return;
      }

      const data = await signUp({ email: form.email, password: form.password, name: form.name, trade: form.trade, state: form.state, license: form.license });
      if (data.user) { login({ ...data.user, name: form.name, trade: form.trade, status: "pending" }); go("pending"); }
    } catch (err) { setError(err.message); }
    finally { setLoad(false); }
  };

  const handleLogin = async () => {
    setLoad(true); setError(null);
    try {
      const data = await signIn({ email: form.email, password: form.password });
      if (data.user) { login(data.user); go("home"); }
    } catch (err) { setError(err.message.includes("Invalid") ? "Incorrect email or password." : err.message); }
    finally { setLoad(false); }
  };

  return (
    <div style={{ maxWidth: 440, margin: "2rem auto", padding: "0 1.5rem" }}>

      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><Logo size={64} /></div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: BRAND.dark, marginBottom: 4 }}>{mode === "login" ? "Welcome back" : "Join ProRated"}</h1>
        <p style={{ fontSize: 13, color: BRAND.gray }}>{mode === "login" ? aSignInSub : aSignUpSub}</p>
        {referredBy && mode === "signup" && (
          <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10, padding: "8px 14px", marginTop: 8, fontSize: 12, color: "#166534", fontWeight: 600 }}>
            🎉 You were referred! Submit 3 reviews to unlock 30 days Pro free.
          </div>
        )}
      </div>

      {/* Mode toggle */}
      <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 12, padding: 4, marginBottom: "1.5rem" }}>
        {[["signup", aSignupTab],["login", aLoginTab]].map(([m, label]) => (
          <button key={m} onClick={() => { setMode(m); setStep(1); setError(null); }}
            style={{ flex: 1, padding: "8px", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s", background: mode === m ? "#fff" : "transparent", color: mode === m ? BRAND.blue : BRAND.gray, boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
            {label}
          </button>
        ))}
      </div>

      {error && <div style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {/* Login */}
      {mode === "login" && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: "1rem" }}>Sign in</div>
          <input type="email"    placeholder="Email address" value={form.email}    onChange={upd("email")}    style={inp} />
          <input type="password" placeholder="Password"      value={form.password} onChange={upd("password")} style={{ ...inp, marginBottom: 0 }} />
          <div style={{ marginTop: "1rem" }}>
            <Btn fullWidth onClick={handleLogin} disabled={!form.email || !form.password || loading}>{loading ? aSigningIn : "Sign in →"}</Btn>
          </div>
          <p style={{ fontSize: 11, color: BRAND.gray, textAlign: "center", marginTop: 12 }}>
            No account?{" "}
            <button onClick={() => setMode("signup")} style={{ background: "none", border: "none", color: BRAND.blue, fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{aSignUpFree}</button>
          </p>
          <div style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 10, padding: "10px 14px", marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.gray, marginBottom: 4 }}>🎯 Demo credentials</div>
            <div style={{ fontSize: 11, color: BRAND.gray, fontFamily: "'DM Mono', monospace" }}>
              Contact hello@prorated.app for a demo account
            </div>
            <button onClick={() => {}}  style={{ display: "none" }}
              style={{ background: "none", border: "none", color: BRAND.blue, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>
              Auto-fill →
            </button>
          </div>
        </Card>
      )}

      {/* Signup */}
      {mode === "signup" && (
        <>
          <div style={{ display: "flex", gap: 5, marginBottom: "1.5rem" }}>
            {[1,2].map(n => <div key={n} style={{ flex: 1, height: 4, borderRadius: 4, background: step >= n ? BRAND.blue : BRAND.border, transition: "background 0.3s" }} />)}
          </div>

          {step === 1 && (
            <Card style={{ animation: "fadeUp 0.25s ease both" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: "1rem" }}>Basic info</div>
              <input type="text"     placeholder="Full name"         value={form.name}     onChange={upd("name")}     style={inp} />
              <input type="email"    placeholder="Email address"     value={form.email}    onChange={upd("email")}    style={inp} />
              <input type="tel"      placeholder="Phone (optional)"  value={form.phone}    onChange={upd("phone")}    style={inp} />
              <input type="password" placeholder="Create a password (6+ chars)" value={form.password} onChange={upd("password")} style={{ ...inp, marginBottom: 0 }} />
              <div style={{ marginTop: "1rem" }}>
                <Btn fullWidth onClick={() => setStep(2)} disabled={!form.name || !form.email || form.password.length < 6}>Continue →</Btn>
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
              <input placeholder="State (e.g. AL)"      value={form.state}   onChange={upd("state")}   style={inp} />
              <input
                placeholder={licReq.example || getLicensePlaceholder(form.state)}
                value={form.license}
                onChange={e => { upd("license")(e); setLicErr(null); setOverride(false); }}
                onBlur={() => { if (form.license && form.state) { const r = validateLicense(form.license, form.state); if (!r.valid) setLicErr(r); } }}
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
                  {licenseErr.examples && (
                    <div style={{ fontSize: 10, color: "#64748B", marginBottom: licenseErr.warning ? 6 : 0 }}>
                      {aValidFmt} {licenseErr.examples.join(", ")}
                    </div>
                  )}
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
                <Btn fullWidth onClick={handleSignup} disabled={!form.trade || !form.license || !form.state || !termsAgreed || loading}>
                  {loading ? aCreating : aCreateBtn}
                </Btn>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
