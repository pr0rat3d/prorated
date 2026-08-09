// src/config.js — single source of truth for all env vars
// Vite replaces these at build time from .env.local / Vercel env vars
// VITE_ prefix = safe to be in frontend (anon key is designed to be public)
// Non-VITE_ vars = server-side only (service key, admin password)

// Native builds (Capacitor) serve the bundled app from a local WebView origin
// (capacitor://localhost on iOS, https://localhost on Android) — there is no
// server.url override in capacitor.config.json. A relative fetch("/api/...")
// resolves against that local origin, not the deployed site, and never reaches
// the Vercel serverless functions. Any fetch to our own /api/* routes must use
// this absolute origin so it works identically in the PWA and in native builds.
// (The corresponding /api/* handler must send Access-Control-Allow-Origin, since
// this becomes a cross-origin request from native.)
export const API_BASE = "https://prorated.app";

export const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL     || "https://wsdrbdojnzmtwndswpwr.supabase.co";
// Fallback anon key mirrors the URL fallback above — this is the public anon key
// (already shipped in the live web bundle), not a secret. Without this fallback,
// a native build assembled on a machine missing VITE_SUPABASE_ANON_KEY silently
// ships with an empty apikey header, which Supabase rejects on every request
// (login included) with a generic auth error.
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZHJiZG9qbnptdHduZHN3cHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NzI3OTgsImV4cCI6MjA5NTA0ODc5OH0.2PJv-XQUjmbMhzaXkZSjWzCeDUtTWAmcAvobjJymQDs";
// Fallback mirrors the pattern above — this is a browser key, already public
// in the live web bundle. Without it, a native build assembled on a machine
// missing VITE_GOOGLE_MAPS_KEY silently ships with an empty key, and the
// Places Autocomplete widget fails every request with no visible error.
export const GOOGLE_MAPS_KEY  = import.meta.env.VITE_GOOGLE_MAPS_KEY  || "AIzaSyDGyKCCzTn6_sCLL1oIPP81uJ8uJM8g7BE";
// RevenueCat public iOS SDK key (client-side, safe to ship — same class of key as
// the two above, and RevenueCat's own docs confirm public API keys are meant to be
// embedded in app binaries). Fallback follows the same pattern as
// SUPABASE_ANON_KEY/GOOGLE_MAPS_KEY, so Codemagic builds (which don't reliably pass
// VITE_* env vars) don't silently ship an empty key and break IAP configure().
export const REVENUECAT_IOS_KEY = import.meta.env.VITE_REVENUECAT_IOS_KEY || "appl_AtTgtpoEMHQliHOdkbemBVheIOQ";
// RevenueCat public Android SDK key — same class of key as REVENUECAT_IOS_KEY
// above (safe to embed, not a secret). Google Play app + products are now
// configured in RevenueCat, so isNativeIAPReady() will start returning true
// on Android as soon as a build with this key ships.
export const REVENUECAT_ANDROID_KEY = import.meta.env.VITE_REVENUECAT_ANDROID_KEY || "goog_dAJTzwYeTMVJYtFpRqspXRMJsRX";
