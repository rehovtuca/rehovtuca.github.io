// RehoBusiness Manager — Service Worker
// ═══════════════════════════════════════════════════════════════════════
// STRATEGY, on purpose:
// This app gets pushed multiple times a day right now. A service worker
// that aggressively caches HTML is exactly what makes updates invisible —
// visitors (and anyone who's installed the PWA) keep seeing an old version
// until they manually clear their cache. That's the opposite of what you
// want during active development.
//
// So: HTML/navigation requests are NETWORK-FIRST — always try to fetch the
// latest version first, and only fall back to the cached copy if the
// device is offline. Static assets that rarely change (icons, manifest)
// are CACHE-FIRST, since there's no real cost to briefly serving a stale
// icon and it's faster + works offline.
//
// The cache name below is versioned. Bump CACHE_VERSION any time you want
// to force every visitor's old cache to be thrown away on next load —
// though with network-first HTML, you shouldn't usually need to.
// ═══════════════════════════════════════════════════════════════════════

const CACHE_VERSION = 'reho-v1';
const STATIC_CACHE = CACHE_VERSION + '-static';

// Only truly static, rarely-changing files get cache-first treatment.
const STATIC_ASSETS = [
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // activate the new SW immediately, don't wait for old tabs to close
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE) // delete every cache from older versions
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim()) // take control of open tabs immediately
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // never intercept POST/PUT — payments, form submissions, etc.

  const url = new URL(req.url);
  const isStaticAsset = STATIC_ASSETS.some((asset) => url.pathname.endsWith(asset));

  if (isStaticAsset) {
    // Cache-first: fine for icons/manifest, rarely change, no harm being briefly stale.
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
    return;
  }

  // Everything else (HTML, JS, the app itself) — network-first.
  // Always try to get the freshest version; only fall back to cache if offline.
  event.respondWith(
    fetch(req)
      .then((res) => {
        // Optionally stash a copy for offline fallback, but don't let a
        // caching failure break the actual response.
        const resClone = res.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(req, resClone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req)) // offline fallback only
  );
});
