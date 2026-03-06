const CACHE_NAME = 'taskly-cache-v6';
const CDN_CACHE = 'taskly-cdn-v5';

const CORE_ASSETS = [
  './',
  './index.html',
  './widget.html',
  './manifest.json',
  './favicon-v5.svg',
  './css/base.css',
  './css/components.css',
  './css/dashboard.css',
  './js/utils.js',
  './js/Dashboard.js',
  './js/TaskManager.js',
  './js/AlarmManager.js',
  './js/app.js',
  './widget/widget.css',
  './widget/widget.js'
];

const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.0/Sortable.min.js',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', e => {
  e.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(c => c.addAll(CORE_ASSETS)),
      caches.open(CDN_CACHE).then(c => c.addAll(CDN_ASSETS))
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== CDN_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (e.request.method !== 'GET') return;

  if (url.origin === self.location.origin && (e.request.mode === 'navigate' || url.pathname.endsWith('.html'))) {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return resp;
      }))
    );
    return;
  }

  if (url.hostname.includes('cdn') || url.hostname.includes('fonts')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const fetchPromise = fetch(e.request).then(r => {
          const clone = r.clone();
          caches.open(CDN_CACHE).then(c => c.put(e.request, clone));
          return r;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
