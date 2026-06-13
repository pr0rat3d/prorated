import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { useState } from "react";
import { BRAND } from "../components/UI";
import Logo from "../components/Logo";
import AddressInput from "../components/AddressInput";



const REPORT_PRICE      = 9.99;
const STRIPE_LINK       = "https://buy.stripe.com/test_homeowner_report"; // replace with real link

export default function HomeownerReportPage({ go }) {
  const [address, setAddress]   = useState("");
  const [step, setStep]         = useState(1); // 1=search, 2=preview, 3=payment
  const [loading, setLoading]   = useState(false);
  const [preview, setPreview]   = useState(null);
  const [email, setEmail]       = useState("");

  const checkAddress = async () => {
    if (!address.trim() || address.length < 5) return;
    setLoading(true);
    try {
      const street = address.split(",")[0].trim().toLowerCase();
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/reviews?street=ilike.*${encodeURIComponent(street)}*&select=overall_score,work_label,trade,created_at&order=created_at.desc`,
        { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setPreview({ address, hasData: true });
      } else {
        setPreview({ address, reviewCount: 0, hasData: false });
      }
      setStep(2);
    } catch {}
    setLoading(false);
  };

  const handlePay = () => {
    // Pass address and email as URL params to Stripe
    const params = new URLSearchParams({
      prefilled_email: email,
      client_reference_id: encodeURIComponent(address),
    });
    window.location.href = `${STRIPE_LINK}?${params.toString()}`;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ background: BRAND.dark, padding: "1.25rem 1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <Logo size={40} />
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: "#F8FAFC", marginBottom: 4 }}>Property Report</h1>
        <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>Contractor-verified work history for any address</p>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "1.5rem 1.25rem 4rem" }}>

        {step === 1 && (
          <>
            {/* Value props */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: "1.5rem" }}>
              {[
                { icon: "🔨", title: "Work History", desc: "What work was done" },
                { icon: "⭐", title: "Ratings", desc: "How contractors rated it" },
                { icon: "📅", title: "Timeline", desc: "When work was performed" },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: "0.85rem", textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 10, color: BRAND.gray }}>{desc}</div>
                </div>
              ))}
            </div>

            {/* Search */}
            <div style={{ background: "#fff", border: `1.5px solid ${BRAND.border}`, borderRadius: 14, padding: "1.25rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.dark, marginBottom: 10 }}>
                🔍 Enter your property address
              </div>
              <div style={{ border: `1.5px solid ${BRAND.border}`, borderRadius: 10, padding: "4px 12px", marginBottom: 12, background: "#F8FAFC" }}>
                <AddressInput
                  value={address}
                  onChange={setAddress}
                  onSelect={(val) => { setAddress(val); }}
                  placeholder="123 Main St, Birmingham, AL..."
                  inputStyle={{ fontSize: 13, padding: "8px 0" }}
                />
              </div>
              <button onClick={checkAddress} disabled={!address || loading}
                style={{ width: "100%", background: address ? BRAND.blue : "#E2E8F0", color: address ? "#fff" : BRAND.gray, border: "none", padding: "13px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: address ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>
                {loading ? "Checking..." : "Check this address →"}
              </button>
            </div>

            {/* Price callout */}
            <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>Full report</div>
                <div style={{ fontSize: 11, color: "#166534" }}>One-time purchase · No account needed</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#166534" }}>${REPORT_PRICE}</div>
            </div>
          </>
        )}

        {step === 2 && preview && (
          <>
            <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: BRAND.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: "1rem", padding: 0 }}>
              ← Search again
            </button>

            {/* Address header */}
            <div style={{ background: BRAND.dark, borderRadius: 14, padding: "1.25rem", marginBottom: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Property Report</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#F8FAFC", marginBottom: preview.hasData ? 8 : 0 }}>{preview.address}</div>
              {preview.hasData && (
                <div style={{ fontSize: 32, fontWeight: 900, color: parseFloat(preview.avgScore) >= 4 ? "#4ADE80" : parseFloat(preview.avgScore) >= 3 ? "#60A5FA" : "#F87171" }}>
                  {preview.avgScore} ⭐
                </div>
              )}
            </div>

            {!preview.hasData ? (
              <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "2rem", textAlign: "center", marginBottom: "1rem" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.dark, marginBottom: 8 }}>No records found yet</div>
                <div style={{ fontSize: 13, color: BRAND.gray, lineHeight: 1.65 }}>
                  No contractor reviews have been submitted for this address yet. Check back as our platform grows — new reviews are added daily.
                </div>
              </div>
            ) : (
              <>
                {/* Blurred preview */}
                <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1.25rem", marginBottom: "1rem", position: "relative", overflow: "hidden" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: BRAND.dark, marginBottom: 10 }}>
                    📊 Report Preview — {preview.reviewCount} contractor record{preview.reviewCount !== 1 ? "s" : ""} found
                  </div>

                  {/* Visible teaser */}
                  <div style={{ marginBottom: 10 }}>
                    {preview.workTypes.slice(0, 2).map(wt => (
                      <div key={wt} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#F8FAFC", borderRadius: 8, marginBottom: 6, border: `1px solid ${BRAND.border}` }}>
                        <span style={{ fontSize: 11, background: "#F0FDF4", color: "#166534", fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>✓</span>
                        <span style={{ fontSize: 13, color: BRAND.dark }}>{wt}</span>
                      </div>
                    ))}
                  </div>

                  {/* Blurred remaining content */}
                  {preview.reviewCount > 1 && (
                    <div style={{ position: "relative" }}>
                      <div style={{ filter: "blur(5px)", pointerEvents: "none", opacity: 0.7 }}>
                        {preview.workTypes.slice(2).map(wt => (
                          <div key={wt} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#F8FAFC", borderRadius: 8, marginBottom: 6, border: `1px solid ${BRAND.border}` }}>
                            <span style={{ fontSize: 11, background: "#F0FDF4", color: "#166534", fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>✓</span>
                            <span style={{ fontSize: 13, color: BRAND.dark }}>Work detail hidden</span>
                          </div>
                        ))}
                        <div style={{ padding: "8px 12px", background: "#EFF6FF", borderRadius: 8, marginBottom: 6 }}>
                          <div style={{ height: 12, background: "#BFDBFE", borderRadius: 4, width: "70%" }} />
                        </div>
                        <div style={{ padding: "8px 12px", background: "#EFF6FF", borderRadius: 8 }}>
                          <div style={{ height: 12, background: "#BFDBFE", borderRadius: 4, width: "50%" }} />
                        </div>
                      </div>
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 700, color: BRAND.blue, border: `1px solid ${BRAND.border}` }}>
                          🔒 Unlock full report for ${REPORT_PRICE}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment */}
                <div style={{ background: "#fff", border: `1.5px solid ${BRAND.border}`, borderRadius: 14, padding: "1.25rem" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.dark, marginBottom: 12 }}>
                    Get the full report — ${REPORT_PRICE}
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: BRAND.dark, display: "block", marginBottom: 6 }}>
                      Email for delivery
                    </label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${BRAND.border}`, borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", color: BRAND.dark }} />
                  </div>

                  {/* What you get */}
                  <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "0.75rem", marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.dark, marginBottom: 6 }}>Full report includes:</div>
                    {[
                      "Complete work history with dates",
                      "All contractor ratings (access, payment, timeline, communication)",
                      "Work type detail for each job",
                      "Overall property rating",
                      "Contractor count and frequency",
                    ].map(item => (
                      <div key={item} style={{ fontSize: 11, color: "#475569", marginBottom: 3 }}>✓ {item}</div>
                    ))}
                  </div>

                  <button onClick={handlePay} disabled={!email}
                    style={{ width: "100%", background: email ? BRAND.blue : "#E2E8F0", color: email ? "#fff" : BRAND.gray, border: "none", padding: "14px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: email ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>
                    Pay ${REPORT_PRICE} & Unlock Report →
                  </button>

                  <p style={{ fontSize: 10, color: BRAND.gray, textAlign: "center", marginTop: 8, marginBottom: 0 }}>
                    Secured by Stripe · One-time purchase · No account needed
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
