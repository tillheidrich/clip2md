/* clip2md service worker.
   Pages (navigations, .html): network first, cache only as offline fallback —
   so new or changed pages are never frozen for existing users.
   Static assets (vendor, fonts, icons): cache first. Bump CACHE on asset changes. */
var CACHE = 'clip2md-v11';
var ASSETS = [
  '/',
  '/index.html',
  '/impressum.html',
  '/datenschutz.html',
  '/imprint.html',
  '/privacy.html',
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
  // Cache each asset on its own: with addAll a single missing file fails the whole
  // install, the worker is discarded and the app silently loses offline support.
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(ASSETS.map(function (a) {
      return c.add(a)['catch'](function () {});
    }));
  }));
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

// Last resort for a page request: never hand respondWith an empty value — Safari
// turns that into "FetchEvent.respondWith received an error: Returned response is null"
// and the site looks broken even though the server is fine.
var OFFLINE_PAGE = [
  '<!doctype html><html lang="de"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<title>clip2md</title><style>',
  'body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;',
  'background:#EAEAE3;color:#16150F;font:16px/1.6 system-ui,-apple-system,sans-serif;padding:24px}',
  'main{max-width:34rem;text-align:center}h1{font-size:1.5rem;margin:0 0 .6rem}',
  'p{margin:0 0 1rem;color:#6A685D}a{color:#1B3BE0}',
  '@media(prefers-color-scheme:dark){body{background:#16181f;color:#f2f2ee}p{color:#a8a79c}a{color:#8aa2ff}}',
  '</style></head><body><main><h1>Keine Verbindung</h1>',
  '<p>clip2md ist offline und liegt noch nicht vollständig auf diesem Gerät. ',
  'Sobald du wieder online bist, lädt die Seite normal.<br>',
  '<span lang="en">clip2md is offline and not fully stored on this device yet. ',
  'It will load normally once you are back online.</span></p>',
  '<p><a href="/?fresh">Neu laden / Reload</a></p></main></body></html>'
].join('');

function offlinePage() {
  return new Response(OFFLINE_PAGE, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

function put(req, res) {
  if (!res || !res.ok) return;
  var copy = res.clone();
  caches.open(CACHE).then(function (c) { c.put(req, copy); })['catch'](function () {});
}

// Page fallback chain, resolved step by step: a bare `a || caches.match(b)` would
// hand back a pending promise that can still resolve to undefined.
function pageFallback(req) {
  return caches.match(req).then(function (hit) {
    if (hit) return hit;
    return caches.match('/index.html');
  }).then(function (hit) {
    if (hit) return hit;
    return caches.match('/');
  }).then(function (hit) {
    return hit || offlinePage();
  })['catch'](function () { return offlinePage(); });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return; // external links (PayPal, GitHub) untouched

  if (isPage(req, url)) {
    // One retry before giving up: in Safari the very first navigation right after a
    // worker takes over can fail outright, which would otherwise show the offline page
    // (or, before v10, break the navigation) even though the network is fine.
    e.respondWith(
      fetch(req).then(function (res) {
        if (!res) throw new Error('empty');
        return res;
      })['catch'](function () {
        return new Promise(function (resolve) { setTimeout(resolve, 400); })
          .then(function () { return fetch(req); });
      }).then(function (res) {
        if (!res) return pageFallback(req);
        put(req, res);
        return res;
      })['catch'](function () { return pageFallback(req); })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        put(req, res);
        return res || Response.error();
      })['catch'](function () {
        return caches.match(req).then(function (h) { return h || Response.error(); });
      });
    })['catch'](function () { return Response.error(); })
  );
});
