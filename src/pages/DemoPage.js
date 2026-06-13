import { useEffect } from "react";
import { BRAND } from "../components/UI";

export default function DemoPage({ go }) {
  useEffect(() => {
    // Set page title
    document.title = "ProRated — See How It Works";
    return () => { document.title = "ProRated — Bidding Made Better"; };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "#0F172A", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Back button */}
      <button
        onClick={() => go("home")}
        style={{
          position: "absolute", top: 14, left: 16, zIndex: 600,
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#fff", padding: "6px 14px", borderRadius: 20,
          fontSize: 12, fontWeight: 600, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        ← Back
      </button>

      {/* Full-screen iframe of the demo */}
      <iframe
        src="/demo.html"
        style={{ width: "100%", height: "100%", border: "none" }}
        title="ProRated Demo"
        allow="autoplay; microphone; camera"
      />
    </div>
  );
}
