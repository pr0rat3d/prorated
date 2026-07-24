import { Capacitor } from "@capacitor/core";

// True only when running inside the native iOS Capacitor shell.
// Web and Android return false — Stripe links are shown normally there.
export const isNativeIOS = () => {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  } catch {
    return false;
  }
};

export const IOS_SUBSCRIPTION_MSG = "To manage your subscription, visit prorated.app in Safari.";

// True only when running inside the native Android Capacitor shell.
export const isNativeAndroid = () => {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  } catch {
    return false;
  }
};

// True when running inside either native Capacitor shell (iOS or Android) —
// used to hide "download our app" prompts from users who already have it.
export const isNativeApp = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};
