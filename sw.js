// MediCore Hub — Service Worker v1.0
const CACHE_NAME = 'medicorehub-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app/pages/login.html',
  '/app/pages/register.html',
  '/app/pages/reset-password.html',
  '/app/pages/onboarding.html',
  '/app/pages/dashboard.html',
  '/app/pages/settings.html',
  '/app/css/app.css',
  '/app/js/app.js',
  '/app/js/db.js',
  '/css/main.css',
  '/js/main.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap',
  'https://unpkg.com/lucide@latest/dist/umd/lucide.js'
];

// Install — cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS.filter(url => !url.startsWith('https://')));
    }).then(() => self.skipWaiting())
  );
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network-first with cache fallback
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => {
        if (cached) return cached;
        if (event.request.destination === 'document') {
          return caches.match('/app/pages/dashboard.html');
        }
      }))
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-patient-data') {
    event.waitUntil(syncPatientData());
  }
});

async function syncPatientData() {
  // Placeholder for real background sync logic
  console.log('[SW] Background sync: patient data');
}

// Push notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'MediCore Hub', {
      body: data.body || 'You have a new notification',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: data.tag || 'medicore-notification',
      data: { url: data.url || '/app/pages/dashboard.html' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
