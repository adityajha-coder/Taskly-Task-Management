const CACHE_NAME = 'taskly-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './favicon-v5.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Only handle same-origin requests
  if (url.origin !== location.origin) return;
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
    return caches.open(CACHE_NAME).then(cache => {
      try { cache.put(e.request, res.clone()); } catch(e){}
      return res;
    });
  }).catch(() => caches.match('./index.html'))));
});
