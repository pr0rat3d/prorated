// src/components/UpgradeModal.js
// Native purchase modal — required so paid tiers are actually purchasable
// in-app on a store that mandates it (Apple Guideline 3.1.1 on iOS; Google
// Play's equivalent payments policy on Android, once RevenueCat/Play Console
// is configured — see isNativeIAPReady() in lib/revenuecat.js). The
// "Purchase via ___" button is the one actionable control; the
// prorated.app-management note is informational only (not a link — no
// External Purchase Link Entitlement needed) and lives as a small footnote
// below rather than beside the button, where it read as a second competing
// purchase option.
//
// Apple Guideline 3.1.2(c) also requires, shown in-app at the point of
// purchase: subscription title, length, price, and functional links to the
// Privacy Policy and Terms of Use — all rendered below, pulled live from the
// RevenueCat/StoreKit(or Play Billing) product where possible so the price
// always matches what the user is actually charged.
import { useState, useEffect } from "react";
import { BRAND } from "./UI";
import { purchaseTier, getOfferings } from "../lib/revenuecat";
import { isNativeIOS, isNativeAndroid } from "../utils/platform";
import { useAuth } from "../hooks/useAuth";

function formatSubscriptionLength(isoPeriod) {
  const match = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/.exec(isoPeriod || "");
  if (!match) return "Monthly";
  const [, y, m, w, d] = match;
  if (y) return y === "1" ? "Yearly" : `Every ${y} years`;
  if (m) return m === "1" ? "Monthly" : `Every ${m} months`;
  if (w) return w === "1" ? "Weekly" : `Every ${w} weeks`;
  if (d) return d === "1" ? "Daily" : `Every ${d} days`;
  return "Monthly";
}

// e.g. { periodNumberOfUnits: 6, periodUnit: "MONTH" } -> "6 months"
function formatIntroDuration(introPrice) {
  if (!introPrice) return null;
  const n = introPrice.periodNumberOfUnits || 1;
  const unitLabel = { DAY: "day", WEEK: "week", MONTH: "month", YEAR: "year" }[introPrice.periodUnit] || "month";
  return `${n} ${unitLabel}${n === 1 ? "" : "s"}`;
}

export default function UpgradeModal({ tier, isOpen, onClose, go, onPurchaseSuccess }) {
  const { refreshUser } = useAuth();
  const [status, setStatus]     = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [product, setProduct]   = useState(null); // live StoreKit/Play Billing product info

  const storeName = isNativeIOS() ? "Apple" : isNativeAndroid() ? "Google Play" : "the store";
  const accountSettingsLabel = isNativeIOS() ? "Apple ID subscription settings" : "Google Play subscription settings";
  const webManageLabel = isNativeIOS() ? "prorated.app in Safari" : "prorated.app in your browser";

  useEffect(() => {
    if (!isOpen) return;
    setStatus("idle");
    setErrorMsg("");
    setProduct(null);
    getOfferings().then(packages => {
      const pkg = packages.find(p => p.product?.identifier === tier?.iapProductId);
      if (pkg?.product) setProduct(pkg.product);
    });
  }, [isOpen, tier]);

  if (!isOpen || !tier) return null;

  const priceLabel   = product?.priceString || (tier.price ? `$${tier.price.toFixed(2)}` : "");
  const lengthLabel  = formatSubscriptionLength(product?.subscriptionPeriod);
  const isFreeTrial  = !!product?.introPrice && product.introPrice.price === 0;
  const introDuration = formatIntroDuration(product?.introPrice);

  const handlePurchase = async () => {
    setStatus("loading");
    setErrorMsg("");
    const result = await purchaseTier(tier.iapProductId);
    if (result.success) {
      setStatus("success");
      await refreshUser();
      // Redirect to Dashboard and show the same "You're all set!" confirmation
      // Stripe purchasers get — previously this just closed the modal and left
      // the buyer sitting on the Pricing grid with no next step.
      setTimeout(() => {
        onClose();
        onPurchaseSuccess?.();
        go?.("dashboard");
      }, 1200);
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
        <div style={{ fontSize: 12, color: BRAND.gray, marginBottom: 12 }}>{tier.tagline}</div>

        {/* Title / length / price — required in-app for auto-renewable subscriptions (Apple 3.1.2(c)).
            When there's a free-trial intro offer, the trial duration and post-trial price are
            called out explicitly rather than folded into the base price line. */}
        <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: BRAND.dark, marginBottom: isFreeTrial ? 6 : 4 }}>
            <span style={{ fontWeight: 700 }}>{tier.name} Plan</span>
            <span style={{ fontWeight: 800 }}>{priceLabel}{tier.price ? "/mo" : ""}</span>
          </div>
          {isFreeTrial && introDuration && (
            <div style={{ fontSize: 13, fontWeight: 800, color: BRAND.green, marginBottom: 6 }}>
              🎉 First {introDuration} free, then {priceLabel}/month
            </div>
          )}
          <div style={{ fontSize: 12, color: BRAND.gray }}>
            {lengthLabel} subscription. Your subscription will automatically renew
            {isFreeTrial && introDuration ? ` at ${priceLabel}/month after the free trial ends` : ""} until cancelled.
          </div>
        </div>

        <div style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
          {tier.features.slice(0, 4).map(f => (
            <div key={f} style={{ fontSize: 13, color: BRAND.dark, marginBottom: 6, display: "flex", alignItems: "flex-start" }}>
              <span style={{ color: BRAND.green, fontWeight: 700, marginRight: 8 }}>✓</span>{f}
            </div>
          ))}
        </div>

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

        <button
          onClick={handlePurchase}
          disabled={status === "loading" || status === "success"}
          style={{
            width: "100%",
            padding: "12px",
            background: BRAND.green,
            color: "#fff",
            border: "none",
            borderRadius: 9,
            fontWeight: 700,
            fontSize: 14,
            cursor: (status === "loading" || status === "success") ? "not-allowed" : "pointer",
            opacity: status === "loading" ? 0.7 : 1,
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: 10,
          }}>
          {status === "loading" ? "Purchasing..." : `Purchase via ${storeName}`}
        </button>

        <button onClick={onClose}
          style={{ width: "100%", padding: "10px", border: `1px solid ${BRAND.border}`, borderRadius: 9, background: "#fff", color: BRAND.dark, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: 14 }}>
          Close
        </button>

        {/* Informational, not a link/option — moved down here after it kept
            reading as a second purchase path next to the real Apple button. */}
        <p style={{ fontSize: 11, color: BRAND.gray, textAlign: "center", lineHeight: 1.6, marginBottom: 14 }}>
          You can view or manage this subscription anytime from your {accountSettingsLabel}, or at {webManageLabel}.
        </p>

        <div style={{ textAlign: "center", fontSize: 11, color: BRAND.gray }}>
          <span onClick={() => window.open("/terms", "_blank")} style={{ color: BRAND.blue, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
            Terms of Use
          </span>
          {" · "}
          <span onClick={() => window.open("/privacy", "_blank")} style={{ color: BRAND.blue, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
            Privacy Policy
          </span>
        </div>
      </div>
    </div>
  );
}
