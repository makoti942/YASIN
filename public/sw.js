/* eslint-disable no-restricted-globals */
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

const HOUR_IN_SECONDS = 60 * 60;
const DAY_IN_SECONDS = 24 * HOUR_IN_SECONDS;
const MONTH_IN_SECONDS = 30 * DAY_IN_SECONDS;

// eslint-disable-next-line no-underscore-dangle
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache an array of specified pages
self.addEventListener('install', event => {
    const PRE_CACHE_URLS = [
        '/about',
        '/account/deposit',
        '/account/withdrawal',
        '/dtrader',
        '/smarttrader',
        '/bot',
        '/reports/positions',
        '/cashier/deposit',
        '/cashier/withdrawal',
        '/cashier/payment-agent-transfer',
    ];

    event.waitUntil(
        caches.open('pre-cache-urls').then(cache => {
            cache.addAll(PRE_CACHE_URLS);
        })
    );
});

// Cache Deriv PWA images
registerRoute(
    /^https?:\/\/deriv-com\.s3\.ap-southeast-1\.amazonaws\.com\/deriv-pwa\/.+\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/,
    new CacheFirst({
        cacheName: 'deriv-pwa-images',
        plugins: [
            new ExpirationPlugin({
                maxAgeSeconds: MONTH_IN_SECONDS,
                maxEntries: 100,
            }),
        ],
    })
);

// Stale-while-revalidate strategy for CSS, JS, and web workers.
registerRoute(
    ({ request }) => request.destination === 'style' || request.destination === 'script' || request.destination === 'worker',
    new StaleWhileRevalidate({
        cacheName: 'assets',
        plugins: [
            new ExpirationPlugin({
                maxAgeSeconds: DAY_IN_SECONDS,
            }),
        ],
    })
);

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Don't care about other-origin URLs
    if (url.origin !== self.location.origin) return;

    // Don't care about WebSocket connections
    if (url.protocol === 'ws:' || url.protocol === 'wss:') return;

    // Let the browser do its default thing
    // for non-GET requests.
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(response => {
            // Return the cached response if it exists
            if (response) {
                return response;
            }
            // If the request is not in the cache, fetch it from the network
            return fetch(event.request).then(networkResponse => {
                // Cache the fetched response for future use
                return caches.open('dynamic-cache').then(cache => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});
