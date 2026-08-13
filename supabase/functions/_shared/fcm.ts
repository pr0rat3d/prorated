// ─────────────────────────────────────────────────────────────
// ProRated — FCM v1 send helper, shared by any edge function that
// needs to push to a device. No SDK, matching this codebase's
// fetch-only house style (same as notify-watchers/send-reengagement-
// nudge's Resend calls). Legacy FCM server-key auth is long dead —
// v1 requires an OAuth2 Bearer token minted from a Google service-
// account JSON via a hand-signed RS256 JWT.
// ─────────────────────────────────────────────────────────────

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

function base64url(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    der.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

// Cached per warm isolate — never assume it survives a cold start, so
// this stays unconditional at the top of every send path.
async function getFcmAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) return cachedToken.value;

  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const signingInput =
    `${base64url(new TextEncoder().encode(JSON.stringify(header)))}.` +
    `${base64url(new TextEncoder().encode(JSON.stringify(claims)))}`;

  const key = await importPrivateKey(sa.private_key);
  const sig = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(signingInput),
  );
  const jwt = `${signingInput}.${base64url(new Uint8Array(sig))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`FCM OAuth token exchange failed: ${res.status} ${await res.text()}`);

  const { access_token, expires_in } = await res.json();
  cachedToken = { value: access_token, expiresAt: now + expires_in };
  return access_token;
}

export interface PushResult {
  ok: boolean;
  errorCode?: string;
  deadToken?: boolean;
}

// Sends one push to one device token. `data` values must all be strings —
// FCM v1 requires map<string,string>, non-strings 400.
export async function sendPush(
  sa: ServiceAccount,
  token: string,
  { title, body, data }: { title: string; body: string; data?: Record<string, string> },
): Promise<PushResult> {
  const accessToken = await getFcmAccessToken(sa);

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: data || {},
          android: { priority: "HIGH" },
          apns: { payload: { aps: { sound: "default" } } },
        },
      }),
    },
  );

  if (res.ok) return { ok: true };

  const errBody = await res.json().catch(() => ({}));
  const errorCode = errBody?.error?.details?.find((d: any) => d["@type"]?.includes("FcmError"))?.errorCode;
  console.error("[ProRated] FCM send failed:", res.status, errorCode || errBody?.error?.message);
  return {
    ok: false,
    errorCode,
    // UNREGISTERED = app uninstalled or fresh install issued a new token.
    // INVALID_ARGUMENT = malformed token string. Both safe to prune.
    // Anything else (SENDER_ID_MISMATCH, QUOTA_EXCEEDED, etc.) is a config
    // or transient issue, not a dead token - don't delete on those.
    deadToken: errorCode === "UNREGISTERED" || errorCode === "INVALID_ARGUMENT",
  };
}

export function getServiceAccount(): ServiceAccount {
  const raw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not set");
  return JSON.parse(raw);
}
