const CACHE_NAME = 'nexusfleet-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './login.html',
  './styles.css',
  './app.js',
  './seed_data.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.warn('PWA Cache Warning', err));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // BYPASS CACHE DURANTE DESENVOLVIMENTO
  // Força o navegador a buscar sempre a versão mais recente do servidor
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
