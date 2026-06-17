// Service Worker: macht die App installierbar und laedt die eigenen Dateien
// auch offline schnell. Karten-Tiles/CDN laufen weiter ueber das Netz.
const CACHE = "focusflight-v1";
const ASSETS = [
  "./", "./index.html", "./style.css",
  "./geo.js", "./data.js", "./map.js", "./app.js",
  "./manifest.webmanifest", "./icon-192.png", "./icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Nur eigene Dateien aus dem Cache bedienen; alles andere normal aus dem Netz
  if (url.origin === location.origin) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
  }
});
