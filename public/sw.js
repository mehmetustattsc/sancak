/* Sancak service worker: ilk açılıştan sonra internetsiz çalışır. Yeni sürümde VERSION değişir. */
const VERSION = 'sancak-__BUILD__';
const FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.origin !== location.origin) { // yazı tipleri: önce önbellek
    e.respondWith(caches.open(VERSION).then(c => c.match(e.request).then(r => r || fetch(e.request).then(n => { c.put(e.request, n.clone()); return n; }).catch(() => r))));
    return;
  }
  // oyun dosyaları: önce ağ (güncel sürüm), yoksa önbellek
  e.respondWith(fetch(e.request).then(n => { const cp = n.clone(); caches.open(VERSION).then(c => c.put(e.request, cp)); return n; }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
