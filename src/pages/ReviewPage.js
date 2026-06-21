import { GOOGLE_MAPS_KEY, SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { useState, useEffect, useRef, useCallback } from "react";
import { Stars, Btn, Card, BRAND } from "../components/UI";
import { TRADES, RATING_CATEGORIES, WORK_CATEGORIES } from "../data/constants";
import { getTagsForTrade } from "../data/tradeTags";
import { useAuth } from "../hooks/useAuth";
import { saveReview, updateReview } from "../api/supabase";
import { notifyAddressWatchers } from "../api/pushService";
import AddressInput from "../components/AddressInput";
import { useLang } from "../hooks/useLang";
import { t } from "../i18n/translations";

const STEPS = ["Address & trade", "Ratings", "Details"];

const MILESTONES = [0, 24, 49, 99, 249, 499, 999];

const getReviewCount = () => {
  try { return parseInt(localStorage.getItem("pr_review_count") || "0"); } catch { return 0; }
};

const isMilestone = (count) => MILESTONES.includes(count);

const getMilestoneMessage = (count) => {
  if (count === 0)   return null;
  if (count === 24)  return "🎉 Congratulations on your 25th review!";
  if (count === 49)  return "🏆 Congratulations on your 50th review!";
  if (count === 99)  return "🌟 Congratulations on your 100th review!";
  if (count === 249) return "🔥 Congratulations on your 250th review!";
  if (count === 499) return "💎 Congratulations on your 500th review!";
  if (count === 999) return "🚀 Congratulations on your 1,000th review!";
  return null;
};

export default function ReviewPage({ go, goBack, initialAddress, editReviewId }) {
  const { user, isLoggedIn } = useAuth();
  // Always scroll to top on mount
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  const { lang } = useLang();
  const [step, setStep]                     = useState(1); // Always start at step 1
  const [tooltip, setTooltip]               = useState(null);
  const tooltipTimer                         = useRef(null);
  const isEditMode = !!editReviewId;

  const showTooltip = useCallback((e, tag) => {
    if (!tag.desc) return;
    e.stopPropagation();
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    setTooltip({ id: tag.id, text: tag.desc });
    tooltipTimer.current = setTimeout(() => setTooltip(null), 4500);
  }, []);

  const hideTooltip = useCallback(() => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    setTooltip(null);
  }, []);
  const [showDisclaimer, setShowDisclaimer] = useState(() => isMilestone(getReviewCount()));
  const [milestoneMsg, setMilestoneMsg]     = useState(() => getMilestoneMessage(getReviewCount()));
  const [submitting, setSubmit]             = useState(false);
  const [done, setDone]                     = useState(false);

  const toTitleCase = (str) => str ? str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) : str;

  const [form, setForm] = useState({
    address: initialAddress ? toTitleCase(initialAddress) : "", trade: user?.trade || "", propertyType: "", overall: 0,
    ratings: { access: 0, payment: 0, timeline: 0, communication: 0, obstacles: 0 },
    tags: [], text: "", workCategory: "", workItem: "", would_return: null,
  });

  // If in edit mode, fetch the existing review and pre-fill the form
  useEffect(() => {
    if (!editReviewId) return;
    const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
    const token   = session.access_token;
    fetch(`${SUPABASE_URL}/rest/v1/reviews?id=eq.${editReviewId}&select=*&limit=1`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(rows => {
        const r = rows?.[0];
        if (!r) return;
        setForm({
          address:      toTitleCase(r.address || initialAddress || ""),
          trade:        r.trade || user?.trade || "",
          propertyType: r.property_type || "",
          overall:      r.overall_score || 0,
          ratings: {
            access:        r.access_score || 0,
            payment:       r.payment_score || 0,
            timeline:      r.timeline_score || 0,
            communication: r.communication_score || 0,
            obstacles:     r.obstacles_score || 0,
          },
          tags:        r.tags || [],
          text:        r.review_text || "",
          workCategory: r.work_category || "",
          workItem:     r.work_item || "",
          would_return: r.would_return ?? null,
        });
      })
      .catch(() => {});
  }, [editReviewId]);

  const setRating = (cat, val) => setForm(f => ({ ...f, ratings: { ...f.ratings, [cat]: val } }));
  const toggleTag = (id) => setForm(f => ({
    ...f, tags: f.tags.includes(id) ? f.tags.filter(t => t !== id) : [...f.tags, id].slice(0, 8)
  }));

  const ok1 = form.address.trim().length > 5 && form.trade && form.workItem;
  const ok2 = form.overall > 0;
  const availableTags = getTagsForTrade(form.trade || user?.trade || "general");

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      go("signup");
      return;
    }
    if (user?.status === "pending") {
      alert("Your license is still being verified. You can submit reviews once approved.");
      return;
    }
    if (user?.status === "rejected") {
      alert("Your account verification was unsuccessful. Please contact hello@prorated.app.");
      return;
    }
    setSubmit(true);
    try {
      const cleanAddress = toTitleCase(form.address);

      if (isEditMode) {
        // Edit mode — patch existing review, don't create new
        await updateReview(editReviewId, {
          overall: form.overall,
          ratings: form.ratings,
          tags: form.tags,
          text: form.text,
          workCategory: form.workCategory,
          workItem: form.workItem,
          workLabel: WORK_CATEGORIES.find(c => c.id === form.workCategory)?.items.find(i => i.id === form.workItem)?.label || "",
        });
        setDone(true);
        return;
      }

      const initials = (user?.name || "C").slice(0,1).toUpperCase() + (form.trade || "R").slice(-1).toUpperCase();
      await saveReview({
        userId:           user?.id,
        address:          cleanAddress,
        property_type:    form.propertyType || null,
        street:           cleanAddress.split(",")[0].trim(),
        trade:            form.trade,
        contractor_name:  user?.name || "Anonymous",
        contractor_initials: initials,
        license_number:   user?.license || "",
        overall_score:    form.overall,
        access:           form.ratings.access,
        payment:          form.ratings.payment,
        timeline:         form.ratings.timeline,
        communication:    form.ratings.communication,
        obstacles:        form.ratings.obstacles,
        tags:             form.tags,
        work_category:    form.workCategory,
        work_item:        form.workItem,
        work_label:       WORK_CATEGORIES.find(c => c.id === form.workCategory)?.items.find(i => i.id === form.workItem)?.label || "",
        review_text:      form.text,
        helpful_count:    0,
        would_return:     form.would_return,
      });
      notifyAddressWatchers(cleanAddress, { trade: form.trade, score: form.overall }).catch(() => {});
      try {
        const count = parseInt(localStorage.getItem("pr_review_count") || "0");
        localStorage.setItem("pr_review_count", String(count + 1));
      } catch {}
      setDone(true);
    } catch (err) {
      console.error("[ReviewPage] Submit failed:", err?.message);
      const msg = err?.message?.includes("JWT") || err?.message?.includes("auth")
        ? "Session expired — please sign out and sign back in, then try again."
        : err?.message?.includes("column") || err?.message?.includes("schema")
        ? "Database error — please contact hello@prorated.app: " + err.message
        : err?.message?.includes("timeout") || err?.message?.includes("timed out")
        ? "Request timed out — check your connection and try again."
        : err?.message
        ? "Could not submit: " + err.message
        : "Could not submit review. Please try again.";
      alert(msg);
    } finally {
      setSubmit(false);
    }
  };

  const reset = () => {
    setDone(false); setStep(1);
    setForm({ address: "", trade: user?.trade || "", overall: 0, ratings: { access: 0, payment: 0, timeline: 0, communication: 0, obstacles: 0 }, tags: [], text: "", would_return: null });
    try {
      const count = getReviewCount();
      const show = isMilestone(count);
      setShowDisclaimer(show);
      setMilestoneMsg(getMilestoneMessage(count));
    } catch { setShowDisclaimer(true); setMilestoneMsg(null); }
  };

  const inp = { width: "100%", padding: "10px 12px", border: `1.5px solid ${BRAND.border}`, borderRadius: 10, fontSize: 13, background: "#F8FAFC", color: BRAND.dark, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" };

  // ── Gate screen strings (used in conditional returns) ───────
  /* eslint-disable no-unused-vars */
  const gLoginTitle = t(lang, "reviewGate.loginTitle");
  const gLoginBody  = t(lang, "reviewGate.loginBody");
  const gCreateBtn  = t(lang, "reviewGate.createBtn");
  const gSignInBtn  = t(lang, "reviewGate.signInBtn");
  const gPendTitle  = t(lang, "reviewGate.pendingTitle");
  const gPendBody   = t(lang, "reviewGate.pendingBody");
  const gPendWhat   = t(lang, "reviewGate.pendingWhat");
  const gPendBtn    = t(lang, "reviewGate.pendingBtn");
  const gRejTitle   = t(lang, "reviewGate.rejectedTitle");
  const gRejBody    = t(lang, "reviewGate.rejectedBody");
  const gRejBtn     = t(lang, "reviewGate.rejectedBtn");
  /* eslint-enable no-unused-vars */

  // ── Translated disclaimer strings ────────────────────────────
  const dTitle    = t(lang, "disclaimer.title");
  const dBody1    = t(lang, "disclaimer.body1");
  const dBody2    = t(lang, "disclaimer.body2");
  const dRule1    = t(lang, "disclaimer.rule1");
  const dRule2    = t(lang, "disclaimer.rule2");
  const dRule3    = t(lang, "disclaimer.rule3");
  const dRule4    = t(lang, "disclaimer.rule4");
  const dContinue = t(lang, "disclaimer.continue");
  const dCancel   = t(lang, "disclaimer.cancel");
  const dReminder = t(lang, "disclaimer.reminder");

  // ── Auth gates — check BEFORE showing disclaimer ────────────
  if (!isLoggedIn) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <div>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🔐</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: BRAND.dark, marginBottom: 10 }}>{gLoginTitle}</h2>
        <p style={{ fontSize: 14, color: BRAND.gray, lineHeight: 1.65, marginBottom: 24, maxWidth: 320, margin: "0 auto 24px" }}>
          {gLoginBody}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn onClick={() => go("signup")}>{gCreateBtn}</Btn>
          <Btn variant="secondary" onClick={() => go("signup")}>{gSignInBtn}</Btn>
        </div>
      </div>
    </div>
  );

  if (user?.status === "pending") return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <div>
        <div style={{ fontSize: 52, marginBottom: 16 }}>⏳</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: BRAND.dark, marginBottom: 10 }}>{gPendTitle}</h2>
        <p style={{ fontSize: 14, color: BRAND.gray, lineHeight: 1.65, maxWidth: 340, margin: "0 auto 20px" }}>
          {gPendBody}
        </p>
        <Btn variant="secondary" onClick={() => go("home")}>{gPendBtn}</Btn>
      </div>
    </div>
  );

  if (user?.status === "rejected") return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <div>
        <div style={{ fontSize: 52, marginBottom: 16 }}>❌</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: BRAND.dark, marginBottom: 10 }}>{gRejTitle}</h2>
        <p style={{ fontSize: 14, color: BRAND.gray, lineHeight: 1.65, maxWidth: 340, margin: "0 auto 20px" }}>
          Your application was not approved. Please contact support if you believe this is an error.
        </p>
        <Btn variant="secondary" onClick={() => go("home")}>Return Home</Btn>
      </div>
    </div>
  );

  // ── Disclaimer — only shown to logged-in approved users ──────
  if (showDisclaimer) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "2rem", maxWidth: 440, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", animation: "fadeUp 0.3s ease both" }}>
        <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{milestoneMsg ? milestoneMsg.split(" ")[0] : "📋"}</div>
          {milestoneMsg ? (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: BRAND.dark, marginBottom: 6 }}>
                {milestoneMsg.slice(2)}
              </h2>
              <p style={{ fontSize: 13, color: BRAND.gray, marginBottom: 0 }}>{dReminder}</p>
            </>
          ) : (
            <h2 style={{ fontSize: 20, fontWeight: 800, color: BRAND.dark, marginBottom: 8 }}>{dTitle}</h2>
          )}
        </div>
        <div style={{ background: milestoneMsg ? "#F0FDF4" : "#F8FAFC", border: `1px solid ${milestoneMsg ? "#86EFAC" : BRAND.border}`, borderRadius: 14, padding: "1.1rem 1.25rem", marginBottom: "1.25rem" }}>
          <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.75, margin: 0 }}>
            {dBody1}
          </p>
          <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.75, margin: "10px 0 0" }}>
            <strong>{dBody2}</strong>
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1.1rem" }}>
          {[dRule1, dRule2, dRule3, dRule4].map(item => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#166534" }}>
              <span style={{ color: "#16A34A", fontWeight: 700, flexShrink: 0 }}>✓</span> {item}
            </div>
          ))}
        </div>
        <button onClick={() => setShowDisclaimer(false)}
          style={{ width: "100%", background: BRAND.blue, color: "#fff", border: "none", padding: "13px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>
          {dContinue}
        </button>
        <button onClick={() => go("home")}
          style={{ width: "100%", background: "transparent", color: BRAND.gray, border: `1px solid ${BRAND.border}`, padding: "10px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          {dCancel}
        </button>
      </div>
    </div>
  );

  if (false && user?.status === "pending_dupe_removed") return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <div>
        <div style={{ fontSize: 52, marginBottom: 16 }}>⏳</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: BRAND.dark, marginBottom: 10 }}>{gPendTitle}</h2>
        <p style={{ fontSize: 14, color: BRAND.gray, lineHeight: 1.65, maxWidth: 340, margin: "0 auto 20px" }}>
          {gPendBody}
        </p>
        <div style={{ background: "#FEF9C3", border: "1px solid #FDE047", borderRadius: 12, padding: "12px 16px", maxWidth: 340, margin: "0 auto 20px", textAlign: "left" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#854D0E", marginBottom: 4 }}>{gPendWhat}</div>
          {["✓ Search any job site address", "✓ View contractor ratings", "✓ Save addresses to your watchlist", "✓ Browse Local Points of Interest"].map(item => (
            <div key={item} style={{ fontSize: 12, color: "#92400E", lineHeight: 2 }}>{item}</div>
          ))}
        </div>
        <Btn variant="secondary" onClick={() => go("home")}>{gPendBtn}</Btn>
      </div>
    </div>
  );

  if (!showDisclaimer && user?.status === "rejected") return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <div>
        <div style={{ fontSize: 52, marginBottom: 16 }}>❌</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: BRAND.dark, marginBottom: 10 }}>{gRejTitle}</h2>
        <p style={{ fontSize: 14, color: BRAND.gray, lineHeight: 1.65, maxWidth: 320, margin: "0 auto 24px" }}>
          {gRejBody}
        </p>
        <a href="mailto:hello@prorated.app?subject=Verification Appeal"
          style={{ background: BRAND.blue, color: "#fff", textDecoration: "none", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700 }}>
          Contact us →
        </a>
      </div>
    </div>
  );

  // ── Success ──────────────────────────────────────────────────
  if (done) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <div>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: BRAND.dark, marginBottom: 10 }}>Review submitted!</h2>
        <p style={{ fontSize: 14, color: BRAND.gray, lineHeight: 1.65, marginBottom: 24 }}>
          Thanks for helping the next contractor bid smarter. Your review is now live.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn onClick={reset}>Leave another review</Btn>
          <Btn variant="secondary" onClick={() => go("home")}>Search addresses →</Btn>
        </div>
      </div>
    </div>
  );

  // ── Step header ──────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "1rem 1.25rem 6rem" }}>

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: "1.5rem" }}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const done_s = step > n;
          return (
            <div key={n} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: done_s ? BRAND.green : active ? BRAND.blue : "#E2E8F0", color: done_s || active ? "#fff" : BRAND.gray, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {done_s ? "✓" : n}
                </div>
                <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? BRAND.dark : BRAND.gray, display: "none" }}
                  className="step-label">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: step > n ? BRAND.green : "#E2E8F0", margin: "0 6px" }} />
              )}
            </div>
          );
        })}
        <span style={{ fontSize: 12, color: BRAND.gray, marginLeft: 10, flexShrink: 0 }}>Step {step} of {STEPS.length}</span>
      </div>

      <h1 style={{ fontSize: 23, fontWeight: 800, color: BRAND.dark, marginBottom: 4 }}>{isEditMode ? "Edit your review" : "Rate a job site"}</h1>
      <p style={{ fontSize: 13, color: BRAND.gray, marginBottom: "1.35rem" }}>Help the next trade professional know what they're walking into before they bid.</p>

      {/* Step 1 */}
      {step === 1 && (
        <div style={{ animation: "fadeUp 0.25s ease both" }}>
          <Card style={{ marginBottom: "0.85rem" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 3 }}>Job site address</div>
            <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: "0.5rem" }}>Enter the full address of the job site you worked</div>
            <div style={{ border: `1.5px solid ${BRAND.border}`, borderRadius: 10, background: "#F8FAFC", padding: "2px 12px" }}>
              <AddressInput
                value={form.address}
                onChange={val => setForm(f => ({ ...f, address: val }))}
                onSelect={val => setForm(f => ({ ...f, address: val }))}
                placeholder="123 Main St, City, State ZIP"
                inputStyle={{ fontSize: 13, padding: "8px 0", background: "transparent" }}
              />
            </div>
          </Card>

          {/* Property Type */}
          <Card style={{ marginBottom: "1.35rem" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 3 }}>Property type</div>
            <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: 10 }}>Help other trade professionals understand who they're dealing with. Select your best guess — you can skip if unsure.</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { id: "homestead",  label: "🏠 Primary Home",     sub: "Owner-occupied" },
                { id: "secondary",  label: "🌴 Secondary / Vacation", sub: "Part-time owner" },
                { id: "rental",     label: "🔑 Rental Property",  sub: "Tenant-occupied" },
              ].map(opt => (
                <button key={opt.id}
                  onClick={() => setForm(f => ({ ...f, propertyType: f.propertyType === opt.id ? "" : opt.id }))}
                  style={{
                    flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif", textAlign: "center",
                    border: `1.5px solid ${form.propertyType === opt.id ? BRAND.blue : BRAND.border}`,
                    background: form.propertyType === opt.id ? "#EFF6FF" : "#F8FAFC",
                  }}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{opt.label.split(" ")[0]}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: form.propertyType === opt.id ? BRAND.blue : BRAND.dark, lineHeight: 1.3 }}>{opt.label.split(" ").slice(1).join(" ")}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card style={{ marginBottom: "1.35rem" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 3 }}>Your trade</div>
            {user?.trade && user.trade !== "general" ? (
              <>
                {/* Auto-selected based on account — show highlighted with option to change */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10, padding: "10px 14px", marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{TRADES.find(t => t.id === form.trade)?.icon || TRADES.find(t => t.id === user.trade)?.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>{TRADES.find(t => t.id === form.trade)?.label || TRADES.find(t => t.id === user.trade)?.label}</div>
                    <div style={{ fontSize: 10, color: "#16A34A" }}>✓ Matched to your account trade</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: BRAND.gray, marginBottom: 8 }}>Performed a different trade on this job? Select below:</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                  {TRADES.filter(tr => !["pest_control", "landscaping"].includes(tr.id) || tr.id === user.trade).map(tr => (
                    <button key={tr.id} onClick={() => setForm(f => ({ ...f, trade: tr.id, workItem: "" }))}
                      style={{ padding: "8px 4px", borderRadius: 10, border: `1.5px solid ${form.trade === tr.id ? BRAND.blue : BRAND.border}`, background: form.trade === tr.id ? "#EFF6FF" : "#F8FAFC", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, opacity: form.trade === tr.id ? 1 : 0.65 }}>
                      <span style={{ fontSize: 18 }}>{tr.icon}</span>
                      <span style={{ fontSize: 8, fontWeight: 700, color: form.trade === tr.id ? BRAND.blue : BRAND.gray, textAlign: "center", lineHeight: 1.2 }}>{tr.label}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: "0.75rem" }}>What trade did you perform at this job site?</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                  {TRADES.map(tr => (
                    <button key={tr.id} onClick={() => setForm(f => ({ ...f, trade: tr.id, workItem: "" }))}
                      style={{ padding: "10px 6px", borderRadius: 10, border: `1.5px solid ${form.trade === tr.id ? BRAND.blue : BRAND.border}`, background: form.trade === tr.id ? "#EFF6FF" : "#F8FAFC", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 20 }}>{tr.icon}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: form.trade === tr.id ? BRAND.blue : BRAND.gray, textAlign: "center" }}>{tr.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Street View preview */}
          {form.address && form.address.length > 8 && (
            <div style={{ marginBottom: "1rem", borderRadius: 12, overflow: "hidden", border: `1px solid ${BRAND.border}` }}>
              <img
                src={`https://maps.googleapis.com/maps/api/streetview?size=600x200&location=${encodeURIComponent(form.address)}&key=${GOOGLE_MAPS_KEY || import.meta.env.VITE_GOOGLE_MAPS_KEY}&return_error_code=true`}
                alt="Property street view"
                style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
                onError={e => { e.target.parentElement.style.display = "none"; }}
              />
              <div style={{ background: "#F8FAFC", padding: "6px 10px", fontSize: 10, color: BRAND.gray }}>
                📍 Confirm this is the correct property before continuing
              </div>
            </div>
          )}

          {/* Work performed */}
          {form.trade && (
            <Card style={{ marginBottom: "1.35rem" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 3 }}>Work performed <span style={{ color: "#EF4444", fontSize: 12 }}>*</span></div>
              <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: "0.75rem" }}>What type of work did you do at this job site?</div>

              {/* Category tabs */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "0.75rem" }}>
                {/* Work category — show trade-matched one first */}
                {(() => {
                  const tradeToCategory = {
                    general: "general", roofing: "roofing", painting: "painting",
                    plumbing: "plumbing", hvac: "hvac", electrical: "electrical",
                    flooring: "flooring", windows: "windows", foundation: "foundation",
                    siding: "siding", insulation: "insulation", pest_control: "pest_control",
                    landscaping: "landscaping", concrete: "concrete", garage_door: "garage_door",
                    pool_service: "pool_service", fencing: "fencing",
                  };
                  const defaultCat = tradeToCategory[form.trade] || null;
                  // Auto-select if not already set
                  if (defaultCat && !form.workCategory) {
                    setTimeout(() => setForm(f => f.workCategory ? f : ({ ...f, workCategory: defaultCat })), 0);
                  }
                  // Show matching category first, then rest
                  const sorted = defaultCat
                    ? [WORK_CATEGORIES.find(c => c.id === defaultCat), ...WORK_CATEGORIES.filter(c => c.id !== defaultCat)].filter(Boolean)
                    : WORK_CATEGORIES;
                  return sorted.map(cat => (
                  <button key={cat.id} onClick={() => setForm(f => ({ ...f, workCategory: cat.id, workItem: "" }))}
                    style={{ padding: "5px 10px", borderRadius: 8, border: `1.5px solid ${form.workCategory === cat.id ? BRAND.blue : BRAND.border}`, background: form.workCategory === cat.id ? "#EFF6FF" : "#F8FAFC", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: form.workCategory === cat.id ? BRAND.blue : BRAND.dark }}>
                    {cat.icon} {cat.label}
                  </button>
                  ));
                })()}
              </div>

              {/* Work items for selected category */}
              {form.workCategory && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {WORK_CATEGORIES.find(c => c.id === form.workCategory)?.items.map(item => (
                    <button key={item.id} onClick={() => setForm(f => ({ ...f, workItem: item.id }))}
                      style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${form.workItem === item.id ? BRAND.green : BRAND.border}`, background: form.workItem === item.id ? "#F0FDF4" : "#F8FAFC", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: form.workItem === item.id ? 700 : 500, color: form.workItem === item.id ? "#166534" : BRAND.dark, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                      {form.workItem === item.id ? "✓" : "○"} {item.label}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}

          <Btn onClick={() => setStep(2)} disabled={!ok1 || !form.workItem} style={{ width: "100%" }}>
            Continue to ratings →
          </Btn>
        </div>
      )}

      {/* Step 1b — Work performed (shown in step 1 below trade) */}

      {/* Step 2 */}
      {step === 2 && (
        <div style={{ animation: "fadeUp 0.25s ease both" }}>
          <Card style={{ marginBottom: "0.85rem" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 3 }}>Overall rating</div>
            <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: "0.65rem" }}>How would you rate this job site overall?</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Stars score={form.overall} size={28} interactive onChange={v => setForm(f => ({ ...f, overall: v }))} />
              {form.overall > 0 && <span style={{ fontSize: 13, color: BRAND.gray, fontWeight: 600 }}>{["","Avoid","Below average","Average","Good","Excellent"][form.overall]}</span>}
            </div>
          </Card>

          <Card style={{ marginBottom: "1.35rem" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: "0.85rem" }}>Rate each factor</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 9 }}>
              {RATING_CATEGORIES.map(cat => (
                <div key={cat.id} style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 10, padding: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark }}>{cat.icon} {cat.label}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: form.ratings[cat.id] > 0 ? BRAND.blue : BRAND.gray, fontFamily: "'DM Mono', monospace" }}>
                      {form.ratings[cat.id] > 0 ? `${form.ratings[cat.id]}/5` : "—"}
                    </span>
                  </div>
                  <Stars score={form.ratings[cat.id]} size={18} interactive onChange={v => setRating(cat.id, v)} />
                </div>
              ))}
            </div>
          </Card>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <Btn variant="secondary" onClick={() => setStep(1)}>← Back</Btn>
            <Btn onClick={() => setStep(3)} disabled={!ok2}>Continue →</Btn>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div style={{ animation: "fadeUp 0.25s ease both" }} onClick={hideTooltip}>



          {/* Would you return toggle */}
          <Card style={{ marginBottom: "0.85rem" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 3 }}>Would you work this job site again?</div>
            <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: "0.75rem" }}>Your honest take helps other contractors make better decisions</div>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { val: true,  label: "👍  Yes, I'd return",     activeColor: BRAND.green, activeBg: "#F0FDF4", activeBorder: BRAND.green },
                { val: false, label: "👎  No, I wouldn't",      activeColor: "#DC2626",   activeBg: "#FEF2F2", activeBorder: "#DC2626"  },
              ].map(({ val, label, activeColor, activeBg, activeBorder }) => {
                const active = form.would_return === val;
                return (
                  <button key={String(val)} onClick={() => setForm(f => ({ ...f, would_return: f.would_return === val ? null : val }))}
                    style={{ flex: 1, padding: "10px 8px", borderRadius: 10, border: `1.5px solid ${active ? activeBorder : BRAND.border}`, background: active ? activeBg : "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", color: active ? activeColor : BRAND.gray, fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Grouped tag sections */}
          <Card style={{ marginBottom: "0.85rem" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 2 }}>
              Job site tags <span style={{ color: BRAND.gray, fontWeight: 400 }}>(optional, up to 8)</span>
            </div>
            <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: "0.85rem" }}>
              Select all that apply — {8 - form.tags.length} remaining
            </div>

            {[
              { label: "✅ Positive",  severity: "good", headerColor: BRAND.green,  headerBg: "#F0FDF4" },
              { label: "⚠️ Heads Up",  severity: "warn", headerColor: "#D97706",    headerBg: "#FFFBEB" },
              { label: "🚩 Concerns",  severity: "bad",  headerColor: "#DC2626",    headerBg: "#FEF2F2" },
            ].map(({ label, severity, headerColor, headerBg }) => {
              const groupTags = availableTags.filter(t => t.severity === severity || (severity === "bad" && (t.severity === "alert" || t.severity === "bad")));
              if (!groupTags.length) return null;
              return (
                <div key={severity} style={{ marginBottom: "0.85rem" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: headerColor, background: headerBg, padding: "3px 8px", borderRadius: 6, display: "inline-block", marginBottom: 8 }}>
                    {label}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {groupTags.map(tag => {
                      const selected = form.tags.includes(tag.id);
                      const atLimit = form.tags.length >= 8 && !selected;
                      return (
                        <button key={tag.id} onClick={() => !atLimit && toggleTag(tag.id)}
                          title={tag.desc || undefined}
                          style={{ padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${selected ? headerColor : BRAND.border}`, background: selected ? headerBg : "#fff", fontSize: 11, fontWeight: 600, cursor: atLimit ? "not-allowed" : "pointer", color: selected ? headerColor : atLimit ? "#CBD5E1" : BRAND.dark, fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s", opacity: atLimit ? 0.5 : 1 }}>
                          <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 3 }}>
                          {tag.icon} {tag.label}
                          {tag.desc && (
                            <span
                              onClickCapture={e => showTooltip(e, tag)}
                              onTouchEnd={e => { e.preventDefault(); showTooltip(e, tag); }}
                              style={{ fontSize: 9, opacity: 0.55, marginLeft: 2, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
                            >ⓘ</span>
                          )}
                          {tooltip?.id === tag.id && (
                            <span style={{
                              position:    "absolute",
                              bottom:      "calc(100% + 8px)",
                              left:        "50%",
                              transform:   "translateX(-50%)",
                              width:       220,
                              background:  "#1E293B",
                              color:       "#F1F5F9",
                              fontSize:    11,
                              lineHeight:  1.5,
                              padding:     "8px 12px",
                              borderRadius: 8,
                              boxShadow:   "0 4px 16px rgba(0,0,0,0.3)",
                              zIndex:      9999,
                              whiteSpace:  "normal",
                              pointerEvents: "none",
                              textAlign:   "left",
                              fontWeight:  400,
                            }}>
                              {tooltip.text}
                              <span style={{
                                position:    "absolute",
                                top:         "100%",
                                left:        "50%",
                                transform:   "translateX(-50%)",
                                width:       0, height: 0,
                                borderLeft:  "5px solid transparent",
                                borderRight: "5px solid transparent",
                                borderTop:   "5px solid #1E293B",
                              }} />
                            </span>
                          )}
                        </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </Card>

          <Card style={{ marginBottom: "1.35rem" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 3 }}>Write your review <span style={{ color: BRAND.gray, fontWeight: 400 }}>(optional)</span></div>
            <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: "0.65rem" }}>Describe the job site in your own words — the more specific the better</div>
            <textarea
              value={form.text}
              onChange={e => setForm(f => ({ ...f, text: e.target.value.slice(0, 500) }))}
              placeholder="e.g. Steep driveway made staging a challenge. Homeowner was great to work with and paid on the same day we finished."
              rows={4}
              style={{ ...inp, resize: "none", lineHeight: 1.6 }}
            />
            <div style={{ fontSize: 10, color: BRAND.gray, textAlign: "right", marginTop: 3 }}>{form.text.length}/500</div>
          </Card>

          {/* Summary */}
          <Card style={{ marginBottom: "1.35rem", background: "#F0FDF4", border: `1px solid #86EFAC` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: "0.65rem" }}>Review summary</div>
            {[
              ["📍 Address", form.address],
              ["🏠 Property Type", form.propertyType ? { homestead: "Primary Home", secondary: "Secondary / Vacation", rental: "Rental Property" }[form.propertyType] : "Not specified"],
              ["🔨 Trade", TRADES.find(t => t.id === form.trade)?.label],
              ["⭐ Overall", `${form.overall}/5`],
              ["🏷 Tags", form.tags.length > 0 ? `${form.tags.length} selected` : "None"],
              ["🔁 Would Return", form.would_return === true ? "Yes 👍" : form.would_return === false ? "No 👎" : "Not answered"],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", color: "#166534" }}>
                <span>{label}</span>
                <span style={{ fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </Card>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <Btn variant="secondary" onClick={() => setStep(2)}>← Back</Btn>
            <Btn onClick={handleSubmit} disabled={!ok1 || !ok2 || submitting}>
              {submitting ? "Saving..." : isEditMode ? "Save changes ✓" : "Submit review ✓"}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
