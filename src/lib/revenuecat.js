// src/lib/revenuecat.js
// Thin wrapper around @revenuecat/purchases-capacitor — the native In-App
// Purchase path required by store policy when a subscription unlocks in-app
// content (Apple Guideline 3.1.1 on iOS; Google Play's equivalent payments
// policy on Android).
//
// iOS is fully configured. Android is NOT yet — no Google Play app/products
// exist in the RevenueCat dashboard, so REVENUECAT_ANDROID_KEY is empty by
// default. Every function below no-ops (returns an empty/failure result
// rather than throwing) until that key is actually set, so PricingPage.js's
// existing Stripe fallback keeps working on Android exactly as it does today
// — this file becomes "live" for Android the moment the key is configured,
// no further code change needed.
import { Purchases } from "@revenuecat/purchases-capacitor";
import { isNativeIOS, isNativeAndroid } from "../utils/platform";
import { REVENUECAT_IOS_KEY, REVENUECAT_ANDROID_KEY } from "../config";

let configured = false;

// The platform-correct API key, or null if native IAP isn't usable right
// now (web always; Android until its key is configured).
function activeKey() {
  if (isNativeIOS()) return REVENUECAT_IOS_KEY;
  if (isNativeAndroid() && REVENUECAT_ANDROID_KEY) return REVENUECAT_ANDROID_KEY;
  return null;
}

// Single source of truth for "should the UI show the native purchase flow
// instead of Stripe" — PricingPage.js/SignupPage.js/CompanySetupPage.js all
// key off this rather than re-implementing the platform+key check themselves.
export function isNativeIAPReady() {
  return !!activeKey();
}

// Call once after login (and on app boot if a session already exists) —
// sets RevenueCat's appUserID to the contractor's own UUID so the
// revenuecat-webhook edge function can look them up directly, no mapping table needed.
// Also attaches the email as a subscriber attribute so customers are
// identifiable by name/email directly in the RevenueCat dashboard instead of
// needing to cross-reference the app_user_id against our own DB every time.
export async function configureRevenueCat(contractorId, email) {
  const apiKey = activeKey();
  if (!apiKey || !contractorId) return;
  try {
    if (!configured) {
      await Purchases.configure({ apiKey, appUserID: contractorId });
      configured = true;
    } else {
      await Purchases.logIn({ appUserID: contractorId });
    }
    if (email) await Purchases.setEmail({ email });
  } catch (err) {
    console.warn("[ProRated] RevenueCat configure failed:", err);
  }
}

// Returns the purchasable packages from RevenueCat. Prefers the "current"
// Offering, but falls back to scanning every configured Offering — if the
// current one was never set in the RevenueCat dashboard (an easy step to
// miss), we'd otherwise see zero packages for every tier even though the
// products exist and are correctly attached to *an* offering.
export async function getOfferings() {
  if (!activeKey()) return [];
  try {
    const { current, all } = await Purchases.getOfferings();
    const currentPackages = current?.availablePackages || [];
    if (currentPackages.length > 0) return currentPackages;

    const allPackages = Object.values(all || {}).flatMap(o => o.availablePackages || []);
    console.warn(
      `[ProRated] RevenueCat has no "current" offering set — falling back to ${allPackages.length} package(s) found across ${Object.keys(all || {}).length} offering(s). Set a Current offering in the RevenueCat dashboard to fix this properly.`
    );
    return allPackages;
  } catch (err) {
    console.warn("[ProRated] RevenueCat getOfferings failed:", err);
    return [];
  }
}

// productId: e.g. "com.prorated.gold" — matches the identifier configured
// in App Store Connect / Google Play Console / RevenueCat, and
// PricingPage's TIERS[].iapProductId.
export async function purchaseTier(productId) {
  if (!activeKey()) return { success: false, cancelled: false, error: "In-app purchase isn't available on this platform yet" };
  try {
    const packages = await getOfferings();
    const pkg = packages.find(p => p.product?.identifier === productId);
    if (!pkg) {
      const foundIds = packages.map(p => p.product?.identifier).filter(Boolean);
      console.warn(
        `[ProRated] No RevenueCat package matches "${productId}". ` +
        (foundIds.length ? `Packages found instead: ${foundIds.join(", ")}` : "No packages returned at all — check the products' status in App Store Connect / Google Play Console and that they're attached to an Offering in RevenueCat.")
      );
      return { success: false, cancelled: false, error: "Plan not available for purchase right now" };
    }

    const result = await Purchases.purchasePackage({ aPackage: pkg });
    return { success: true, cancelled: false, customerInfo: result.customerInfo };
  } catch (err) {
    if (err?.userCancelled) return { success: false, cancelled: true };
    console.warn("[ProRated] RevenueCat purchase failed:", err);
    return { success: false, cancelled: false, error: err?.message || "Purchase failed" };
  }
}
