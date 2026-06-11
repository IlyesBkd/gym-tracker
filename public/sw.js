const CACHE_NAME = 'gym-tracker-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || fetched;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TIMER_UPDATE') {
    const { remaining, duration } = event.data;

    if (remaining > 0) {
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      self.registration.showNotification('Temps de repos', {
        body: `${display} restant`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'rest-timer',
        requireInteraction: false,
        silent: true,
        data: { remaining, duration }
      });
    } else {
      self.registration.showNotification('Repos terminé !', {
        body: 'C\'est parti pour la prochaine série',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'rest-timer',
        requireInteraction: true,
        vibrate: [200, 100, 200]
      });
    }
  }

  if (event.data && event.data.type === 'TIMER_STOP') {
    self.registration.getNotifications({ tag: 'rest-timer' }).then(notifications => {
      notifications.forEach(notification => notification.close());
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
