const CACHE_NAME = 'skyward-jump-v1';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/game.js',
    './js/main.js',
    './js/utils.js',
    './js/assets.js',
    './js/audio.js',
    './manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
