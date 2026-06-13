import { useState } from "react";
import { AVATAR_PAL, BRAND as BRAND_CONST } from "../data/constants";

// Re-export BRAND so components can import it from either UI.js or constants.js
export const BRAND = BRAND_CONST;

export const tagStyle = (s) =>
  s === "good" ? { bg: "#DCFCE7", color: "#166534", border: "#86EFAC" }
  : s === "warn" ? { bg: "#FEF9C3", color: "#854D0E", border: "#FDE047" }
  : s === "bad"  ? { bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5" }
  : { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" };

export const scoreColor = (n) => n >= 4 ? "#166534" : n >= 3 ? "#854D0E" : "#991B1B";
export const scoreBg    = (n) => n >= 4 ? "#DCFCE7" : n >= 3 ? "#FEF9C3" : "#FEE2E2";
export const barColor   = (n) => n >= 4 ? "#16A34A" : n >= 3 ? "#D97706" : "#DC2626";

export function Stars({ score, size = 16, interactive = false, onChange }) {
  const [hov, setHov] = useState(0);
  const d = hov || score;
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n}
          onClick={() => interactive && onChange?.(n)}
          onMouseEnter={() => interactive && setHov(n)}
          onMouseLeave={() => interactive && setHov(0)}
          style={{ fontSize: size, lineHeight: 1, userSelect: "none", cursor: interactive ? "pointer" : "default", color: n <= d ? "#D97706" : "#CBD5E1", transition: "color 0.1s" }}>
          ★
        </span>
      ))}
    </span>
  );
}

export function Badge({ score, large = false }) {
  return (
    <span style={{ background: scoreBg(score), color: scoreColor(score), fontWeight: 700, fontSize: large ? 20 : 14, padding: large ? "5px 11px" : "3px 8px", borderRadius: 8, fontFamily: "'DM Mono', monospace" }}>
      {score.toFixed(1)}
    </span>
  );
}

export function Pill({ label, sev = "neutral", small = false, selected = false, onClick }) {
  const p = tagStyle(sev);
  return (
    <span onClick={onClick}
      style={{ display: "inline-block", whiteSpace: "nowrap", cursor: onClick ? "pointer" : "default", background: selected ? p.bg : "#F8FAFC", color: selected ? p.color : "#475569", border: `1.5px solid ${selected ? p.border : "#CBD5E1"}`, borderRadius: 20, fontWeight: 500, fontSize: small ? 11 : 12, padding: small ? "2px 8px" : "4px 11px", transition: "all 0.12s" }}>
      {label}
    </span>
  );
}

export function Bar({ score }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${(score / 5) * 100}%`, height: "100%", background: barColor(score), borderRadius: 4, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", fontFamily: "'DM Mono', monospace", minWidth: 22, textAlign: "right" }}>{score.toFixed(1)}</span>
    </div>
  );
}

export function Avatar({ initials, idx = 0 }) {
  const [bg, c] = AVATAR_PAL[idx % AVATAR_PAL.length];
  return (
    <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: bg, color: c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>
      {initials}
    </div>
  );
}

export function Btn({ children, onClick, disabled, variant = "primary", small = false, fullWidth = false }) {
  const s = {
    primary:   { background: BRAND.blue,  color: "#fff", border: "none" },
    secondary: { background: "transparent", color: BRAND.dark, border: `1.5px solid ${BRAND.border}` },
    green:     { background: BRAND.green, color: "#fff", border: "none" },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...s, padding: small ? "6px 14px" : "10px 22px", borderRadius: 9, fontFamily: "'DM Sans', sans-serif", fontSize: small ? 12 : 14, fontWeight: 700, whiteSpace: "nowrap", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, width: fullWidth ? "100%" : "auto", transition: "opacity 0.15s" }}>
      {children}
    </button>
  );
}

export function Card({ children, style = {}, green = false }) {
  return (
    <div style={{ background: green ? "#F0FDF4" : "#FFFFFF", border: `1px solid ${green ? "#86EFAC" : BRAND.border}`, borderRadius: 16, padding: "1.25rem", ...style }}>
      {children}
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3.5rem 1rem", gap: 16 }}>
      <div style={{ width: 42, height: 42, borderRadius: "50%", border: `3px solid ${BRAND.border}`, borderTop: `3px solid ${BRAND.blue}`, animation: "spin 0.8s linear infinite" }} />
      <span style={{ fontSize: 13, color: BRAND.gray, fontWeight: 500 }}>Looking up job site history...</span>
    </div>
  );
}
