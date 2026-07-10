// src/hooks/useFeatureAccess.js
// Thin, forward-looking convenience wrapper over user.plan for new gating
// code. Existing scattered plan checks (BidIntelligence.js's isGoldPlus,
// CompanySetupPage.js's SEAT_LIMITS) are untouched — they already work.
import { useAuth } from "./useAuth";

export function useFeatureAccess() {
  const { user } = useAuth();
  const plan = user?.plan || "free";

  return {
    teams:            ["bronze", "silver", "gold", "platinum"].includes(plan),
    bidIntelligence:  ["gold", "platinum"].includes(plan),
    advancedFilters:  ["silver", "gold", "platinum"].includes(plan),
    unlimitedReviews: plan !== "free",
    premiumBadge:     ["gold", "platinum"].includes(plan),
  };
}
