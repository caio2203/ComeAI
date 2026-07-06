/**
 * ComeAI Service Worker.
 *
 * Strategy:
 *  - precache app shell on install (instant cold-start offline)
 *  - cache-first for same-origin static assets (JS/CSS/icons)
 *  - network-first for Gemini / Open Food Facts (fresh data, cache fallback)
 *  - navigation fallback to /index.html so react-router boots any route offline
 *
 * VERSION is stamped at build time (vite.config.js) so every production build
 * gets a unique cache namespace and `activate` drops the previous one — no
 * manual bumping. Falls back to a static token when served unprocessed (dev).
 */

const VERSION = 'comeai-__SW_VERSION__';
const SHELL_CACHE = `shell-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![SHELL_CACHE, RUNTIME_CACHE].includes(k))
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

const isApi = (url) =>
  url.hostname.includes('generativelanguage.googleapis.com') ||
  url.hostname.includes('openfoodfacts.org');

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // SPA navigation fallback: any in-app route resolves to index.html offline so
  // react-router can boot and render the cached shell.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html')),
    );
    return;
  }

  // Network-first for AI + nutrition APIs: users expect fresh data when online,
  // but if the network fails we serve the last cached response so the diary
  // keeps working on a flaky connection.
  if (isApi(url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req)),
    );
    return;
  }

  // Cache-first for shell assets (JS/CSS/icons): instant cold-start offline.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
  }
});
