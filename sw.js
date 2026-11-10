// Service worker de Bicips — PASO 1 (instalable).
// Estrategia "red primero": con internet SIEMPRE se carga la versión más nueva
// (pregunta al servidor si ha cambiado, sin usar la caché del navegador),
// así ya no hace falta Ctrl+Shift+R. Sin internet abre la última copia guardada
// del programa (los datos de Supabase siguen necesitando conexión por ahora).
const CACHE = 'bicips-app-v8';
const BASE = ['./', './index.html', './reservas.css', './taller.css', './movil.css',
  './db.js', './reservas.js', './taller-merged.js', './mensajes.js', './qr-engine.js',
  './manifest.webmanifest', './icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, CDN… van directos
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(res => {
      if (res && res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })
      .then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
