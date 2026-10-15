const CACHE = "umbral-realm-playtest-v56";
const SHELL = [
  "./",
  "./index.html",
  "./src/style.css?v=56",
  "./src/combat-rules.js?v=56",
  "./src/enemy-rules.js?v=56",
  "./src/item-rules.js?v=56",
  "./src/game-state.js?v=56",
  "./src/world-config.js?v=56",
  "./src/targeting.js?v=56",
  "./src/combat-feedback.js?v=56",
  "./src/animation-rules.js?v=56",
  "./src/game.js?v=56",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./vendor/phaser/phaser-3.80.1.min.js",
  "./assets/characters/male/Idle/idle.png",
  "./assets/characters/male/Walk/walk.png",
  "./assets/characters/male/Idle/idle_right_down.png",
  "./assets/characters/male/Walk/walk_right_down.png",
  "./assets/characters/male/Death/death_normal.png",
  "./assets/characters/male/Attack/knife-attack.png",
  "./assets/characters/male/Shoot/pistol-shoot.png",
  "./assets/characters/female/Idle/Idle.png",
  "./assets/characters/female/Walk/walk.png",
  "./assets/characters/female/Idle/Idle_Right_Down.png",
  "./assets/characters/female/Walk/walk_Right_Down.png",
  "./assets/enemies/zombie-rat/Um_rato_zombie-Idle.png",
  "./assets/enemies/zombie-wolf/idle.png",
  "./assets/enemies/slow-zombie/idle.png",
  "./assets/enemies/scavenger/idle.png",
  "./assets/enemies/mutant/idle.png",
  "./assets/npcs/merchant/Um_npc_mercador_estilo_o-Idle.png",
  "./assets/environment/trail/ground-dark.png",
  "./assets/environment/trail/ground-bleak.png",
  "./assets/environment/trail/ground-urban.png",
  "./assets/environment/trail/ground-refuge.png",
  "./assets/environment/trail/ground-detail.png",
  "./assets/environment/trail/road.png",
  "./assets/environment/trail/edge-bleak-dark.png",
  "./assets/environment/trail/edge-dark-urban.png",
  "./assets/environment/trail/edge-urban-refuge.png",
  "./assets/environment/trail/wall-brick.png",
  "./assets/environment/trail/bush.png",
  "./assets/environment/trail/tires-grass.png",
  "./assets/environment/trail/tire.png",
  "./assets/environment/trail/brick-debris.png",
  "./assets/environment/trail/garbage-bin.png",
  "./assets/environment/trail/barrel-rust-red.png",
  "./assets/environment/trail/destroyed-wall-corner.png",
  "./assets/environment/trail/destroyed-wall.png",
  "./assets/environment/border/tree-spruce.png",
  "./assets/environment/border/tree-spruce-sparse.png",
  "./assets/environment/border/tree-normal.png",
  "./assets/environment/border/tree-big.png",
  "./assets/environment/border/tree-big-pine.png",
  "./assets/environment/border/tree-birch.png",
  "./assets/environment/border/tree-birch-small.png",
  "./assets/environment/border/tree-oak.png",
  "./assets/environment/border/tree-oak-small.png",
  "./assets/environment/border/tree-trunk.png",
  "./assets/environment/border/bush.png",
  "./assets/environment/border/bush-wide.png",
  "./assets/environment/border/grass-tuft-small.png",
  "./assets/environment/border/grass-tuft.png",
  "./assets/environment/border/grass-tuft-low.png",
  "./assets/environment/border/grass-tuft-tall.png",
  "./assets/environment/border/rock-grass.png",
  "./assets/environment/border/stump.png",
  "./assets/environment/border/stump-mushrooms.png",
  "./assets/environment/street/car-wreck.png",
  "./assets/environment/street/car-overturned.png",
  "./assets/environment/street/car-scrap.png",
  "./assets/environment/street/van-wreck.png",
  "./assets/environment/street/truck-wreck.png",
  "./assets/environment/street/motorcycle-wreck.png",
  "./assets/environment/street/street-light-side.png",
  "./assets/environment/street/street-light-up.png",
  "./assets/environment/street/street-light-overgrown.png",
  "./assets/environment/street/bench.png",
  "./assets/environment/street/hydrant.png",
  "./assets/environment/street/trash-can.png",
  "./assets/environment/street/trash-bag.png",
  "./assets/environment/street/traffic-cone.png",
  "./assets/environment/street/stop-sign.png",
  "./assets/environment/street/manhole.png",
  "./assets/environment/street/metal-plates.png",
  "./assets/environment/street/iron-beam.png",
  "./assets/environment/street/pallet.png",
  "./assets/environment/street/cardboard.png",
  "./assets/environment/street/shopping-cart.png",
  "./assets/environment/street/refrigerator.png",
  "./assets/environment/street/washing-machine.png",
  "./assets/environment/street/vending-machine.png",
  "./assets/environment/street/gray-brick.png",
  "./assets/environment/street/gray-brick-debris.png",
  "./assets/environment/street/container.png",
  "./assets/environment/street/exhaust-pipe.png",
  "./assets/ui/panel-border.png",
  "./assets/ui/button-frame.png",
  "./assets/ui/status-bar-frame.png",
  "./assets/ui/vitality-heart.png",
  "./assets/ui/coin.png",
  "./assets/ui-smart/panel-wide.png",
  "./assets/ui-smart/panel-tall.png",
  "./assets/ui-smart/pill.png",
  "./assets/ui-smart/progress-frame.png",
  "./assets/ui-smart/smartphone-frame.png",
  "./assets/ui-smart/button.png",
  "./assets/ui-smart/button-active.png",
  "./assets/ui-smart/vitality.png",
  "./assets/ui-smart/coin.png",
  "./assets/ui-smart/profile-avatar.png",
  "./assets/ui-smart/medkit.png",
  "./assets/ui-smart/bandages.png",
  "./assets/items/knife.png",
  "./assets/items/katana.png",
  "./assets/items/revolver.png",
  "./assets/items/pistol.png",
  "./assets/items/vest.png",
  "./assets/items/helmet.png",
  "./assets/items/pants.png",
  "./assets/audio/knife-stab.mp3",
  "./assets/audio/revolver-shot.mp3",
  "./docs/wasteland-we-are-all-astronauts-main-version-37037-02-20.mp3"
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
