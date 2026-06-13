import { useState, useEffect } from "react";
import { BRAND } from "../components/UI";
import { useLang } from "../hooks/useLang";
import Logo from "../components/Logo";

const SECTIONS = [
  {
    id: "getting-started",
    icon: "🚀",
    title: "Getting Started",
    color: "#EFF6FF",
    border: "#BFDBFE",
    accent: "#1E40AF",
    articles: [
      {
        q: "What is ProRated?",
        a: "ProRated is a job site intelligence platform built for licensed trade professionals. Before you bid on a residential project, search the address and see verified ratings from other trade professionals who have worked that exact site — payment history, access conditions, homeowner communication scores, and work history.",
      },
      {
        q: "Who can use ProRated?",
        a: "ProRated is for licensed trade professionals only — general contractors, electricians, plumbers, HVAC technicians, roofers, painters, flooring installers, pest control, landscapers, and concrete/masonry contractors. All accounts require license verification before access is granted.",
      },
      {
        q: "How do I create an account?",
        a: "Go to prorated.app and tap 'Sign Up'. Enter your name, email, trade, state, and license number. Once submitted, our team typically verifies your license within 24 hours. You'll receive an email once approved.",
      },
      {
        q: "Is ProRated free?",
        a: "Yes — you can earn free Pro access by leaving reviews. Submit 3 reviews and unlock 30 days of Pro access free. You can also subscribe for $9.99/month or $99.99/year for unlimited access.",
      },
      {
        q: "What states does ProRated cover?",
        a: "ProRated is currently in active beta in Alabama. We're expanding to Tennessee, Georgia, Mississippi, and Florida in 2026, followed by a full Southeast rollout. Sign up now to be first when we reach your state.",
      },
    ],
  },
  {
    id: "searching",
    icon: "🔍",
    title: "Searching Addresses",
    color: "#F0FDF4",
    border: "#86EFAC",
    accent: "#166534",
    articles: [
      {
        q: "How do I search a job site address?",
        a: "From the home screen, type any residential address in the search bar. Use the autocomplete suggestions to select the exact address. Once you hit Search, you'll see all contractor reviews, ratings, and work history for that property.",
      },
      {
        q: "What if there are no reviews for an address?",
        a: "If no one has reviewed that address yet, you'll see an empty result with an option to leave the first review. Addresses with no reviews are common for new listings or less-trafficked neighborhoods. Be the first — it helps everyone.",
      },
      {
        q: "Why do I need to be logged in to search?",
        a: "Search is gated to verified trade professionals only. This keeps the data trustworthy and ensures homeowners cannot look up their own addresses or game the system. Create a free account to get access.",
      },
      {
        q: "How is the overall rating calculated?",
        a: "The overall score is a weighted average of all contractor reviews for that address. More recent reviews carry more weight than older ones — a review from 6 months ago counts more than one from 3 years ago. This helps reflect the current homeowner's actual behavior.",
      },
      {
        q: "What does the ownership change warning mean?",
        a: "If multiple contractors have flagged that the homeowner may have moved, or if all reviews are more than 18 months old, ProRated shows a warning banner. This is a reminder that older reviews may reflect a previous owner — always verify before committing.",
      },
    ],
  },
  {
    id: "reviews",
    icon: "⭐",
    title: "Leaving Reviews",
    color: "#FFFBEB",
    border: "#FCD34D",
    accent: "#92400E",
    articles: [
      {
        q: "How do I leave a review?",
        a: "Tap the '⭐ Rate' button in the bottom nav or tap 'Rate This Job Site' on any address card. You'll be asked to select a work category, rate all 5 categories (access, payment, communication, timeline, obstacles), set an overall score, and optionally add notes.",
      },
      {
        q: "What are the 5 rating categories?",
        a: "Access & Parking — driveway space, equipment clearance, staging area.\n\nPayment Reliability — paid on time, no disputes or delays.\n\nTimeline Respect — start dates honored, decisions made promptly.\n\nCommunication — responsive, clear instructions, respectful.\n\nObstacles — unexpected issues, scope changes, access problems.",
      },
      {
        q: "Can I edit a review after submitting?",
        a: "Yes. Go to Dashboard → My Reviews and tap the ✏️ Edit button on any of your reviews. You can update all 5 ratings and your review notes. Edits are saved immediately.",
      },
      {
        q: "How many reviews can I leave per address?",
        a: "You can leave one review per address per 30 days. This prevents spamming and keeps the data honest. If you worked the same address multiple times within 30 days, update your existing review.",
      },
      {
        q: "Will the homeowner see my review?",
        a: "No. Homeowners cannot access ProRated. Reviews are only visible to verified licensed trade professionals. The homeowner's name is never attached to any review — only their property address.",
      },
      {
        q: "What if I made a mistake in my review?",
        a: "Tap ✏️ Edit in Dashboard → My Reviews to correct it. If you need help removing a review entirely, email hello@prorated.app with the address and reason.",
      },
    ],
  },
  {
    id: "account",
    icon: "👤",
    title: "Your Account",
    color: "#FAF5FF",
    border: "#D8B4FE",
    accent: "#6B21A8",
    articles: [
      {
        q: "How does license verification work?",
        a: "After signup, our team manually checks your contractor license number against your state's licensing database. Tier 1 trades (GC, Electrical, Plumbing, HVAC, Roofing) require a state contractor license. Tier 2 trades (Painting, Flooring, Pest Control, Landscaping, Concrete) require a business license. Verification typically takes less than 24 hours.",
      },
      {
        q: "What is the Trust Score?",
        a: "Your Trust Score is a 0–100 rating that reflects your credibility on the platform. It grows through reviews submitted, helpful votes from peers, account age, and verified licensing. Reach 75+ to earn Verified Pro status and a listing in the Pro Directory.",
      },
      {
        q: "What is a Verified Pro?",
        a: "Verified Pro is the highest trust tier on ProRated. It requires a Trust Score of 75+ and unlocks a listing in the public Verified Pro Directory — a searchable directory used by homeowners and GCs looking for trusted trade professionals.",
      },
      {
        q: "How do referral codes work?",
        a: "Every approved contractor gets a unique referral code found in your Dashboard. Share it with other trade professionals. When they sign up using your link and submit 3 reviews, you earn 50% off your next month's Pro subscription.",
      },
      {
        q: "How do I delete my account?",
        a: "Go to Dashboard → Profile → scroll to the bottom and tap 'Delete Account'. You'll need to type DELETE to confirm. Your personal information is immediately scrubbed, and your reviews are anonymized to 'Former Member'. This action cannot be undone.",
      },
    ],
  },
  {
    id: "billing",
    icon: "💳",
    title: "Billing & Plans",
    color: "#FFF1F2",
    border: "#FECDD3",
    accent: "#9F1239",
    articles: [
      {
        q: "What's included in the free plan?",
        a: "Free accounts get limited searches and can leave reviews. Submit 3 reviews to unlock 30 days of Pro free. Submit 8 reviews total to earn another 30 days free. Free accounts do not have access to full rating breakdowns or the Pro directory.",
      },
      {
        q: "What does Pro include?",
        a: "Pro ($9.99/month or $99.99/year) includes: unlimited address searches, full 5-category rating breakdowns, work history details, payment score history, access to the Verified Pro directory, and priority data access.",
      },
      {
        q: "How do I cancel my subscription?",
        a: "Email hello@prorated.app with your account email and we'll cancel your subscription immediately. You'll retain Pro access until the end of your current billing period.",
      },
      {
        q: "Is there a discount for associations?",
        a: "Yes. If your trade association has a ProRated partnership, members get free Pro access during the beta period. Check with your association or enter your partner promo code at signup.",
      },
    ],
  },
  {
    id: "privacy",
    icon: "🔒",
    title: "Privacy & Data",
    color: "#F0FDF4",
    border: "#86EFAC",
    accent: "#166534",
    articles: [
      {
        q: "Can homeowners see their own ratings?",
        a: "No. ProRated is a contractor-only platform. Homeowners cannot create accounts, search addresses, or view any ratings. The platform is gated behind verified trade professional license verification.",
      },
      {
        q: "Is my name attached to my reviews?",
        a: "Your name is never shown publicly on reviews. Other contractors see your trade and general reviewer rating, but not your identity. Only you and the ProRated admin can see which reviews you've submitted.",
      },
      {
        q: "What data does ProRated collect?",
        a: "ProRated collects: your name, email, phone, license number, and trade for verification purposes. We also store your submitted reviews and search activity. We never sell your personal data to third parties. Full details are in our Privacy Policy at prorated.app/privacy.",
      },
      {
        q: "Can I request my data?",
        a: "Yes. Email hello@prorated.app to request a copy of all data we hold about you, or to request deletion. We respond within 5 business days.",
      },
      {
        q: "What happens to my data if I delete my account?",
        a: "Your name, email, phone, and license number are immediately scrubbed from our system. Your reviews remain but are anonymized to 'Former Member' so the data remains useful to the community.",
      },
    ],
  },

];

