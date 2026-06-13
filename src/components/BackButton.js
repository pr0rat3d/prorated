import { BRAND } from "./UI";

export default function BackButton({ go, to = "home", label = "Back" }) {
  return (
    <button onClick={() => go(to)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "none", border: "none", cursor: "pointer",
        color: BRAND.blue, fontSize: 14, fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        padding: "8px 0", marginBottom: "0.5rem",
      }}>
      <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
      {label}
    </button>
  );
}
