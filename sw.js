const CACHE_NAME = 'bible-notes-v5';

// Add core static assets here.
const CORE_ASSETS = [
  './index.html',
  './language.js',
  './app logo.PNG',
  './manifest.json',
  './bible_swahili.json?v=2',
  './bible_kjv.json?v=2'
];

// On Install, cache the core application shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching App Shell');
        return cache.addAll(CORE_ASSETS);
      })
  );
  self.skipWaiting();
});

// On Activate, clean up old caches if CACHE_NAME increments
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// Fetch events: Network First falling back to Cache (ideal for dynamic JSON data, but fine for shell too)
// Or Cache First falling back to network. We'll use Stale-While-Revalidate for safety.
self.addEventListener('fetch', event => {
  // IMPORTANT: COMPLETELY BYPASS SERVICE WORKER FOR EXTERNAL REQUESTS (Supabase, CDN, etc)
  if (!event.request.url.startsWith(self.location.origin)) {
    return; // Let the browser handle it naturally
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        // Silent fallthrough for network errors
      });

      return cachedResponse || fetchPromise;
    })
  );
});
