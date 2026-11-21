// Signal Line offline cache. Change VERSION whenever you upload a new index.html.
const VERSION = 'signal-line-v20';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const font = FONT_HOSTS.includes(url.hostname);
  if (url.origin !== location.origin && !font) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req, {ignoreSearch: !font});
    const fresh = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; });
    if (hit) { if (!font) fresh.catch(() => {}); else fresh.catch(() => {}); return hit; }
    try { return await fresh; }
    catch (err) { if (req.mode === 'navigate') { const page = await cache.match('./index.html'); if (page) return page; } throw err; }
  }));
});
