// ─────────────────────────────────────────────────────────────
// ProRated — Face ID / Touch ID sign-in
// This is a re-lock, not a password replacement: the user's own
// email/password are stored in the OS secure store (iOS Keychain /
// Android Keystore) behind AccessControl.BIOMETRY_ANY, so a
// biometric check is required by the OS itself to read them back —
// not something this app enforces in JS. A successful biometric
// unlock is run through the normal signIn() flow, so every
// "biometric login" is a completely real, fresh login.
// ─────────────────────────────────────────────────────────────
import { NativeBiometric, AccessControl, BiometryType } from "@capgo/capacitor-native-biometric";
import { isNativeApp } from "./platform";

const SERVER = "prorated.app";

export const isBiometricAvailable = async () => {
  if (!isNativeApp()) return false;
  try {
    const result = await NativeBiometric.isAvailable();
    return !!result?.isAvailable;
  } catch {
    return false;
  }
};

const BIOMETRY_LABELS = {
  [BiometryType.FACE_ID]: "Face ID",
  [BiometryType.TOUCH_ID]: "Touch ID",
  [BiometryType.FINGERPRINT]: "fingerprint unlock",
  [BiometryType.FACE_AUTHENTICATION]: "face unlock",
  [BiometryType.IRIS_AUTHENTICATION]: "iris scan",
};

// Copy should never hardcode "Face ID" — older iPhones/iPads (home button)
// report Touch ID, and Android reports fingerprint/face unlock. Falls back
// to a device-agnostic phrase whenever the specific type isn't a single
// known biometric (MULTIPLE, DEVICE_CREDENTIAL, or a lookup miss).
export const getBiometryLabel = async () => {
  if (!isNativeApp()) return "Face ID or Touch ID";
  try {
    const result = await NativeBiometric.isAvailable();
    return BIOMETRY_LABELS[result?.biometryType] || "Face ID or Touch ID";
  } catch {
    return "Face ID or Touch ID";
  }
};

export const hasSavedBiometricLogin = async () => {
  if (!isNativeApp()) return false;
  try {
    const result = await NativeBiometric.isCredentialsSaved({ server: SERVER });
    return !!result?.isSaved;
  } catch {
    return false;
  }
};

export const saveBiometricLogin = async (email, password) => {
  if (!isNativeApp()) return false;
  try {
    await NativeBiometric.setCredentials({
      username: email,
      password,
      server: SERVER,
      accessControl: AccessControl.BIOMETRY_ANY,
    });
    return true;
  } catch {
    return false;
  }
};

// Triggers the native Face ID / Touch ID prompt as an intrinsic part of
// reading the protected credential (getSecureCredentials, not
// verifyIdentity + getCredentials — the latter pair aren't
// cryptographically tied together and would let stored credentials be
// read without a live biometric check). Returns null — never throws —
// on a cancelled or failed prompt, so callers can just fall back to the
// manual login form.
export const getBiometricLogin = async () => {
  if (!isNativeApp()) return null;
  try {
    const creds = await NativeBiometric.getSecureCredentials({
      server: SERVER,
      reason: "Sign in to ProRated",
      title: "Sign in",
      subtitle: "Use Face ID or Touch ID to sign in",
    });
    return creds?.username && creds?.password ? creds : null;
  } catch {
    return null;
  }
};

export const clearBiometricLogin = async () => {
  if (!isNativeApp()) return;
  try {
    await NativeBiometric.deleteCredentials({ server: SERVER });
  } catch {}
};
