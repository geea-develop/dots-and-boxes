/* eslint-disable */
// Service worker template. `public/sw.js` is generated from this file at build
// time by scripts/generate-sw.js, which replaces the __PLACEHOLDER__ tokens.
//
// Strategy:
//   - Navigation requests (HTML): network-first, fall back to cached shell so
//     the app opens offline. When online, this also picks up new deployments.
//   - Static assets (Next.js hashed chunks, icons, manifest): cache-first, since
//     their URLs change when content changes.
//   - Versioned cache name keyed on the build id so a new deployment creates a
//     fresh cache and old caches are cleaned up on activate.

const VERSION = "__VERSION__";
const BASE_PATH = "__BASE_PATH__";
const CACHE_NAME = `dots-and-boxes-${VERSION}`;

// Core assets to precache so the app shell works offline on first launch.
const PRECACHE_URLS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/icon-192.png`,
  `${BASE_PATH}/icon-512.png`,
  `${BASE_PATH}/icon.svg`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Use individual adds so one missing asset doesn't fail the whole install.
      Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("dots-and-boxes-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// Allow the page to tell a waiting worker to activate immediately.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests from the same origin.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigation requests: network-first with cache fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(CACHE_NAME);
          return (
            (await cache.match(request)) ||
            (await cache.match(`${BASE_PATH}/`)) ||
            (await cache.match(`${BASE_PATH}/index.html`)) ||
            Response.error()
          );
        }
      })()
    );
    return;
  }

  // Static assets: cache-first, populate cache on miss.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const fresh = await fetch(request);
        if (fresh && fresh.status === 200 && fresh.type === "basic") {
          cache.put(request, fresh.clone());
        }
        return fresh;
      } catch {
        return Response.error();
      }
    })()
  );
});
