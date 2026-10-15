((root, factory) => {
  const config = factory();
  if (typeof module === "object" && module.exports) module.exports = config;
  root.UmbralWorld = config;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const world = { width: 2500, height: 900 };
  const playerSpawn = { x: 190, y: 450 };
  const merchant = { x: 2310, y: 430 };
  const campfire = { x: 2260, y: 485 };
  const safeZoneX = 2200;
  const areas = [
    { id: "outskirts", name: "SUBÚRBIO INFECTADO", startX: 0, endX: 780, ground: "ground-bleak" },
    { id: "wilds", name: "MATA DAS RUÍNAS", startX: 780, endX: 1580, ground: "ground-dark" },
    { id: "urban", name: "ZONA URBANA MORTA", startX: 1580, endX: safeZoneX, ground: "ground-urban" },
    { id: "refuge", name: "CLAREIRA DO REFÚGIO", startX: safeZoneX, endX: world.width, ground: "ground-refuge" }
  ];

  // Transicoes de piso entre areas: dither de 96 px centrado na divisa, no lugar
  // das linhas pretas que o graphics desenhava. Precisa casar com a ordem de
  // areas acima (oeste -> leste).
  const areaEdges = [
    { x: areas[1].startX, key: "edge-bleak-dark", width: 96 },
    { x: areas[2].startX, key: "edge-dark-urban", width: 96 },
    { x: areas[3].startX, key: "edge-urban-refuge", width: 96 }
  ];

  // Estrada de terra batida que atravessa o mapa. Fica centrada em y=450 e nao
  // tem colisao: e so leito, o jogador anda por cima.
  const road = { key: "road", x: 0, y: 386, width: world.width, height: 128 };

  const enemySpawns = [
    { id: "rat-1", x: 260, y: 420 }, { id: "rat-1b", x: 385, y: 520 },
    { id: "rat-2", x: 550, y: 365 }, { id: "rat-2b", x: 700, y: 485 },
    { id: "wolf-5", x: 900, y: 390 }, { id: "wolf-5b", x: 1050, y: 535 },
    { id: "wolf-6", x: 1260, y: 365 }, { id: "wolf-6b", x: 1470, y: 500 },
    { id: "slow-zombie-10", x: 1660, y: 380 }, { id: "slow-zombie-10b", x: 1810, y: 540 },
    { id: "slow-zombie-11", x: 1990, y: 360 }, { id: "slow-zombie-12", x: 2140, y: 500 },
    // Faixa de elite: dois saqueadores acampados nos flancos da estrada e o mutante guardando o portão.
    // O mutante fica a oeste de safeZoneX menos sua área de contato, para o refúgio continuar seguro.
    // A ordem desta lista precisa continuar igual à ordem de EnemyRules.ENEMIES (índice usado pelo save).
    { id: "scavenger-18", x: 2060, y: 620 }, { id: "scavenger-20", x: 2105, y: 300 },
    { id: "mutant-30", x: 2155, y: 400 }
  ];

  // ---------------------------------------------------------------------------
  // Cinturao de mata das bordas
  // ---------------------------------------------------------------------------
  // Retangulos de colisao que fecham as quatro bordas do mapa. O jogador nao
  // alcanca nenhuma beirada: a mata e a barreira, nao o clamp de coordenadas do
  // movePlayer. A folhagem de cada faixa fica dentro do proprio retangulo (os
  // testes medem sprite por sprite contra estes numeros).
  const borderBands = [
    { id: "north", border: true, x: 0, y: 0, w: world.width, h: 128 },
    { id: "south", border: true, x: 0, y: 754, w: world.width, h: 146 },
    { id: "west", border: true, x: 0, y: 0, w: 150, h: world.height },
    { id: "east", border: true, x: 2360, y: 0, w: 140, h: world.height }
  ];

  // Ruinas: paredes de tijolo do pack (o desenho segue estes retangulos).
  const ruins = [
    { x: 350, y: 120, w: 224, h: 32 }, { x: 350, y: 152, w: 32, h: 128 },
    { x: 610, y: 650, w: 160, h: 32 },
    { x: 928, y: 125, w: 256, h: 32 }, { x: 1152, y: 157, w: 32, h: 128 },
    { x: 1312, y: 650, w: 192, h: 32 },
    { x: 1660, y: 110, w: 256, h: 32 }, { x: 1660, y: 142, w: 32, h: 128 },
    { x: 1922, y: 665, w: 224, h: 32 }, { x: 2112, y: 570, w: 32, h: 96 }
  ];

  const solids = [...ruins, ...borderBands];

  const TREE_SHORT = ["tree-spruce", "tree-spruce-sparse", "tree-normal"];
  const TREE_TALL = ["tree-big", "tree-big-pine", "tree-birch", "tree-oak", "tree-oak-small", "tree-birch-small"];
  const UNDERGROWTH = ["bush", "bush-wide", "grass-tuft", "grass-tuft-low", "grass-tuft-tall", "grass-tuft-small", "rock-grass"];

  // Gerador congruente linear: a mata e sempre a mesma em toda execucao, o que
  // permite testar posicao, escala e profundidade como qualquer outro prop.
  function pseudoRandom(seed) {
    let state = seed >>> 0;
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  // Cada faixa tem uma linha externa (arvores baixas) e uma interna (arvores
  // grandes). "fixed" e a coordenada perpendicular (y no norte/sul, x no leste/
  // oeste) e "spacing" o passo ao longo da borda.
  const borderRows = [
    { band: "north", axis: "x", fixed: 62, row: "outside", keys: TREE_SHORT, scale: 1.7, spacing: 44, jitter: 10, seed: 101 },
    { band: "north", axis: "x", fixed: 124, row: "inside", keys: TREE_TALL, scale: 1.95, spacing: 42, jitter: 8, seed: 103 },
    { band: "south", axis: "x", fixed: 836, row: "inside", keys: TREE_SHORT, scale: 1.75, spacing: 44, jitter: 10, seed: 107 },
    { band: "south", axis: "x", fixed: 892, row: "outside", keys: TREE_TALL, scale: 2, spacing: 42, jitter: 8, seed: 109 },
    { band: "west", axis: "y", fixed: 100, row: "inside", keys: TREE_TALL, scale: 1.95, spacing: 46, jitter: 8, seed: 113 },
    { band: "west", axis: "y", fixed: 44, row: "outside", keys: TREE_SHORT, scale: 1.75, spacing: 48, jitter: 10, seed: 127 },
    { band: "east", axis: "y", fixed: 2412, row: "inside", keys: TREE_TALL, scale: 1.95, spacing: 46, jitter: 8, seed: 131 },
    { band: "east", axis: "y", fixed: 2470, row: "outside", keys: TREE_SHORT, scale: 1.75, spacing: 48, jitter: 10, seed: 137 }
  ];

  function forestRow(spec) {
    const random = pseudoRandom(spec.seed);
    const length = spec.axis === "x" ? world.width : world.height;
    const margin = 6;
    const props = [];
    for (let offset = margin; offset <= length - margin; offset += spec.spacing * (0.82 + random() * 0.36)) {
      const key = spec.keys[Math.floor(random() * spec.keys.length)];
      const scale = Number((spec.scale * (1 + random() * 0.15)).toFixed(2));
      const along = offset + (random() - 0.5) * spec.jitter;
      const fixed = spec.fixed + (random() - 0.5) * spec.jitter * 0.6;
      props.push(spec.axis === "x"
        ? { key, x: Math.round(along), y: Math.round(fixed), scale, band: spec.band, layer: spec.row }
        : { key, x: Math.round(fixed), y: Math.round(along), scale, band: spec.band, layer: spec.row });
    }
    return props;
  }

  // Vegetacao rasteira logo dentro da mata, para a transicao nao ficar reta.
  function undergrowthRow(spec) {
    const random = pseudoRandom(spec.seed);
    const length = spec.axis === "x" ? world.width : world.height;
    const props = [];
    for (let offset = 12; offset <= length - 12; offset += spec.spacing * (0.7 + random() * 0.7)) {
      const key = UNDERGROWTH[Math.floor(random() * UNDERGROWTH.length)];
      const along = offset + (random() - 0.5) * 18;
      const fixed = spec.fixed + (random() - 0.5) * spec.spread;
      props.push(spec.axis === "x"
        ? { key, x: Math.round(along), y: Math.round(fixed), scale: Number((1.6 + random() * 1).toFixed(2)), band: spec.band, layer: "undergrowth" }
        : { key, x: Math.round(fixed), y: Math.round(along), scale: Number((1.6 + random() * 1).toFixed(2)), band: spec.band, layer: "undergrowth" });
    }
    return props;
  }

  const borderProps = [
    ...borderRows.map(forestRow).flat(),
    ...undergrowthRow({ band: "north", axis: "x", fixed: 138, spread: 16, spacing: 96, seed: 211 }),
    ...undergrowthRow({ band: "south", axis: "x", fixed: 744, spread: 16, spacing: 96, seed: 223 }),
    ...undergrowthRow({ band: "west", axis: "y", fixed: 160, spread: 16, spacing: 104, seed: 227 }),
    ...undergrowthRow({ band: "east", axis: "y", fixed: 2348, spread: 16, spacing: 104, seed: 229 })
  ];

  // Vegetacao dentro das areas (a mata das ruinas precisa de arvores no meio,
  // nao so nas bordas). Cada uma tem base de colisao no tronco.
  const treeSolid = { w: 40, h: 24 };
  const interior = [
    { key: "tree-big", x: 845, y: 240, scale: 2, solid: treeSolid },
    { key: "tree-oak", x: 1006, y: 690, scale: 1.9, solid: treeSolid },
    { key: "tree-big-pine", x: 1180, y: 205, scale: 1.95, solid: treeSolid },
    { key: "tree-birch", x: 1392, y: 700, scale: 1.9, solid: treeSolid },
    { key: "tree-spruce", x: 1502, y: 250, scale: 2.1 },
    { key: "tree-oak-small", x: 1244, y: 330, scale: 2, solid: treeSolid },
    { key: "tree-spruce-sparse", x: 900, y: 660, scale: 2 },
    { key: "tree-big", x: 1660, y: 240, scale: 1.95, solid: treeSolid },
    { key: "tree-birch-small", x: 1985, y: 690, scale: 2, solid: treeSolid },
    { key: "tree-normal", x: 1560, y: 620, scale: 1.9 },
    { key: "tree-oak", x: 1120, y: 480, scale: 2.05, solid: treeSolid },
    { key: "tree-big-pine", x: 730, y: 620, scale: 1.9, solid: treeSolid },
    { key: "tree-spruce", x: 470, y: 250, scale: 2 },
    { key: "tree-birch", x: 2255, y: 300, scale: 1.85, solid: treeSolid },
    { key: "tree-oak-small", x: 2340, y: 620, scale: 1.9, solid: treeSolid },
    // troncos e restos de mata dentro das areas
    { key: "tree-trunk", x: 1215, y: 420, scale: 2.2 },
    { key: "tree-trunk", x: 605, y: 255, scale: 2 },
    { key: "stump", x: 1318, y: 560, scale: 2.4 },
    { key: "stump-mushrooms", x: 1245, y: 600, scale: 2.4 },
    { key: "stump", x: 1795, y: 250, scale: 2.2 },
    { key: "rock-grass", x: 985, y: 415, scale: 2.6 },
    { key: "rock-grass", x: 1950, y: 300, scale: 2.4 },
    { key: "bush-wide", x: 1130, y: 620, scale: 2.2 },
    { key: "bush", x: 175, y: 610, scale: 2.4 },
    { key: "bush-wide", x: 760, y: 300, scale: 2.1 },
    { key: "grass-tuft-tall", x: 905, y: 570, scale: 2.4 },
    { key: "grass-tuft", x: 1440, y: 300, scale: 2.4 },
    { key: "grass-tuft-low", x: 2050, y: 640, scale: 2.6 },
    { key: "grass-tuft-small", x: 250, y: 620, scale: 2.6 },
    { key: "grass-tuft-tall", x: 2320, y: 190, scale: 2.4 }
  ];

  // Cenario urbano ao longo da estrada: carcacas, postes, bancos, entulho.
  const street = [
    { key: "car-wreck", x: 300, y: 545, scale: 2.4, solid: { w: 46, h: 22 } },
    { key: "car-overturned", x: 600, y: 355, scale: 2.4, solid: { w: 50, h: 22 } },
    { key: "van-wreck", x: 870, y: 550, scale: 2.4, solid: { w: 84, h: 26 } },
    { key: "motorcycle-wreck", x: 1010, y: 356, scale: 2.6, solid: { w: 44, h: 16 } },
    { key: "car-scrap", x: 1290, y: 560, scale: 2.5, solid: { w: 74, h: 22 } },
    { key: "truck-wreck", x: 1560, y: 550, scale: 2.2, solid: { w: 104, h: 40 } },
    { key: "car-wreck", x: 1785, y: 360, scale: 2.3, solid: { w: 44, h: 22 } },
    { key: "car-overturned", x: 2020, y: 560, scale: 2.3, solid: { w: 48, h: 22 } },
    { key: "motorcycle-wreck", x: 2225, y: 610, scale: 2.5, solid: { w: 42, h: 16 } },
    { key: "motorcycle-wreck", x: 2380, y: 300, scale: 2.4, solid: { w: 42, h: 16 } },
    { key: "street-light-side", x: 480, y: 300, scale: 2.4, solid: { w: 14, h: 12 } },
    { key: "street-light-side", x: 1140, y: 620, scale: 2.4, solid: { w: 14, h: 12 } },
    { key: "street-light-overgrown", x: 1700, y: 300, scale: 2.4, solid: { w: 14, h: 12 } },
    { key: "street-light-up", x: 2180, y: 620, scale: 2.4, solid: { w: 12, h: 12 } },
    { key: "street-light-up", x: 640, y: 630, scale: 2.4, solid: { w: 12, h: 12 } },
    { key: "street-light-side", x: 2330, y: 470, scale: 2.2, solid: { w: 14, h: 12 } },
    { key: "bench", x: 700, y: 320, scale: 2.4, solid: { w: 60, h: 18 } },
    { key: "bench", x: 1440, y: 350, scale: 2.2, solid: { w: 56, h: 18 } },
    { key: "hydrant", x: 1160, y: 330, scale: 2.6, solid: { w: 18, h: 14 } },
    { key: "hydrant", x: 1900, y: 620, scale: 2.6, solid: { w: 18, h: 14 } },
    { key: "trash-can", x: 420, y: 610, scale: 2.6, solid: { w: 26, h: 16 } },
    { key: "trash-can", x: 1610, y: 620, scale: 2.6, solid: { w: 26, h: 16 } },
    { key: "trash-bag", x: 460, y: 630, scale: 2.6 },
    { key: "trash-bag", x: 1652, y: 645, scale: 2.6 },
    { key: "traffic-cone", x: 1255, y: 470, scale: 2.6 },
    { key: "traffic-cone", x: 1288, y: 500, scale: 2.6 },
    { key: "traffic-cone", x: 1450, y: 545, scale: 2.6 },
    { key: "stop-sign", x: 1738, y: 340, scale: 2.4, solid: { w: 14, h: 12 } },
    { key: "stop-sign", x: 960, y: 620, scale: 2.4, solid: { w: 14, h: 12 } },
    { key: "iron-beam", x: 1310, y: 605, scale: 2.6 },
    { key: "iron-beam", x: 2150, y: 285, scale: 2.6 },
    { key: "pallet", x: 860, y: 620, scale: 2.6 },
    { key: "cardboard", x: 1005, y: 625, scale: 2.6 },
    { key: "cardboard", x: 520, y: 560, scale: 2.4 },
    { key: "shopping-cart", x: 1180, y: 590, scale: 2.6, solid: { w: 24, h: 16 } },
    { key: "refrigerator", x: 1890, y: 320, scale: 2.4, solid: { w: 32, h: 16 } },
    { key: "washing-machine", x: 1480, y: 630, scale: 2.6, solid: { w: 28, h: 16 } },
    { key: "vending-machine", x: 680, y: 600, scale: 2.4, solid: { w: 34, h: 16 } },
    { key: "gray-brick", x: 560, y: 250, scale: 2.6 },
    { key: "gray-brick-debris", x: 590, y: 258, scale: 2.4 },
    { key: "gray-brick-debris", x: 1090, y: 260, scale: 2.4 },
    { key: "container", x: 2085, y: 690, scale: 2.4, solid: { w: 50, h: 22 } },
    { key: "container", x: 1560, y: 190, scale: 2.2, solid: { w: 46, h: 20 } },
    { key: "exhaust-pipe", x: 1380, y: 620, scale: 2.8 },
    // entulho das ruinas que sobreviveu a troca das paredes cinzas por tijolo
    { key: "brick-debris", x: 410, y: 290, scale: 2.2 },
    { key: "brick-debris", x: 1000, y: 290, scale: 2.2 },
    { key: "brick-debris", x: 1750, y: 290, scale: 2.2 },
    { key: "destroyed-wall", x: 985, y: 250, scale: 2.2 },
    { key: "destroyed-wall-corner", x: 952, y: 250, scale: 2.2 },
    { key: "destroyed-wall", x: 1980, y: 712, scale: 2.2 },
    { key: "destroyed-wall-corner", x: 2012, y: 712, scale: 2.2 },
    { key: "tires-grass", x: 310, y: 700, scale: 2.2 },
    { key: "tire", x: 675, y: 295, scale: 2.6 },
    { key: "garbage-bin", x: 500, y: 590, scale: 2 },
    { key: "barrel-rust-red", x: 1210, y: 610, scale: 2.2, solid: { w: 24, h: 16 } },
    { key: "barrel-rust-red", x: 1780, y: 285, scale: 2.2, solid: { w: 24, h: 16 } },
    // detalhes rentes ao chao (desenhados abaixo dos personagens)
    { key: "manhole", x: 960, y: 450, scale: 2.6, flat: true },
    { key: "manhole", x: 1760, y: 470, scale: 2.6, flat: true },
    { key: "metal-plates", x: 1330, y: 430, scale: 2.4, flat: true },
    { key: "metal-plates", x: 2240, y: 470, scale: 2.4, flat: true },
    { key: "brick-debris", x: 205, y: 490, scale: 2.4, flat: true },
    { key: "brick-debris", x: 1615, y: 505, scale: 2.4, flat: true }
  ];

  const props = [...interior, ...street, ...borderProps];

  const groundDetails = [
    [45, 100], [180, 165], [290, 740], [470, 710], [650, 90], [760, 780],
    [850, 110], [980, 770], [1120, 180], [1290, 760], [1450, 95], [1560, 690],
    [1640, 85], [1770, 745], [1900, 170], [2040, 760], [2160, 105], [2290, 720], [2430, 120]
  ];

  function areaAt(x) { return areas.find(area => x >= area.startX && x < area.endX) || areas[areas.length - 1]; }
  return { world, playerSpawn, merchant, campfire, safeZoneX, areas, areaAt, areaEdges, road, borderBands, enemySpawns, solids, props, groundDetails };
});
