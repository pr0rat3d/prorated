// src/components/StoreBadges.js
// App Store / Google Play download badges.
// Google Play link is still a placeholder — swap once the Android listing is live.
import { isNativeApp } from "../utils/platform";

const APPLE_BADGE_URL  = "https://apps.apple.com/us/app/prorated/id6785617187";
const GOOGLE_BADGE_URL = "https://prorated.app";

const getDevicePlatform = () => {
  const ua = navigator.userAgent || "";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
};

export default function StoreBadges({ style }) {
  // Already inside the native app shell — no point prompting to download it
  if (isNativeApp()) return null;

  const platform = getDevicePlatform();
  const showApple  = platform === "ios" || platform === "desktop";
  const showGoogle = platform === "android" || platform === "desktop";

  return (
    <div className="pr-store-badges" style={style}>
      {showApple && (
        <a href={APPLE_BADGE_URL} target="_blank" rel="noreferrer" aria-label="Download on the App Store">
          <img src="/app-store-badge.svg" alt="Download on the App Store" width={140} style={{ display: "block", height: "auto" }} />
        </a>
      )}
      {showGoogle && (
        <a href={GOOGLE_BADGE_URL} target="_blank" rel="noreferrer" aria-label="Get it on Google Play">
          <img src="/google-play-badge.png" alt="Get it on Google Play" width={140} style={{ display: "block", height: "auto" }} />
        </a>
      )}
    </div>
  );
}
