// Minimaler Service Worker für statische Auslieferung
self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open('v1').then(cache =>
      cache.match(event.request).then(resp =>
        resp || fetch(event.request).then(response => {
          if (event.request.method === 'GET' && response.status === 200 && response.type === 'basic') {
            cache.put(event.request, response.clone());
          }
          return response;
        })
      )
    )
  );
});
