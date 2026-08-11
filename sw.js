/* clip2md service worker — offline shell cache. Bump CACHE on any asset change. */
var CACHE = 'clip2md-v2';
var ASSETS = [
  './',
  './index.html',
  './icon.svg',
  './manifest.webmanifest',
  './vendor/turndown.js',
  './vendor/turndown-plugin-gfm.js',
  './vendor/marked.umd.js',
  './vendor/purify.min.js',
  './vendor/fonts/Geist-Variable.woff2',
  './vendor/fonts/GeistMono-Variable.woff2'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        // Runtime-cache same-origin successful responses.
        if (res && res.ok && e.request.url.indexOf(self.location.origin) === 0) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return caches.match('./index.html'); });
    })
  );
});
