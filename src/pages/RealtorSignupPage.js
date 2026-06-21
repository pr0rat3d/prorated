import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { dbGet } from "../api/db";
import { useState, useEffect } from "react";
import { BRAND } from "../components/UI";
import Logo from "../components/Logo";


const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

export default function RealtorSignupPage({ go }) {

  useEffect(() => {
    document.title = "ProRated for Realtors — Property Work History & Contractor Ratings";
    const desc = document.querySelector("meta[name='description']");
    if (desc) desc.setAttribute("content", "Search any property address and see verified trade professional ratings, work history, and payment scores. Built for real estate professionals in Alabama.");
    const og = document.querySelector("meta[property='og:title']");
    if (og) og.setAttribute("content", "ProRated for Realtors — Property Work History & Contractor Ratings");
    const ogDesc = document.querySelector("meta[property='og:description']");
    if (ogDesc) ogDesc.setAttribute("content", "Search any property address and see verified trade professional ratings, work history, and payment scores. Built for real estate professionals in Alabama.");
    return () => {
      document.title = "ProRated — Built by Pros, Built for Pros";
      if (desc) desc.setAttribute("content", "Contractor-to-contractor job site ratings. Know access, payment history, obstacles before you bid.");
    };
  }, []);

  const [form, setForm] = useState({ name: "", email: "", password: "", agency: "", license: "", state: "AL" });
  const [loginMode, setLoginMode]   = useState(false);

  // iOS install hint
  const [showIOSHint, setShowIOSHint] = useState(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    try { if (localStorage.getItem('pr_realtor_install_dismissed')) return false; } catch {}
    return ios && !standalone;
  });
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPwd, setLoginPwd]     = useState("");
  const [loginLoading, setLoginLoad] = useState(false);
  const [loginError, setLoginError]  = useState(null);
  const [loading, setLoading]        = useState(false);
  const [error, setError]     = useState(null);
  const [done, setDone]       = useState(false);
  const upd = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleLogin = async () => {
    setLoginLoad(true);
    setLoginError(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: loginEmail, password: loginPwd }),
      });
      const data = await res.json();
      if (data.error || !data.access_token) {
        // Surface exact Supabase error so we can debug
        const msg = data.error_description || data.error || "Login failed";
        if (msg.toLowerCase().includes("email") && msg.toLowerCase().includes("confirm")) {
          throw new Error("Please confirm your email address before logging in. Check your inbox for a confirmation link.");
        }
        if (msg.toLowerCase().includes("invalid")) {
          throw new Error("Invalid email or password. Please try again.");
        }
        throw new Error(msg);
      }
      // Store session and go to realtor home
      try {
        localStorage.setItem("pr_realtor_token", data.access_token);
        localStorage.setItem("pr_realtor_user", JSON.stringify(data.user));
      } catch {}
      go("realtor-home");
    } catch (err) {
      setLoginError(err.message || "Login failed. Please check your credentials.");
    }
    setLoginLoad(false);
  };

  const canSubmit = form.name && form.email && form.password.length >= 6 && form.state;

  const inp = { width: "100%", padding: "10px 12px", border: `1.5px solid ${BRAND.border}`, borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", color: BRAND.dark, background: "#F8FAFC" };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      // Create auth user
      const authRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const authData = await authRes.json();
      if (authData.error) throw new Error(authData.error.message || authData.msg);

      const userId = authData.user?.id;

      // Create realtor profile
      await fetch(`${SUPABASE_URL}/rest/v1/realtor_subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${authData.access_token}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          user_id:    userId,
          email:      form.email,
          full_name:  form.name,
          agency:     form.agency,
          license_num: form.license,
          state:      form.state,
          plan:       "free",
          status:     "active",
        }),
      });

      setDone(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div style={{ minHeight: "100vh", background: BRAND.dark, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <div>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🏡</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#F8FAFC", marginBottom: 10 }}>Welcome to ProRated!</h2>
        <p style={{ fontSize: 15, color: "#94A3B8", lineHeight: 1.7, maxWidth: 340, margin: "0 auto 24px" }}>
          Your realtor account is ready. Search any address to see contractor work history — completely free.
        </p>
        <button onClick={() => go("realtor-home")}
          style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "14px 32px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          Start searching addresses →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ background: BRAND.dark, padding: "1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <Logo size={44} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F8FAFC", marginBottom: 4 }}>ProRated for Realtors</h1>
        <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>Property work history · Read-only access · Free to start</p>
      </div>

      {/* Value props */}
      <div style={{ background: "#EFF6FF", padding: "1rem 1.5rem", display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
        {[
          { icon: "🔨", text: "See verified work history" },
          { icon: "⭐", text: "Contractor ratings per address" },
          { icon: "📋", text: "Disclosure-ready data" },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#1E40AF" }}>
            <span>{icon}</span><span>{text}</span>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "1.5rem 1.5rem 4rem" }}>

        {/* Pricing banner */}
        {/* Login / Signup toggle */}
        <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 12, padding: 4, marginBottom: "1.25rem" }}>
          <button onClick={() => setLoginMode(false)}
            style={{ flex: 1, padding: "9px", borderRadius: 9, border: "none", background: !loginMode ? "#fff" : "transparent", color: !loginMode ? BRAND.blue : BRAND.gray, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: !loginMode ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
            Create account
          </button>
          <button onClick={() => setLoginMode(true)}
            style={{ flex: 1, padding: "9px", borderRadius: 9, border: "none", background: loginMode ? "#fff" : "transparent", color: loginMode ? BRAND.blue : BRAND.gray, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: loginMode ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
            Sign in
          </button>
        </div>

        {/* Login form */}
        {loginMode && (
          <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: "1.5rem", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: BRAND.dark, marginTop: 0, marginBottom: "1.25rem" }}>Sign in to your realtor account</h3>
            <div style={{ marginBottom: "0.9rem" }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, display: "block", marginBottom: 5 }}>Email</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${BRAND.border}`, borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", color: BRAND.dark, background: "#F8FAFC" }} />
            </div>
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, display: "block", marginBottom: 5 }}>Password</label>
              <input type="password" value={loginPwd} onChange={e => setLoginPwd(e.target.value)}
                placeholder="Your password"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${BRAND.border}`, borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", color: BRAND.dark, background: "#F8FAFC" }} />
            </div>
            {loginError && (
              <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#991B1B", marginBottom: "1rem" }}>
                {loginError}
              </div>
            )}
            <button onClick={handleLogin} disabled={!loginEmail || !loginPwd || loginLoading}
              style={{ width: "100%", background: loginEmail && loginPwd ? BRAND.blue : "#E2E8F0", color: loginEmail && loginPwd ? "#fff" : BRAND.gray, border: "none", padding: "13px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loginEmail && loginPwd ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>
              {loginLoading ? "Signing in..." : "Sign in →"}
            </button>
          </div>
        )}

        {/* Signup form */}
        {!loginMode && (<>
        <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 12, padding: "12px 16px", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#166534" }}>Free tier included</div>
            <div style={{ fontSize: 11, color: "#166534" }}>5 address lookups/month · Upgrade for unlimited</div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#166534" }}>$0</div>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: "1.5rem" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: BRAND.dark, marginTop: 0, marginBottom: "1.25rem" }}>Create your realtor account</h3>

          {/* Name */}
          <div style={{ marginBottom: "0.9rem" }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, display: "block", marginBottom: 5 }}>Full name</label>
            <input type="text" value={form.name} onChange={upd("name")} placeholder="Jane Smith" style={inp} />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "0.9rem" }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, display: "block", marginBottom: 5 }}>Email address</label>
            <input type="email" value={form.email} onChange={upd("email")} placeholder="jane@realty.com" style={inp} />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "0.9rem" }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, display: "block", marginBottom: 5 }}>Password</label>
            <input type="password" value={form.password} onChange={upd("password")} placeholder="6+ characters" style={inp} />
          </div>

          {/* Agency */}
          <div style={{ marginBottom: "0.9rem" }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, display: "block", marginBottom: 5 }}>Agency / Brokerage <span style={{ color: BRAND.gray, fontWeight: 400 }}>(optional)</span></label>
            <input type="text" value={form.agency} onChange={upd("agency")} placeholder="e.g. RE/MAX, Keller Williams" style={inp} />
          </div>

          {/* State */}
          <div style={{ marginBottom: "0.9rem" }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, display: "block", marginBottom: 5 }}>State</label>
            <select value={form.state} onChange={upd("state")} style={{ ...inp, cursor: "pointer" }}>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Realtor license */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, display: "block", marginBottom: 5 }}>Realtor license # <span style={{ color: BRAND.gray, fontWeight: 400 }}>(optional)</span></label>
            <input type="text" value={form.license} onChange={upd("license")} placeholder="e.g. 12345" style={{ ...inp, fontFamily: "'DM Mono', monospace" }} />
          </div>

          {error && (
            <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#991B1B", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={!canSubmit || loading}
            style={{ width: "100%", background: canSubmit ? BRAND.blue : "#E2E8F0", color: canSubmit ? "#fff" : BRAND.gray, border: "none", padding: "13px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>
            {loading ? "Creating account..." : "Create free account →"}
          </button>

          <p style={{ fontSize: 11, color: BRAND.gray, textAlign: "center", marginTop: 12, marginBottom: 0 }}>
            Already have an account? <button onClick={() => go("signup")} style={{ background: "none", border: "none", color: BRAND.blue, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Sign in</button>
          </p>
        </div>

        <p style={{ fontSize: 11, color: BRAND.gray, textAlign: "center", marginTop: "0.75rem" }}>
          Already have a realtor account?{" "}
          <button onClick={() => go("signup")} style={{ background: "none", border: "none", color: BRAND.blue, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Sign in at prorated.app →
          </button>
        </p>
        </>)}

        <p style={{ fontSize: 11, color: BRAND.gray, textAlign: "center", marginTop: "0.75rem" }}>
          Trade professional?{" "}
          <button onClick={() => go("signup")} style={{ background: "none", border: "none", color: BRAND.blue, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Sign up at prorated.app →
          </button>
        </p>
      </div>
    </div>
  );
}
