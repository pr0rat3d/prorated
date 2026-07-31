import { useState, useEffect } from "react";
import { useLang } from "../hooks/useLang";
import { t } from "../i18n/translations";
import { BRAND } from "../components/UI";
import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config";

const TABS = [
  { id: "general",  label: "General",           icon: "👤" },
  { id: "basics",   label: "Basics",             icon: "🚀" },
  { id: "advanced", label: "Advanced Features",  icon: "⚡" },
];

// Each tab renders a fixed layout (3 tiles for General/Basics — one big top
// tile + two side-by-side below; 4 equal tiles for Advanced), so every entry
// carries a `slot` instead of relying on array order.
const VIDEOS = [
  // ── General ───────────────────────────────────────────────
  {
    id:      "account-setup",
    tab:     "general",
    slot:    "top",
    title:   "Account Setup / Management",
    desc:    "How to sign up, verify your license, sign in with Face ID or Touch ID, and manage your account settings.",
    runtime: "1:30",
    icon:    "🔐",
    src:     null,
  },
  {
    id:      "plan-upgrades",
    tab:     "general",
    slot:    "bottomLeft",
    title:   "Plan Options and Upgrades",
    desc:    "ProRated's plan structure — Free, Bronze, Silver, Gold, and Platinum. How team accounts work, how to invite teammates, and how to upgrade or contact us for custom enterprise pricing.",
    runtime: "1:00",
    icon:    "💰",
    src:     "https://pub-adda1244317b474f9827ed482efd0c69.r2.dev/RPReplay_Final1781286269.mp4",
  },
  {
    id:      "trust-score",
    tab:     "general",
    slot:    "bottomRight",
    title:   "Trust Score",
    desc:    "Understand how your Trust Score is calculated, what each tier means, and what it takes to earn Verified Pro status.",
    runtime: "1:30",
    icon:    "🛡️",
    src:     "https://pub-adda1244317b474f9827ed482efd0c69.r2.dev/RPReplay_Final1781299024.mp4",
  },
  // ── Basics ────────────────────────────────────────────────
  {
    id:      "leave-review",
    tab:     "basics",
    slot:    "top",
    title:   "Adding a Service Record / Review",
    desc:    "Rate a job site in 60 seconds. Select your trade, rate all 5 categories, and add notes for other trade professionals.",
    runtime: "1:00",
    icon:    "⭐",
    src:     "https://pub-adda1244317b474f9827ed482efd0c69.r2.dev/RPReplay_Final1781299999.mp4",
  },
  {
    id:      "search-bid-prep",
    tab:     "basics",
    slot:    "bottomLeft",
    title:   "Searching Addresses / Bid Prep",
    desc:    "Search any job site address, read the 5 rating categories, and pull the Bid Prep summary before you bid.",
    runtime: "2:00",
    icon:    "🔍",
    src:     null,
  },
  {
    id:      "save-address",
    tab:     "basics",
    slot:    "bottomRight",
    title:   "Adding Addresses to Favorites",
    desc:    "How to save a job site address to your watchlist, view your saved addresses in the dashboard, and remove them when you no longer need them.",
    runtime: "0:45",
    icon:    "⭐",
    src:     "https://pub-adda1244317b474f9827ed482efd0c69.r2.dev/RPReplay_Final1781299636.mp4",
  },
  // ── Advanced Features ─────────────────────────────────────
  {
    id:      "managing-team-access",
    tab:     "advanced",
    slot:    "topLeft",
    title:   "Team Management",
    desc:    "Learn how to create your company workspace, invite team members, manage seats, and control member permissions.",
    runtime: "1:30",
    icon:    "🏗️",
    src:     "https://pub-adda1244317b474f9827ed482efd0c69.r2.dev/managing-team-access.mp4",
  },
  {
    id:      "local-poi",
    tab:     "advanced",
    slot:    "topRight",
    title:   "Local Points of Interest",
    desc:    "Find supply houses, lumber yards, and trade suppliers near any job site — right from the address card.",
    runtime: "1:30",
    icon:    "📍",
    src:     "https://pub-adda1244317b474f9827ed482efd0c69.r2.dev/RPReplay_Final1781289509.mov",
  },
  {
    id:      "ownership-flag",
    tab:     "advanced",
    slot:    "bottomLeft",
    title:   "Flagging Ownership Change",
    desc:    "Think the homeowner changed since the existing reviews were left? Flag it in one tap to alert other trade professionals.",
    runtime: "0:45",
    icon:    "🏠",
    src:     "https://pub-adda1244317b474f9827ed482efd0c69.r2.dev/RPReplay_Final1781289300.mp4",
  },
  // "bid-intelligence" (Advanced, bottomRight) isn't a static entry — its
  // locked/coming-soon state depends on the live feature flag + the
  // viewer's plan, computed in the component below.
];