function Article({ q, a, isOpen, onToggle }) {
  return (
    <div style={{ borderBottom: `1px solid #F1F5F9` }}>
      <button onClick={onToggle}
        style={{ width: "100%", background: "none", border: "none", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, lineHeight: 1.4 }}>{q}</span>
        <span style={{ fontSize: 16, color: BRAND.gray, flexShrink: 0, transition: "transform 0.2s", transform: isOpen ? "rotate(45deg)" : "none" }}>+</span>
      </button>
      {isOpen && (
        <div style={{ padding: "0 16px 14px", fontSize: 13, color: BRAND.gray, lineHeight: 1.7, whiteSpace: "pre-line" }}>
          {a}
        </div>
      )}
    </div>
  );
}

export default function SupportPage({ go }) {
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  const [openSection, setOpenSection] = useState("getting-started");
  const [openArticle, setOpenArticle] = useState(null);
  const [search, setSearch]           = useState("");

  // Flatten all articles for search
  const allArticles = SECTIONS.flatMap(s =>
    s.articles.map(a => ({ ...a, section: s.title, sectionId: s.id, icon: s.icon }))
  );

  const searchResults = search.length > 1
    ? allArticles.filter(a =>
        a.q.toLowerCase().includes(search.toLowerCase()) ||
        a.a.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const activeSection = SECTIONS.find(s => s.id === openSection);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "1.5rem 1.25rem 5rem", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <Logo size={48} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: BRAND.dark, margin: "0 0 6px" }}>How can we help?</h1>
        <p style={{ fontSize: 14, color: BRAND.gray, margin: 0 }}>Find answers, guides, and support for ProRated</p>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "2rem" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none" }}>🔍</span>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setOpenArticle(null); }}
          placeholder="Search for answers..."
          style={{ width: "100%", padding: "13px 14px 13px 42px", border: `2px solid ${search ? BRAND.blue : BRAND.border}`, borderRadius: 12, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        />
        {search && (
          <button onClick={() => setSearch("")}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: BRAND.gray, fontSize: 18, cursor: "pointer" }}>×</button>
        )}
      </div>

      {/* Search results */}
      {search.length > 1 && (
        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, marginBottom: "1.5rem", overflow: "hidden" }}>
          {searchResults.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: BRAND.gray, fontSize: 13 }}>
              No results for "{search}" — <a href="mailto:hello@prorated.app" style={{ color: BRAND.blue }}>email us</a> and we'll help.
            </div>
          ) : (
            searchResults.map((a, i) => (
              <div key={i}>
                <div style={{ padding: "6px 16px 0", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12 }}>{a.icon}</span>
                  <span style={{ fontSize: 10, color: BRAND.gray, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{a.section}</span>
                </div>
                <Article q={a.q} a={a.a}
                  isOpen={openArticle === `search-${i}`}
                  onToggle={() => setOpenArticle(openArticle === `search-${i}` ? null : `search-${i}`)} />
              </div>
            ))
          )}
        </div>
      )}



      {/* Section grid */}
      {!search && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: "1.5rem" }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => { setOpenSection(s.id); setOpenArticle(null); }}
                style={{ background: openSection === s.id ? s.color : "#fff", border: `1.5px solid ${openSection === s.id ? s.border : BRAND.border}`, borderRadius: 12, padding: "12px 10px", textAlign: "center", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: openSection === s.id ? s.accent : BRAND.dark, lineHeight: 1.3 }}>{s.title}</div>
              </button>
            ))}
          </div>

          {/* Active section articles */}
          {activeSection && (
            <div style={{ background: "#fff", border: `1.5px solid ${activeSection.border}`, borderRadius: 14, overflow: "hidden", marginBottom: "2rem" }}>
              <div style={{ background: activeSection.color, padding: "14px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{activeSection.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: activeSection.accent }}>{activeSection.title}</span>
                <span style={{ fontSize: 11, color: activeSection.accent, opacity: 0.7, marginLeft: "auto" }}>{activeSection.articles.length} articles</span>
              </div>
              {activeSection.articles.map((article, i) => (
                <Article key={i} q={article.q} a={article.a}
                  isOpen={openArticle === `${activeSection.id}-${i}`}
                  onToggle={() => setOpenArticle(openArticle === `${activeSection.id}-${i}` ? null : `${activeSection.id}-${i}`)} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Contact card */}
      <div style={{ background: BRAND.dark, borderRadius: 16, padding: "1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>💬</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#F8FAFC", marginBottom: 6 }}>Still need help?</div>
        <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 16, lineHeight: 1.6 }}>
          Our team typically responds within a few hours during business days.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="mailto:hello@prorated.app"
            style={{ background: BRAND.blue, color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none", display: "inline-block" }}>
            📧 Email Support
          </a>
          <button onClick={() => go("contact")}
            style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Contact Page →
          </button>
        </div>
        <div style={{ fontSize: 11, color: "#64748B", marginTop: 14 }}>
          hello@prorated.app · Hoover, Alabama
        </div>
      </div>

    </div>
  );
}
