const CACHE_NAME = 'nexusfleet-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './login.html',
  './styles.css',
  './app.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Usamos catch para ignorar falhas no pre-cache de arquivos soltos durante dev
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.warn('PWA Cache Warning', err));
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
