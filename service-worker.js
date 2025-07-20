const CACHE_NAME = 'oidarwave-v1';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/animations.css',
  '/script.js',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-152.png',
  '/icons/icon-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png',
  '/icons/maskable-icon.png',
  '/icons/monochrome-icon.png'
];

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Cache alle statischen Assets
      await cache.addAll(STATIC_ASSETS);
      // Offline-Seite separat cachen
      const offlineResponse = new Response(
        'Sie sind offline. Bitte überprüfen Sie Ihre Internetverbindung.',
        {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      );
      await cache.put(OFFLINE_URL, offlineResponse);
    })()
  );
  // Force activation
  self.skipWaiting();
});

// Aktivierung und Cache-Cleanup
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Alle alten Caches löschen
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
      // Kontrolle über alle Clients übernehmen
      await clients.claim();
    })()
  );
});

// Fetch-Handler mit Network-First Strategie für Streams
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Streaming-URLs immer vom Netzwerk laden
  if (request.url.includes('stream.') || request.url.includes('.mp3')) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Versuche zuerst vom Netzwerk zu laden
        const networkResponse = await fetch(request);
        
        // Cache aktualisieren
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        
        return networkResponse;
      } catch (error) {
        // Bei Netzwerkfehler aus Cache laden
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Wenn nicht im Cache, zeige Offline-Seite
        if (request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
        
        // Für andere Ressourcen Error werfen
        throw error;
      }
    })()
  );
});

// Background Sync für Favoriten
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/icons/icon-192.png',
    badge: '/icons/monochrome-icon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Öffnen',
        icon: '/icons/checkmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Oidarwave Update', options)
  );
});

// Share Target API Handler
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/share-target/')) {
    event.respondWith(handleShareTarget(event));
  }
});

// Protocol Handler
async function handleProtocol(url) {
  const radioUrl = new URL(url);
  if (radioUrl.protocol === 'web+radio:') {
    // Radiostation-Parameter verarbeiten
    const stationId = radioUrl.pathname.slice(2);
    return Response.redirect('/?station=' + stationId);
  }
}

// Hilfsfunktionen
async function syncFavorites() {
  try {
    const db = await openDB('favorites', 1);
    const unsyncedFavorites = await db.getAll('unsynced');
    
    // Hier könnten die Favoriten mit einem Backend synchronisiert werden
    
    await db.clear('unsynced');
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

async function handleShareTarget(event) {
  const formData = await event.request.formData();
  const mediaData = {
    title: formData.get('name'),
    text: formData.get('description'),
    url: formData.get('link')
  };

  // Shared Daten verarbeiten
  return Response.redirect('/?shared=' + encodeURIComponent(JSON.stringify(mediaData)));
}
