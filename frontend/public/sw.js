const CACHE_NAME = 'app-cache-v2';
const APP_SHELL = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => !k.includes(CACHE_NAME)).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const reqUrl = new URL(event.request.url);
  const sameOrigin = reqUrl.origin === self.location.origin;

  // Bypass requests to other origins
  if (!sameOrigin) return;

  // Bypass sensitive auth routes
  const authBypass = ['/login', '/google-login', '/google-callback'].some((p) =>
    reqUrl.pathname.startsWith(p)
  );
  if (authBypass) return;

  event.respondWith((async () => {
    try {
      const net = await fetch(event.request);
      return net;
    } catch (err) {
      if (event.request.method === 'GET') {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);
        if (cached) return cached;
      }
      throw err;
    }
  })());
});
