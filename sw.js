// 旅行日誌 — Service Worker
// Bump this version whenever any cached file changes, to force an update.
const CACHE_VERSION = 'v5';
const CACHE_NAME = `travel-journal-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/variables.css',
  './css/base.css',
  './css/layout.css',
  './css/navigation.css',
  './css/content.css',
  './css/states.css',
  './css/modal.css',
  './css/detail.css',
  './css/toast.css',
  './css/login.css',
  './css/responsive.css',
  './js/auth.js',
  './js/config.js',
  './js/state.js',
  './js/utils.js',
  './js/api.js',
  './js/filters.js',
  './js/render.js',
  './js/form.js',
  './js/detail.js',
  './js/main.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

// Allow the page to tell a waiting worker to activate immediately,
// instead of waiting for all tabs of the old version to close.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install: pre-cache the app shell so the site can launch offline.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate: drop any caches from older versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('travel-journal-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - Navigation requests (loading a page): network first, falling back to the
//   cached shell when offline, so new deploys are picked up automatically
//   whenever there's a connection.
// - Other same-origin requests (css/js/images): cache first, then network,
//   caching whatever comes back for next time.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 字型、API 等跨網域請求不處理

  // 網路優先：有網路就一律拿最新的，並更新快取；斷線才用快取
  event.respondWith(
    fetch(req, { cache: 'no-cache' })   // no-cache：略過瀏覽器 HTTP 快取
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((res) =>
          res || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())
        )
      )
  );
});