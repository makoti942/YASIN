
const CACHE_NAME = 'pwa-cache-v2';
const urlsToCache = ['/', '/index.html', '/manifest.json', '/makoti-logo.png'];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(e.request).then(response => {
                const fetchPromise = fetch(e.request).then(networkResponse => {
                    cache.put(e.request, networkResponse.clone());
                    return networkResponse;
                });
                return response || fetchPromise;
            });
        })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
