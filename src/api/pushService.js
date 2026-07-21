import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
// ─────────────────────────────────────────────────────────────
// ProRated — Push Notification Service (Client Side)
// Handles subscribing to Web Push, saving subscriptions
// to Supabase, and requesting notification permission.
// ─────────────────────────────────────────────────────────────

// !! Replace with your actual VAPID public key after running:
// npx web-push generate-vapid-keys
export const VAPID_PUBLIC_KEY = "BFCehdO86H-wfTwu9ftnDm49Z3tzdxtQ19uvBo0lboeSySy-1QoNUPoL9oRuscog9C5BFvQHAyFIJscJEdnmUXo";




// ── Convert VAPID key to Uint8Array (required by browser API) ─
const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
};

// ── Check if push notifications are supported ─────────────────
export const isPushSupported = () =>
  "serviceWorker" in navigator && "PushManager" in window;

// ── Get current permission state ──────────────────────────────
export const getPermissionState = () => {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission; // "default" | "granted" | "denied"
};

// ── Request permission and subscribe ─────────────────────────
export const subscribeToPush = async (userId) => {
  if (!isPushSupported()) return { success: false, reason: "unsupported" };
  if (VAPID_PUBLIC_KEY === "YOUR_VAPID_PUBLIC_KEY") {
    console.warn("[ProRated] VAPID public key not set");
    return { success: false, reason: "no-vapid-key" };
  }

  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, reason: "denied" };
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Save subscription to Supabase
    await saveSubscriptionToSupabase(subscription, userId);

    return { success: true, subscription };
  } catch (err) {
    console.error("[ProRated] Push subscription failed:", err);
    return { success: false, reason: err.message };
  }
};

// ── Unsubscribe from push ─────────────────────────────────────
export const unsubscribeFromPush = async (userId) => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await deleteSubscriptionFromSupabase(subscription.endpoint, userId);
    }
    return { success: true };
  } catch (err) {
    return { success: false, reason: err.message };
  }
};

// ── Check if currently subscribed ────────────────────────────
export const isSubscribed = async () => {
  try {
    if (!isPushSupported()) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch { return false; }
};

// push_subscriptions RLS allows (auth.uid() = user_id) OR (user_id IS NULL) —
// the anon key satisfies that only when userId is null; a real userId needs
// the user's own token or the row is silently rejected.
const authToken = () => {
  try { return JSON.parse(localStorage.getItem("prorated_session") || "{}").access_token || SUPABASE_ANON_KEY; }
  catch { return SUPABASE_ANON_KEY; }
};

// ── Save subscription to Supabase ─────────────────────────────
const saveSubscriptionToSupabase = async (subscription, userId) => {
  const sub = subscription.toJSON();
  await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey":        SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${userId ? authToken() : SUPABASE_ANON_KEY}`,
      "Prefer":        "return=minimal,resolution=merge-duplicates",
    },
    body: JSON.stringify({
      user_id:  userId || null,
      endpoint: sub.endpoint,
      p256dh:   sub.keys?.p256dh,
      auth:     sub.keys?.auth,
    }),
  });
};

// ── Delete subscription from Supabase ─────────────────────────
const deleteSubscriptionFromSupabase = async (endpoint, userId) => {
  await fetch(
    `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
    {
      method: "DELETE",
      headers: {
        "apikey":        SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${userId ? authToken() : SUPABASE_ANON_KEY}`,
      },
    }
  );
};

// ── Show a local notification (for testing) ───────────────────
export const showTestNotification = async () => {
  if (Notification.permission !== "granted") return;
  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification("ProRated", {
    body:  "🛡️ Push notifications are working! You'll be notified when saved addresses get new reviews.",
    icon:  "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    tag:   "test",
    data:  { url: "/" },
  });
};

// ── Send a push via Supabase Edge Function ────────────────────
// Called server-side when a new review is submitted for a saved address
export const notifyAddressWatchers = async (address, reviewData) => {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/notify-watchers`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ address, reviewData }),
    });
  } catch (err) {
    console.warn("[ProRated] Could not send push to watchers:", err.message);
  }
};
