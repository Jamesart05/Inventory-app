// Minimal offline-friendly service worker.
// Strategy: cache the app shell, use network-first for pages/API calls with
// a cache fallback, and cache-first for static assets.

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `inventory-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `inventory-runtime-${CACHE_VERSION}`;

const APP_SHELL = ['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png', '/offline'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // don't cache mutating requests

  const url = new URL(request.url);

  // Never intercept API calls to the backend — always go to network so data
  // stays fresh; fall back to a JSON error only if fully offline.
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'You are offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // Network-first for navigations, falling back to cache/offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((res) => res || caches.match('/offline')))
    );
    return;
  }

  // Cache-first for static assets (JS/CSS/images/fonts).
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
    )
  );
});
