import { useState } from "react";
import { useLang } from "../hooks/useLang";
import { t } from "../i18n/translations";
import { BRAND } from "../components/UI";
import Logo from "../components/Logo";

const TABS = [
  { id: "account",  label: "Account",           icon: "👤" },
  { id: "basics",   label: "The Basics",         icon: "🚀" },
  { id: "advanced", label: "Advanced Features",  icon: "⚡" },
];

const VIDEOS = [
  // ── Account ───────────────────────────────────────────────
  {
    id:      "create-account",
    tab:     "account",
    title:   "New Account Setup",
    desc:    "How to sign up, what license information you need, and how to get started once you're approved.",
    runtime: "1:30",
    icon:    "🔐",
    src:     "https://pub-adda1244317b474f9827ed482efd0c69.r2.dev/RPReplay_Final1781285403.mp4",
  },
  {
    id:      "notifications",
    tab:     "account",
    title:   "How to Add Push Notifications",
    desc:    "How to enable push notifications so you get alerted when a saved address gets a new contractor review — before you bid.",
    runtime: "0:45",
    icon:    "🔔",
    src:     "https://pub-adda1244317b474f9827ed482efd0c69.r2.dev/RPReplay_Final1781296798.mp4",
  },
  {
    id:      "trust-score",
    tab:     "account",
    title:   "Understanding Your Trust Score",
    desc:    "Understand how your Trust Score is calculated, what each tier means, and what it takes to earn Verified Pro status.",
    runtime: "1:30",
    icon:    "🛡️",
    src:     "https://pub-adda1244317b474f9827ed482efd0c69.r2.dev/RPReplay_Final1781299024.mp4",
  },
  {
    id:      "plan-upgrades",
    tab:     "account",
    title:   "Plan Options & Upgrades",
    desc:    "ProRated's plan structure — Free, Bronze, Silver, Gold, and Platinum. How team accounts work, how to invite teammates, and how to upgrade or contact us for custom enterprise pricing.",
    runtime: "1:00",
    icon:    "💰",
    src:     "https://pub-adda1244317b474f9827ed482efd0c69.r2.dev/RPReplay_Final1781286269.mp4",
  },
  // ── The Basics ────────────────────────────────────────────
  {
    id:      "install-pwa",
    tab:     "basics",
    title:   "Adding ProRated to Your Home Screen",
    desc:    "Install ProRated as an app on your iPhone or Android in under 30 seconds. No App Store required.",
    runtime: "0:45",
    icon:    "📲",
    src:     "https://pub-adda1244317b474f9827ed482efd0c69.r2.dev/RPReplay_Final1781285978.mp4",
  },

  {
    id:      "leave-review",
    tab:     "basics",
    title:   "Adding a Service Record / Reviewing",
    desc:    "Rate a job site in 60 seconds. Select your trade, rate all 5 categories, and add notes for other trade professionals.",
    runtime: "1:00",
    icon:    "⭐",
    src:     "https://pub-adda1244317b474f9827ed482efd0c69.r2.dev/RPReplay_Final1781299999.mp4",
  },
  {
    id:      "save-address",
    tab:     "basics",
    title:   "Adding Addresses to Favorites / Watchlist",
    desc:    "How to save a job site address to your watchlist, view your saved addresses in the dashboard, and remove them when you no longer need them.",
    runtime: "0:45",
    icon:    "⭐",
    src:     "https://pub-adda1244317b474f9827ed482efd0c69.r2.dev/RPReplay_Final1781299636.mp4",
  },
  {
    id:      "search-and-report",
    tab:     "basics",
    title:   "Searching Addresses & Reading the Report",
    desc:    "How to search any job site address, what the 5 rating categories mean, and how to use the scores to make a better bidding decision.",
    runtime: "2:00",
    icon:    "🔍",
    src:     "https://pub-adda1244317b474f9827ed482efd0c69.r2.dev/RPReplay_Final1781300675.mp4",
  },
  // ── Advanced Features ─────────────────────────────────────
  {
    id:      "bid-prep",
    tab:     "advanced",
    title:   "Using Bid Prep",
    desc:    "Tap 📋 Bid Prep on any address card for a consolidated data summary — payment score, access rating, work history, and ownership info.",
    runtime: "1:00",
    icon:    "📋",
    src:     "https://pub-adda1244317b474f9827ed482efd0c69.r2.dev/RPReplay_Final1781289070.mp4",
  },
  {
    id:      "local-poi",
    tab:     "advanced",
    title:   "Local Points of Interest",
    desc:    "Find supply houses, lumber yards, and trade suppliers near any job site — right from the address card.",
    runtime: "1:30",
    icon:    "📍",
    src:     "https://pub-adda1244317b474f9827ed482efd0c69.r2.dev/RPReplay_Final1781289509.mov",
  },
  {
    id:      "ownership-flag",
    tab:     "advanced",
    title:   "Flagging an Ownership Change",
    desc:    "Think the homeowner changed since the existing reviews were left? Flag it in one tap to alert other trade professionals.",
    runtime: "0:45",
    icon:    "🏠",
    src:     "https://pub-adda1244317b474f9827ed482efd0c69.r2.dev/RPReplay_Final1781289300.mp4",
  },
  {
    id:      "managing-team-access",
    tab:     "advanced",
    title:   "Managing Team Access",
    desc:    "Learn how to create your company workspace, invite team members, manage seats, and control member permissions.",
    runtime: "1:30",
    icon:    "🏗️",
    src:     "https://pub-adda1244317b474f9827ed482efd0c69.r2.dev/managing-team-access.mp4",
  },
];

