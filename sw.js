// Service Worker for Wedding Invitation PWA
const CACHE_NAME = 'wedding-v5';
const urlsToCache = [
  '/Wedding-Invitation/',
  '/Wedding-Invitation/index.html',
  '/Wedding-Invitation/modern-theme.css',
  '/Wedding-Invitation/retro-theme.css',
  '/Wedding-Invitation/responsive-override.css',
  '/Wedding-Invitation/js/config.js',
  '/Wedding-Invitation/js/minigame.js',
  '/Wedding-Invitation/js/guestbook.js',
  '/Wedding-Invitation/js/fit-text.js',
  '/Wedding-Invitation/manifest.json',
  '/Wedding-Invitation/favicon.ico',
  '/Wedding-Invitation/assets/main.jpg',
  '/Wedding-Invitation/assets/main_retro.png',
  '/Wedding-Invitation/assets/pixel/groom-slash.png',
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(cacheName) {
            return cacheName !== CACHE_NAME;
          })
          .map(function(cacheName) {
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const url = event.request.url;

  if (
    url.includes('manifest-') ||
    url.includes('-Ccl1kXq-') ||
    url.includes('-DubD6iG7') ||
    url.includes('images/main-') ||
    url.includes('assets/manifest-')
  ) {
    event.respondWith(
      new Response('Not Found - Vite build file not needed', {
        status: 404,
        statusText: 'Not Found',
      })
    );
    return;
  }

  const isFreshAsset =
    event.request.destination === 'script' ||
    requestUrl.pathname.endsWith('.js') ||
    requestUrl.pathname.endsWith('.html') ||
    requestUrl.pathname.endsWith('/Wedding-Invitation/');

  if (isFreshAsset) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, copy);
          });
          return response;
        })
        .catch(function() {
          return caches.match(event.request);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
