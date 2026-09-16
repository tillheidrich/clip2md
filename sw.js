/* clip2md service worker.
   Pages (navigations, .html): network first, cache only as offline fallback —
   so new or changed pages are never frozen for existing users.
   Static assets (vendor, fonts, icons): cache first. Bump CACHE on asset changes. */
var CACHE = 'clip2md-v7';
var ASSETS = [
  '/',
  '/index.html',
  '/impressum.html',
  '/datenschutz.html',
  '/legal.css',
  '/icon.svg',
  '/icon-192.png',
  '/apple-touch-icon.png',
  '/manifest.webmanifest',
  '/vendor/turndown.js',
  '/vendor/turndown-plugin-gfm.js',
  '/vendor/marked.umd.js',
  '/vendor/purify.min.js',
  '/vendor/Readability.js',
  '/clean.js',
  '/vendor/fonts/space-grotesk-latin-400-normal.woff2',
  '/vendor/fonts/space-grotesk-latin-500-normal.woff2',
  '/vendor/fonts/space-grotesk-latin-700-normal.woff2',
  '/vendor/fonts/space-mono-latin-400-normal.woff2',
  '/vendor/fonts/space-mono-latin-700-normal.woff2'
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

function isPage(req, url) {
  return req.mode === 'navigate' || req.destination === 'document' || /\.html$/.test(url.pathname) || url.pathname === '/';
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // external links (PayPal, GitHub) untouched

  if (isPage(req, url)) {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match(url.pathname.replace(/\/$/, '/index.html')) || caches.match('/index.html');
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      });
    })
  );
});
