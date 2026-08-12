import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
// ─────────────────────────────────────────────────────────────
// ProRated — Native push notifications via @capacitor-firebase/messaging
// (bridges APNs<->FCM on iOS internally, so this codebase deals with one
// unified FCM registration token on both platforms).
// ─────────────────────────────────────────────────────────────

// push_tokens' RLS is auth.uid() = user_id, so writes need the real user
// JWT (like src/api/supabase.js's sb() helper) — NOT src/api/db.js's
// dbPost, which only ever sends the anon key and would fail this RLS
// silently (same class of bug already caught once in the announcements
// table's RLS policy).
const sb = async (path, options = {}) => {
  let authToken = SUPABASE_ANON_KEY;
  try {
    const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
    if (session.access_token) authToken = session.access_token;
  } catch {}

  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${authToken}`,
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`Supabase error: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

// ── { receive: 'granted' | 'denied' | 'prompt' } ───────────────────────
export const requestPushPermission = async () => {
  const result = await FirebaseMessaging.requestPermissions();
  return result.receive;
};

export const getPushToken = async () => {
  const result = await FirebaseMessaging.getToken();
  return result.token;
};

export const onPushTokenReceived = (callback) =>
  FirebaseMessaging.addListener("tokenReceived", (event) => callback(event.token));

// Upserts on the token's own unique constraint — covers the common case
// (same user re-registering, or a fresh token for a new user). A device
// changing owners (rare — this app is one-trade-pro-per-device in
// practice) would hit the update-own RLS policy as the NEW user, which
// can't pass auth.uid() = user_id against the OLD owner's row; that write
// fails and is swallowed here rather than left to error the caller, since
// forcing reassignment would need a service-role path for what's an edge
// case, not a real one.
export const savePushToken = async (userId, token, platform) => {
  try {
    await sb(`/push_tokens?on_conflict=token`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ user_id: userId, token, platform, updated_at: new Date().toISOString() }),
    });
  } catch (err) {
    console.warn("[ProRated] Could not save push token:", err.message);
  }
};
