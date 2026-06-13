import { useState, useEffect } from "react";

const BETA_SEEN_KEY    = "prorated_beta_seen";
const ONBOARD_DONE_KEY = "prorated_onboarded";

export default function useOnboarding() {
  const [showBetaWelcome, setShowBetaWelcome] = useState(false);
  const [onboardingDone, setOnboardingDone]   = useState(true);

  useEffect(() => {
    try {
      const betaSeen = localStorage.getItem(BETA_SEEN_KEY);
      if (!betaSeen) {
        // Small delay so the app renders first
        setTimeout(() => setShowBetaWelcome(true), 800);
      }
      setOnboardingDone(!!localStorage.getItem(ONBOARD_DONE_KEY));
    } catch {}
  }, []);

  const completeBetaWelcome = () => {
    try {
      localStorage.setItem(BETA_SEEN_KEY, "1");
      localStorage.setItem(ONBOARD_DONE_KEY, "1");
    } catch {}
    setShowBetaWelcome(false);
    setOnboardingDone(true);
  };

  const resetOnboarding = () => {
    try {
      localStorage.removeItem(BETA_SEEN_KEY);
      localStorage.removeItem(ONBOARD_DONE_KEY);
    } catch {}
    setShowBetaWelcome(true);
  };

  return { showBetaWelcome, onboardingDone, completeBetaWelcome, resetOnboarding };
}
