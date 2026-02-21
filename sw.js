/* StudyTracker Service Worker (minimal PWA offline support) */

const CACHE_VERSION = 'v58';
const STATIC_CACHE = `studytracker-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `studytracker-runtime-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './src/main.mjs',
  './src/register-sw.mjs',
  './src/app/bootstrap.mjs',
  './src/app/core/state.mjs',
  './src/app/core/ui-state.mjs',
  './src/app/shared/state.mjs',
  './src/app/core/constants.mjs',
  './src/app/core/storage.mjs',
  './src/app/ui/flow.mjs',
  './src/app/ui/events.mjs',
  './src/app/ui/home.mjs',
  './src/app/ui/render.mjs',
  './src/app/ui/confirm-modal.mjs',
  './src/app/features/xp/xp.mjs',
  './src/app/features/timer/timer.mjs',
  './src/app/features/timer/mini-timer.mjs',
  './src/app/features/notes/notes-skilltree-stats.mjs',
  './src/app/features/topics/actions.mjs',
  './src/app/features/achievements/core.mjs',
  './src/app/features/achievements/ui.mjs',
  './src/app/features/achievements/definitions.mjs',
  './src/app/shared/core.mjs',
  './src/app/shared/actions.mjs',
  './src/app/shared/ui.mjs',
  './src/app/features/subject/drafts.mjs',
  './src/app/features/subject/view.mjs',
  './src/app/features/subject/add-modal.mjs',
  './src/app/features/subject/edit-modal.mjs',
  './src/utils/helpers.js',
  './src/utils/initialData.js',
  './manifest.webmanifest',
  './icon.svg',
  './shared-subjects.json'
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
