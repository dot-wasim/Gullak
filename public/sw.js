// Gullak Service Worker - Network-first for HTML, Cache for offline assets
const CACHE_NAME = 'gullak-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/piggy-bank.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// If running in Capacitor native app (localhost), unregister self and clear all caches
if (self.location.hostname === 'localhost' || self.location.protocol === 'capacitor:') {
  self.registration.unregister().then(() => {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  });
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Do not intercept on localhost / native Capacitor
  if (self.location.hostname === 'localhost' || self.location.protocol === 'capacitor:') {
    return;
  }

  // Do not cache API requests
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Network-first strategy for HTML navigation
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((res) => res || caches.match('/index.html')))
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
