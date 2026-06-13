import { useState, useEffect } from "react";
import { BRAND } from "./UI";
import { useLang } from "../hooks/useLang";
import { isPushSupported, getPermissionState, subscribeToPush, isSubscribed, showTestNotification } from "../api/pushService";
import { useAuth } from "../hooks/useAuth";

export default function PushPrompt({ onDismiss }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const [ready, setReady]       = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [done, setDone]         = useState(false);

  // Check support async — prevents flash/flicker
  useEffect(() => {
    if (!isPushSupported()) return;
    if (getPermissionState() === "denied") return;
    isSubscribed().then(sub => {
      if (!sub) setReady(true);
    });
  }, []);

  if (!ready || done) return null;

  const m = lang === "es" ? {
    title: "Activar alertas de reseñas",
    body:  "Recibe notificaciones cuando una dirección guardada reciba una nueva reseña.",
    btn:   "Activar 🔔",
    skip:  "Ahora no",
  } : {
    title: "Enable review alerts",
    body:  "Get notified when a saved address gets a new contractor review.",
    btn:   "Enable 🔔",
    skip:  "Not now",
  };

  const handleEnable = async () => {
    setEnabling(true);
    try {
      const result = await subscribeToPush(user?.id);
      if (result.success) {
        await showTestNotification().catch(() => {});
        setDone(true);
        onDismiss?.();
      } else if (result.reason === "denied") {
        setDone(true);
        onDismiss?.();
      }
    } catch (e) {
      console.error("[PushPrompt]", e);
    }
    setEnabling(false);
  };

  const handleDismiss = () => {
    setDone(true);
    onDismiss?.();
  };

  return (
    // Render as a normal in-flow banner — not fixed — so it
    // sits above the nav and below the top bar without z-index fights
    <div style={{
      position: "sticky",
      top: 0,
      zIndex: 500,
      background: "#1a3328",
      borderBottom: `2px solid ${BRAND.blue}`,
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>🔔</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#F8FAFC", lineHeight: 1.2 }}>{m.title}</div>
        <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.4, marginTop: 1 }}>{m.body}</div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button
          onClick={handleEnable}
          disabled={enabling}
          style={{
            background: BRAND.blue, color: "#fff", border: "none",
            padding: "7px 12px", borderRadius: 8,
            fontSize: 12, fontWeight: 700,
            cursor: enabling ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
            opacity: enabling ? 0.7 : 1,
            whiteSpace: "nowrap",
          }}>
          {enabling ? "..." : m.btn}
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: "rgba(255,255,255,0.1)", color: "#94A3B8",
            border: "none", padding: "7px 10px", borderRadius: 8,
            fontSize: 16, cursor: "pointer", lineHeight: 1,
          }}>×</button>
      </div>
    </div>
  );
}
