const CACHE_NAME = 'bible-notes-v2';

// Add core static assets here.
const CORE_ASSETS = [
  './index.html',
  './language.js',
  './app logo.PNG',
  './manifest.json',
  './bible_swahili.json?v=2' // Cache busted latest versions
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
  // Exclude external API calls (e.g. Supabase once added)
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // Cache the dynamically fetched responses for offline
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        // Network failed (offline), if we don't have cache, throw raw error
      });

      // Return cached immediately if there is one, else wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