function VideoCard({ video, onPlay }) {
  const hasVideo = !!video.src;
  const tabColor = {
    account:  { bg: "#EFF6FF", accent: "#1E40AF" },
    basics:   { bg: "#F0FDF4", accent: "#166534" },
    advanced: { bg: "#FFFBEB", accent: "#92400E" },
  }[video.tab];

  return (
    <div
      onClick={() => hasVideo && onPlay(video)}
      style={{
        background: "#fff",
        border: `1px solid ${BRAND.border}`,
        borderRadius: 16, overflow: "hidden",
        cursor: hasVideo ? "pointer" : "default",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      onMouseOver={e => { if (hasVideo) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}}
      onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Thumbnail */}
      <div style={{
        height: 130,
        background: hasVideo
          ? "linear-gradient(135deg,#1a3328,#1E3A5F)"
          : `linear-gradient(135deg,${tabColor.bg},#fff)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        {hasVideo ? (
          <>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 18, marginLeft: 3 }}>▶</span>
            </div>
            <div style={{
              position: "absolute", bottom: 8, right: 10,
              background: "rgba(0,0,0,0.6)", color: "#fff",
              fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
            }}>{video.runtime}</div>
          </>
        ) : (
          <>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 34, marginBottom: 6 }}>{video.icon}</div>
              <div style={{
                background: "rgba(0,0,0,0.07)", color: tabColor.accent,
                fontSize: 9, fontWeight: 700, padding: "2px 10px",
                borderRadius: 10, letterSpacing: "0.08em", textTransform: "uppercase",
              }}>Coming Soon</div>
            </div>
            <div style={{
              position: "absolute", bottom: 8, right: 10,
              background: "rgba(0,0,0,0.1)", color: tabColor.accent,
              fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
            }}>{video.runtime}</div>
          </>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 5 }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>{video.icon}</span>
          <div style={{ fontSize: 13, fontWeight: 800, color: BRAND.dark, lineHeight: 1.3 }}>{video.title}</div>
        </div>
        <div style={{ fontSize: 11, color: BRAND.gray, lineHeight: 1.6 }}>{video.desc}</div>
        <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 10, color: BRAND.gray }}>⏱ {video.runtime}</span>
        </div>
      </div>
    </div>
  );
}

function VideoModal({ video, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: "1rem",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#0F172A", borderRadius: 16, overflow: "hidden",
        width: "100%", maxWidth: 640,
        boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
      }}>
        <div style={{ position: "relative", paddingBottom: "56.25%", background: "#000" }}>
          {video.src
            ? <video src={video.src} controls autoPlay style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
            : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 40 }}>{video.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Video coming soon</div>
              </div>
          }
        </div>
        <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#F8FAFC" }}>{video.title}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>⏱ {video.runtime}</div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.08)", border: "none", color: "#94A3B8",
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          }}>Close ×</button>
        </div>
      </div>
    </div>
  );
}

export default function ResourcesPage({ go }) {
  const { lang } = useLang();
  const [activeTab, setActiveTab]     = useState("account");
  const [activeVideo, setActiveVideo] = useState(null);

  const videos = VIDEOS.filter(v => v.tab === activeTab);
  const ready  = videos.filter(v => v.src);
  const soon   = videos.filter(v => !v.src);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "1.5rem 1.25rem 5rem", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <Logo size={44} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: BRAND.dark, margin: "0 0 6px" }}>
          Resources & Tutorials
        </h1>
        <p style={{ fontSize: 14, color: BRAND.gray, margin: 0, lineHeight: 1.6 }}>
          {t(lang,"resources.subtitle") || "Short video guides to help you get the most out of ProRated"}
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", background: "#F1F5F9",
        borderRadius: 14, padding: 4,
        marginBottom: "1.5rem", gap: 4,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: "9px 8px", borderRadius: 10,
              border: "none", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              background: activeTab === tab.id ? "#fff" : "transparent",
              color: activeTab === tab.id ? BRAND.dark : BRAND.gray,
              boxShadow: activeTab === tab.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.2s",
            }}
          >
            <span>{tab.icon}</span>
            <span style={{ whiteSpace: "nowrap" }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Coming soon banner */}
      {ready.length === 0 && (
        <div style={{
          background: "#F0FDF4", border: "1px solid #86EFAC",
          borderRadius: 14, padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <div style={{ fontSize: 22, flexShrink: 0 }}>🎬</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#166534", marginBottom: 3 }}>
              Tutorial videos coming soon
            </div>
            <div style={{ fontSize: 12, color: "#166534", lineHeight: 1.6 }}>
              We're recording short walkthrough videos for every feature. Visit{" "}
              <span
                onClick={() => go("support")}
                style={{ fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
              >Support</span>{" "}
              for written guides in the meantime.
            </div>
          </div>
        </div>
      )}

      {/* Ready videos */}
      {ready.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.gray, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Available Now
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14, marginBottom: "1.5rem" }}>
            {ready.map(v => <VideoCard key={v.id} video={v} onPlay={setActiveVideo} />)}
          </div>
        </>
      )}

      {/* Coming soon videos */}
      {soon.length > 0 && (
        <>
          {ready.length > 0 && (
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.gray, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              Coming Soon
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
            {soon.map(v => <VideoCard key={v.id} video={v} onPlay={setActiveVideo} />)}
          </div>
        </>
      )}

      {/* Support link */}
      <div style={{
        marginTop: "2.5rem", background: BRAND.dark,
        borderRadius: 16, padding: "1.25rem", textAlign: "center",
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#F8FAFC", marginBottom: 6 }}>
          Prefer reading over watching?
        </div>
        <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 14 }}>
          Our support center has written guides for every feature.
        </div>
        <button onClick={() => go("support")} style={{
          background: BRAND.blue, color: "#fff", border: "none",
          padding: "10px 24px", borderRadius: 10,
          fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
        }}>
          Visit Support Center →
        </button>
      </div>

      {activeVideo && <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />}
    </div>
  );
}
