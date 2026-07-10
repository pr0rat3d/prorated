// src/components/UpgradeModal.js
// iOS-only purchase modal — required so paid tiers are actually purchasable
// in-app (Apple Guideline 3.1.1). Equal-prominence buttons: a real "Purchase
// via Apple" IAP flow next to informational (non-clickable) web-management
// text — no External Purchase Link Entitlement needed since there's no tap-out.
import { useState, useEffect } from "react";
import { BRAND } from "./UI";
import { purchaseTier, getOfferings } from "../lib/revenuecat";
import { IOS_SUBSCRIPTION_MSG } from "../utils/platform";
import { useAuth } from "../hooks/useAuth";

export default function UpgradeModal({ tier, isOpen, onClose }) {
  const { refreshUser } = useAuth();
  const [status, setStatus]           = useState("idle"); // idle | loading | success | error | unavailable
  const [errorMsg, setErrorMsg]       = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setStatus("idle");
    setErrorMsg("");
    // Confirm the product is actually loadable before letting the user tap purchase —
    // avoids a dead-end tap if StoreKit/sandbox is unavailable.
    getOfferings().then(packages => {
      const found = packages.some(p => p.product?.identifier === tier?.iapProductId);
      if (!found) setStatus("unavailable");
    });
  }, [isOpen, tier]);

  if (!isOpen || !tier) return null;

  const handlePurchase = async () => {
    setStatus("loading");
    setErrorMsg("");
    const result = await purchaseTier(tier.iapProductId);
    if (result.success) {
      setStatus("success");
      await refreshUser();
      setTimeout(onClose, 1200);
    } else if (result.cancelled) {
      setStatus("idle");
    } else {
      setStatus("error");
      setErrorMsg(result.error || "Purchase failed — please try again.");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, maxWidth: 420, width: "100%", padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: BRAND.dark, marginBottom: 4 }}>
          {tier.icon} {tier.name}
        </div>
        <div style={{ fontSize: 12, color: BRAND.gray, marginBottom: 18 }}>{tier.tagline}</div>

        <div style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
          {tier.features.slice(0, 4).map(f => (
            <div key={f} style={{ fontSize: 13, color: BRAND.dark, marginBottom: 6, display: "flex", alignItems: "flex-start" }}>
              <span style={{ color: BRAND.green, fontWeight: 700, marginRight: 8 }}>✓</span>{f}
            </div>
          ))}
        </div>

        {status === "unavailable" && (
          <div style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 12, color: BRAND.gray, textAlign: "center", lineHeight: 1.6 }}>
            {IOS_SUBSCRIPTION_MSG}
          </div>
        )}

        {status === "error" && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#991B1B" }}>
            {errorMsg}
          </div>
        )}

        {status === "success" && (
          <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#166534", fontWeight: 700, textAlign: "center" }}>
            ✅ Purchase complete — welcome to {tier.name}!
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div style={{ padding: "10px 12px", background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 9, fontSize: 12, color: BRAND.gray, textAlign: "center", lineHeight: 1.4 }}>
            You can also manage your plan at prorated.app
          </div>

          <button
            onClick={handlePurchase}
            disabled={status === "loading" || status === "unavailable" || status === "success"}
            style={{
              padding: "10px 12px",
              background: BRAND.green,
              color: "#fff",
              border: "none",
              borderRadius: 9,
              fontWeight: 700,
              fontSize: 13,
              cursor: (status === "loading" || status === "unavailable" || status === "success") ? "not-allowed" : "pointer",
              opacity: (status === "unavailable") ? 0.5 : 1,
              fontFamily: "'DM Sans', sans-serif",
            }}>
            {status === "loading" ? "Purchasing..." : "Purchase via Apple"}
          </button>
        </div>

        <button onClick={onClose}
          style={{ width: "100%", padding: "10px", border: `1px solid ${BRAND.border}`, borderRadius: 9, background: "#fff", color: BRAND.dark, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          Close
        </button>
      </div>
    </div>
  );
}
