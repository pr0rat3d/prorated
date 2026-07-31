import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
// ─────────────────────────────────────────────────────────────
// ProRated — Saved-address watcher notifications
//
// Previously Web Push (browser Notification/PushManager API) — retired
// since there was no real delivery path inside the native iOS/Android
// apps (no APNs/FCM integration). notify-watchers now emails watchers
// via Resend instead; this is just the client-side trigger.
// ─────────────────────────────────────────────────────────────

// ── Notify watchers via Supabase Edge Function ────────────────
// Called when a new review is submitted for an address
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
    console.warn("[ProRated] Could not notify watchers:", err.message);
  }
};
