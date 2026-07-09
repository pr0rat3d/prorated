// src/config.js — single source of truth for all env vars
// Vite replaces these at build time from .env.local / Vercel env vars
// VITE_ prefix = safe to be in frontend (anon key is designed to be public)
// Non-VITE_ vars = server-side only (service key, admin password)

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
