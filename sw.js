/* StudyTracker Service Worker (minimal PWA offline support) */

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `studytracker-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `studytracker-runtime-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(STATIC_ASSETS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) return caches.delete(key);
          return Promise.resolve();
        })
      );
      await self.clients.claim();
    })()
  );
});

function isNavigationRequest(request) {
  if (request.mode === 'navigate') return true;
  if (request.method !== 'GET') return false;
  const accept = request.headers.get('accept');
  return Boolean(accept && accept.includes('text/html'));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  // App shell: network-first for HTML so updates land quickly, fallback to cache offline.
  if (isNavigationRequest(request)) {
    event.respondWith(
      (async () => {
        try {
          const network = await fetch(request);
          const cache = await caches.open(STATIC_CACHE);
          cache.put('./index.html', network.clone());
          return network;
        } catch {
          const cached = await caches.match('./index.html');
          if (cached) return cached;
          return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        }
      })()
    );
    return;
  }

  const url = new URL(request.url);

  // Same-origin assets: stale-while-revalidate (fast + updates without manual refresh).
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        const cache = await caches.open(STATIC_CACHE);

        const fetchPromise = fetch(request)
          .then((response) => {
            cache.put(request, response.clone());
            return response;
          })
          .catch(() => null);

        if (cached) {
          event.waitUntil(fetchPromise);
          return cached;
        }

        const network = await fetchPromise;
        if (network) return network;
        return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      })()
    );
    return;
  }

  // Runtime cache for Google Fonts (best-effort).
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((response) => {
            cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })()
    );
  }
});
