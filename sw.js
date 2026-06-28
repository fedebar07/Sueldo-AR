const CACHE = 'sueldo-ar-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;600;700&family=Inter:wght@400;500;600&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js',
];

// Instalación: pre-cachear assets principales
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activación: limpiar caches viejas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first para assets, network-first para el resto
self.addEventListener('fetch', e => {
  // Solo interceptar GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(response => {
        // Cachear respuestas válidas de nuestro origen y CDNs conocidos
        if (response && response.status === 200) {
          const url = e.request.url;
          if (
            url.includes('jsdelivr.net') ||
            url.includes('fonts.googleapis.com') ||
            url.includes('fonts.gstatic.com') ||
            url.startsWith(self.location.origin)
          ) {
            const clone = response.clone();
            caches.open(CACHE).then(cache => cache.put(e.request, clone));
          }
        }
        return response;
      }).catch(() => cached); // Si falla la red, devolver caché si existe
    })
  );
});
