/* ============================================================
   ProRated Service Worker — Bidding Made Better
   Handles caching and offline support
   ============================================================ */

const CACHE_NAME  = "prorated-v7";
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ── Install ───────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ──────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== location.origin) return;
  if (url.hostname.includes("anthropic.com") || url.hostname.includes("supabase.co")) return;

  if (request.mode === "navigate") {
    // Never cache dynamic paths — always fetch fresh from network
    const dynamicPaths = ["/invite/", "/reset-password", "/dashboard", "/company-setup"];
    if (dynamicPaths.some(p => url.pathname.startsWith(p))) {
      event.respondWith(fetch(request).catch(() => caches.match("/")));
      return;
    }
    event.respondWith(
      fetch(request)
        .then(res => { caches.open(CACHE_NAME).then(c => c.put(request, res.clone())); return res; })
        .catch(() => caches.match(request).then(c => c || caches.match(OFFLINE_URL)))
    );
    return;
  }

  if (url.pathname.startsWith("/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(res => {
        if (res.ok) caches.open(CACHE_NAME).then(c => c.put(request, res.clone()));
        return res;
      }))
    );
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

