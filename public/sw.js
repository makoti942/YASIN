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
