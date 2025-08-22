const SW_VERSION = '1';
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', () => { clients.claim(); });
self.addEventListener('fetch', () => {});

