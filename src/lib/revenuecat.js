// src/lib/revenuecat.js
// Thin wrapper around @revenuecat/purchases-capacitor — the iOS In-App
// Purchase path required by Apple Guideline 3.1.1. No-ops on web/Android;
// only ever exercised when isNativeIOS() is true.
import { Purchases } from "@revenuecat/purchases-capacitor";
import { isNativeIOS } from "../utils/platform";
import { REVENUECAT_IOS_KEY } from "../config";

let configured = false;

// Call once after login (and on app boot if a session already exists) —
// sets RevenueCat's appUserID to the contractor's own UUID so the
// revenuecat-webhook edge function can look them up directly, no mapping table needed.
export async function configureRevenueCat(contractorId) {
  if (!isNativeIOS() || !contractorId) return;
  try {
    if (!configured) {
      await Purchases.configure({ apiKey: REVENUECAT_IOS_KEY, appUserID: contractorId });
      configured = true;
    } else {
      await Purchases.logIn({ appUserID: contractorId });
    }
  } catch (err) {
    console.warn("[ProRated] RevenueCat configure failed:", err);
  }
}

// Returns the 3 purchasable packages (bronze/silver/gold) from the current
// RevenueCat Offering, or [] if unavailable (e.g. StoreKit down in sandbox).
export async function getOfferings() {
  if (!isNativeIOS()) return [];
  try {
    const { current } = await Purchases.getOfferings();
    return current?.availablePackages || [];
  } catch (err) {
    console.warn("[ProRated] RevenueCat getOfferings failed:", err);
    return [];
  }
}

// productId: e.g. "com.prorated.gold" — matches the identifier configured
// in App Store Connect / RevenueCat, and PricingPage's TIERS[].iapProductId.
export async function purchaseTier(productId) {
  if (!isNativeIOS()) return { success: false, cancelled: false, error: "Not on iOS" };
  try {
    const packages = await getOfferings();
    const pkg = packages.find(p => p.product?.identifier === productId);
    if (!pkg) return { success: false, cancelled: false, error: "Plan not available for purchase right now" };

    const result = await Purchases.purchasePackage({ aPackage: pkg });
    return { success: true, cancelled: false, customerInfo: result.customerInfo };
  } catch (err) {
    if (err?.userCancelled) return { success: false, cancelled: true };
    console.warn("[ProRated] RevenueCat purchase failed:", err);
    return { success: false, cancelled: false, error: err?.message || "Purchase failed" };
  }
}
