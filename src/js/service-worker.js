const CACHE_NAME = 'oidarwave';
const urlsToCache = [
    '/',
    '/index.html',
    '/src/css/style.css',
    '/src/js/mouse.js',
    '/src/js/cookie.js',
    '/src/js/player.js',
    '/favicon.svg',
    '/manifest.webmanifest',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    if (urlsToCache.some(url => event.request.url.includes(url))) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request);
                })
        );
    }
    else {
        event.respondWith(fetch(event.request));
    }
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});