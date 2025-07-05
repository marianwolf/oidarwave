// Minimaler Service Worker für statische Auslieferung
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open('v1').then(cache =>
      cache.match(event.request).then(resp =>
        resp || fetch(event.request).then(response => {
          // Check if the request URL scheme is not 'chrome-extension:' before caching
          if (event.request.method === 'GET' && response.status === 200 && response.type === 'basic' && event.request.url.startsWith('chrome-extension:') === false) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
      )
    )
  );
});