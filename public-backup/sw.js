// Service Worker for Wedding Invitation PWA
const CACHE_NAME = 'wedding-invitation-v1';
const urlsToCache = [
  '/Wedding-Invitation/',
  '/Wedding-Invitation/index.html',
  '/Wedding-Invitation/styles.css',
  '/Wedding-Invitation/manifest.json',
  '/Wedding-Invitation/assets/hero.png',
  '/Wedding-Invitation/assets/album1.jpg',
  '/Wedding-Invitation/assets/album2.jpg',
  '/Wedding-Invitation/assets/album3.jpg',
  '/Wedding-Invitation/assets/album4.jpg',
  '/Wedding-Invitation/assets/album5.jpg',
  '/Wedding-Invitation/assets/album6.jpg',
  '/Wedding-Invitation/assets/album7.jpg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip Firebase and external API requests
  if (event.request.url.includes('firebaseapp.com') || 
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('gstatic.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/Wedding-Invitation/index.html');
        }
      })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-guestbook') {
    event.waitUntil(syncGuestbook());
  } else if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendance());
  }
});

// Push notification support
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
    icon: '/Wedding-Invitation/icons/icon-192x192.png',
    badge: '/Wedding-Invitation/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '청첩장 보기',
        icon: '/Wedding-Invitation/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/Wedding-Invitation/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('권채린 ❤️ 조영민 청첩장', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/Wedding-Invitation/')
    );
  }
});

// Helper functions for background sync
async function syncGuestbook() {
  // Get pending guestbook entries from IndexedDB
  // Send to Firebase when online
  console.log('Syncing guestbook entries...');
}

async function syncAttendance() {
  // Get pending attendance entries from IndexedDB
  // Send to Firebase when online
  console.log('Syncing attendance entries...');
}