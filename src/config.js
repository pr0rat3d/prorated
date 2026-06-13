// src/config.js — single source of truth for all env vars
// Vite replaces these at build time from .env.local / Vercel env vars
// VITE_ prefix = safe to be in frontend (anon key is designed to be public)
// Non-VITE_ vars = server-side only (service key, admin password)

export const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL     || "https://wsdrbdojnzmtwndswpwr.supabase.co";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const GOOGLE_MAPS_KEY  = import.meta.env.VITE_GOOGLE_MAPS_KEY  || "";
