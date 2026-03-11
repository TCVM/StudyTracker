/* StudyTracker Service Worker (minimal PWA offline support) */

const CACHE_VERSION = 'v68';
const STATIC_CACHE = `studytracker-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `studytracker-runtime-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './styles/00-base.css',
  './styles/05-components.css',
  './styles/06-animations.css',
  './styles/07-responsive.css',
  './styles/10-home.css',
  './styles/15-shared.css',
  './styles/20-exams-practices.css',
  './styles/25-timer.css',
  './styles/27-sessions.css',
  './styles/32-subject-topics.css',
  './styles/33-map-stats-achievements.css',
  './styles/30-subject-modals.css',
  './styles/35-notes-skilltree.css',
  './styles/40-theme-dark.css',
  './styles/41-theme-compat.css',
  './src/main.mjs',
  './src/register-sw.mjs',
  './src/app/bootstrap.mjs',
  './src/app/core/state.mjs',
  './src/app/core/ui-state.mjs',
  './src/app/shared/state.mjs',
  './src/app/core/constants.mjs',
  './src/app/core/storage.mjs',
  './src/app/core/idb.mjs',
  './src/app/ui/flow.mjs',
  './src/app/ui/events.mjs',
  './src/app/ui/home.mjs',
  './src/app/ui/render.mjs',
  './src/app/ui/confirm-modal.mjs',
  './src/app/ui/prompt-modal.mjs',
  './src/app/ui/thumbs.mjs',
  './src/app/ui/image-viewer.mjs',
  './src/app/features/xp/xp.mjs',
  './src/app/features/timer/timer.mjs',
  './src/app/features/timer/mini-timer.mjs',
  './src/app/features/notes/notes-skilltree-stats.mjs',
  './src/app/features/topics/actions.mjs',
  './src/app/features/topic-notes/topic-notes.mjs',
  './src/app/features/exams/exams.mjs',
  './src/app/features/exams/answers-modal.mjs',
  './src/app/features/practices/practices.mjs',
  './src/app/features/practices/answers-modal.mjs',
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

  const isCodeAsset =
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.endsWith('.mjs') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css');

  // Same-origin assets:
  // - code assets: network-first to avoid "blank screens" from mixed cached versions
  // - others: stale-while-revalidate (fast + updates without manual refresh)
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);

        if (isCodeAsset) {
          try {
            const network = await fetch(request);
            cache.put(request, network.clone());
            return network;
          } catch {
            const cached = await caches.match(request);
            if (cached) return cached;
            return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
          }
        } else {
          const cached = await caches.match(request);
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
        }
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
