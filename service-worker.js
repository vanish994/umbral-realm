const CACHE = "umbral-realm-playtest-v32";
const SHELL = [
  "./",
  "./index.html",
  "./src/style.css?v=32",
  "./src/game-state.js?v=32",
  "./src/game.js?v=32",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./vendor/phaser/phaser-3.80.1.min.js",
  "./assets/characters/male/Idle/idle.png",
  "./assets/characters/male/Walk/walk.png",
  "./assets/characters/male/Idle/idle_right_down.png",
  "./assets/characters/male/Walk/walk_right_down.png",
  "./assets/characters/female/Idle/Idle.png",
  "./assets/characters/female/Walk/walk.png",
  "./assets/characters/female/Idle/Idle_Right_Down.png",
  "./assets/characters/female/Walk/walk_Right_Down.png",
  "./assets/enemies/zombie-rat/Um_rato_zombie-Idle.png",
  "./assets/npcs/merchant/Um_npc_mercador_estilo_o-Idle.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Navegações tentam a versão publicada primeiro e continuam funcionando offline.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) caches.open(CACHE).then(cache => cache.put("./index.html", response.clone()));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