function VideoCard({ video, onPlay, onLocked, big }) {
  if (!video) return null;
  const hasVideo = !!video.src;
  const locked   = !!video.locked;
  const tabColor = {
    general:  { bg: "#EFF6FF", accent: "#1E40AF" },
    basics:   { bg: "#F0FDF4", accent: "#166534" },
    advanced: { bg: "#FFFBEB", accent: "#92400E" },
  }[video.tab];

  const clickable = hasVideo || locked;
  const handleClick = () => {
    if (locked) onLocked(video);
    else if (hasVideo) onPlay(video);
  };

  return (
    <div
      onClick={clickable ? handleClick : undefined}
      style={{
        background: "#fff",
        border: `1px solid ${BRAND.border}`,
        borderRadius: 16, overflow: "hidden",
        cursor: clickable ? "pointer" : "default",
        transition: "transform 0.15s, box-shadow 0.15s",
        height: "100%",
      }}
      onMouseOver={e => { if (clickable) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}}
      onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Thumbnail */}
      <div style={{
        height: big ? 200 : 130,
        background: hasVideo
          ? "linear-gradient(135deg,#1a3328,#1E3A5F)"
          : locked
            ? "linear-gradient(135deg,#1F2937,#374151)"
            : `linear-gradient(135deg,${tabColor.bg},#fff)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        {hasVideo ? (
          <>
            <div style={{
              width: big ? 60 : 48, height: big ? 60 : 48, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: big ? 22 : 18, marginLeft: 3 }}>▶</span>
            </div>
            <div style={{
              position: "absolute", bottom: 8, right: 10,
              background: "rgba(0,0,0,0.6)", color: "#fff",
              fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
            }}>{video.runtime}</div>
          </>
        ) : locked ? (
          <>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 34, marginBottom: 6 }}>🔒</div>
              <div style={{
                background: "rgba(255,255,255,0.12)", color: "#FBBF24",
                fontSize: 9, fontWeight: 700, padding: "2px 10px",
                borderRadius: 10, letterSpacing: "0.08em", textTransform: "uppercase",
              }}>Locked — Gold & Platinum</div>
            </div>
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
            {video.runtime && video.runtime !== "—" && (
              <div style={{
                position: "absolute", bottom: 8, right: 10,
                background: "rgba(0,0,0,0.1)", color: tabColor.accent,
                fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
              }}>{video.runtime}</div>
            )}
          </>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 5 }}>
          <span style={{ fontSize: big ? 16 : 14, flexShrink: 0 }}>{video.icon}</span>
          <div style={{ fontSize: big ? 15 : 13, fontWeight: 800, color: BRAND.dark, lineHeight: 1.3 }}>{video.title}</div>
        </div>
        <div style={{ fontSize: 11, color: BRAND.gray, lineHeight: 1.6 }}>{video.desc}</div>
        {locked && (
          <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: BRAND.blue }}>Upgrade to unlock →</div>
        )}
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
  const { user } = useAuth();
  const [activeTab, setActiveTab]     = useState("general");
  const [activeVideo, setActiveVideo] = useState(null);

  // Raw flag row (not just this user's access) — needed to tell "nobody has
  // this yet" (Coming Soon) apart from "it's live, but not for your plan"
  // (Locked). useFeatureFlag only answers the latter question for one plan.
  const [biFlag, setBiFlag] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`${SUPABASE_URL}/rest/v1/feature_flags?name=eq.bid_intelligence&select=enabled,early_access_plans`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    }).then(r => r.json()).then(d => { if (!cancelled) setBiFlag(d?.[0] || null); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const { canAccess: biCanAccess } = useFeatureFlag("bid_intelligence", user?.plan);
  const biFlagLive = !!(biFlag && (biFlag.enabled || (biFlag.early_access_plans || []).length > 0));

  const biVideo = {
    id: "bid-intelligence", tab: "advanced", slot: "bottomRight",
    title: "Bid Intelligence",
    desc: "AI-generated bid-prep reports for every address — payment reliability, access difficulty, and would-return rate, summarized in seconds.",
    runtime: "—", icon: "🤖",
    src: null,
    locked: biFlagLive && !biCanAccess,
  };

  const allVideos  = [...VIDEOS, biVideo];
  const bySlot      = Object.fromEntries(allVideos.filter(v => v.tab === activeTab).map(v => [v.slot, v]));
  const handlePlay   = v => setActiveVideo(v);
  const handleLocked = () => go("pricing");

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

      {/* Video grid — one big top tile + two below for General/Basics,
          an even 2x2 grid for Advanced */}
      {activeTab !== "advanced" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <VideoCard video={bySlot.top} onPlay={handlePlay} onLocked={handleLocked} big />
          </div>
          <VideoCard video={bySlot.bottomLeft} onPlay={handlePlay} onLocked={handleLocked} />
          <VideoCard video={bySlot.bottomRight} onPlay={handlePlay} onLocked={handleLocked} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <VideoCard video={bySlot.topLeft} onPlay={handlePlay} onLocked={handleLocked} />
          <VideoCard video={bySlot.topRight} onPlay={handlePlay} onLocked={handleLocked} />
          <VideoCard video={bySlot.bottomLeft} onPlay={handlePlay} onLocked={handleLocked} />
          <VideoCard video={bySlot.bottomRight} onPlay={handlePlay} onLocked={handleLocked} />
        </div>
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
