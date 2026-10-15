((root, factory) => {
  const config = factory();
  if (typeof module === "object" && module.exports) module.exports = config;
  root.UmbralWorld = config;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const world = { width: 4300, height: 1500 };
  // A superfície continua com 900 px de altura; abaixo dela ficam os corredores.
  const surfaceHeight = 900;
  const playerSpawn = { x: 190, y: 450 };
  const merchant = { x: 1505, y: 570 };
  const campfire = { x: 3950, y: 485 };
  const safeZoneX = 3600;
  const areas = [
    { id: "outskirts", name: "SUBÚRBIO INFECTADO", startX: 0, endX: 1050, ground: "ground-bleak" },
    { id: "village", name: "VILA DA FOGUEIRA", startX: 1050, endX: 1700, ground: "ground-refuge" },
    { id: "wilds", name: "MATA DAS RUÍNAS", startX: 1700, endX: 2800, ground: "ground-dark" },
    { id: "urban", name: "ZONA URBANA MORTA", startX: 2800, endX: safeZoneX, ground: "ground-urban" },
    { id: "refuge", name: "CLAREIRA DO REFÚGIO", startX: safeZoneX, endX: world.width, ground: "ground-refuge" }
  ];
  // Zonas seguras onde os inimigos desistem e voltam para casa: a vila inicial e o
  // refúgio do leste. O restante do mapa é território hostil.
  const safeZones = [
    { startX: areas[1].startX, endX: areas[1].endX },
    { startX: safeZoneX, endX: world.width }
  ];
  function isSafeX(x) { return safeZones.some(zone => x >= zone.startX && x < zone.endX); }
  // Vila inicial pós-apocalipse: clareira cercada de árvores depois da área dos
  // ratos, com fogueira grande, barracas e o mercador. As entradas são os dois
  // vãos da estrada (oeste/leste), onde o anel de árvores é interrompido.
  const village = {
    bonfire: { x: 1400, y: 612 },
    tents: [
      { x: 1215, y: 315 }, { x: 1595, y: 320 },
      { x: 1235, y: 655 }, { x: 1575, y: 660 }
    ]
  };

  // Transicoes de piso entre areas: dither de 96 px centrado na divisa, no lugar
  // das linhas pretas que o graphics desenhava. Precisa casar com a ordem de
  // areas acima (oeste -> leste).
  const areaEdges = [
    { x: areas[1].startX, key: "edge-bleak-dark", width: 96 },
    { x: areas[2].startX, key: "edge-bleak-dark", width: 96 },
    { x: areas[3].startX, key: "edge-dark-urban", width: 96 },
    { x: areas[4].startX, key: "edge-urban-refuge", width: 96 }
  ];

  // Estrada de terra batida que atravessa o mapa. Fica centrada em y=450 e nao
  // tem colisao: e so leito, o jogador anda por cima.
  const road = { key: "road", x: 0, y: 386, width: world.width, height: 128 };

  // Corredores subterrâneos sob a zona urbana (nível 20): três galerias ligadas em
  // zigue-zague, acessadas por um poço na borda sul da cidade. O poço e as galerias
  // são a única parte alcançável abaixo da superfície; o resto é rocha sólida.
  const underground = {
    id: "underground", name: "CORREDORES SUBTERRÂNEOS",
    x: 2830, y: 980, width: 620, height: 456, ground: "ground-urban",
    entrance: { x: 3158, top: 754, width: 48 }
  };
  underground.gapX = underground.entrance.x - underground.entrance.width / 2;

  const enemySpawns = [
    { id: "rat-1", x: 260, y: 420 }, { id: "rat-1b", x: 385, y: 520 },
    { id: "rat-2", x: 550, y: 365 }, { id: "rat-2b", x: 700, y: 485 },
    { id: "wolf-5", x: 1820, y: 390 }, { id: "wolf-5b", x: 1970, y: 535 },
    { id: "wolf-6", x: 2180, y: 365 }, { id: "wolf-6b", x: 2390, y: 500 },
    { id: "slow-zombie-10", x: 2880, y: 380 }, { id: "slow-zombie-10b", x: 3030, y: 540 },
    { id: "slow-zombie-11", x: 3210, y: 360 }, { id: "slow-zombie-12", x: 3360, y: 500 },
    // Faixa de elite: dois saqueadores acampados nos flancos da estrada e o mutante guardando o portão.
    // O mutante fica a oeste de safeZoneX menos sua área de contato, para o refúgio continuar seguro.
    // A ordem desta lista precisa continuar igual à ordem de EnemyRules.ENEMIES (índice usado pelo save).
    { id: "scavenger-18", x: 3480, y: 620 }, { id: "scavenger-20", x: 3520, y: 300 },
    { id: "mutant-30", x: 3550, y: 400 },
    // Subterrâneo nível 20: apêndice no fim das duas listas (nunca reordenar — o save
    // antigo referencia os 15 primeiros). Galeria A, galeria B e galeria C, nesta ordem.
    { id: "sewer-zombie-20", x: 2940, y: 1068 }, { id: "sewer-zombie-20b", x: 3280, y: 1068 },
    { id: "sewer-zombie-21", x: 3180, y: 1214 }, { id: "sewer-zombie-21b", x: 2980, y: 1214 },
    { id: "sewer-zombie-22", x: 3240, y: 1352 },
    // Reforços das áreas ampliadas (apêndice, mesma ordem de EnemyRules).
    { id: "rat-2c", x: 905, y: 530 }, { id: "wolf-6c", x: 2560, y: 430 },
    { id: "slow-zombie-12b", x: 3410, y: 560 }
  ];

  // ---------------------------------------------------------------------------
  // Cinturao de mata das bordas
  // ---------------------------------------------------------------------------
  // Retangulos de colisao que fecham as quatro bordas do mapa. O jogador nao
  // alcanca nenhuma beirada: a mata e a barreira, nao o clamp de coordenadas do
  // movePlayer. A folhagem de cada faixa fica dentro do proprio retangulo (os
  // testes medem sprite por sprite contra estes numeros).
  // A faixa sul é partida em duas no poço do esgoto (gapX..gapX+48): é a única
  // passagem entre a superfície e os corredores abaixo dela.
  const borderBands = [
    { id: "north", border: true, x: 0, y: 0, w: world.width, h: 128 },
    { id: "south", border: true, x: 0, y: 754, w: underground.gapX, h: 146 },
    { id: "south", border: true, x: underground.gapX + underground.entrance.width, y: 754, w: world.width - underground.gapX - underground.entrance.width, h: 146 },
    { id: "west", border: true, x: 0, y: 0, w: 150, h: world.height },
    { id: "east", border: true, x: 4160, y: 0, w: 140, h: world.height }
  ];

  // Paredes de tijolo dos corredores (desenhadas pela cena, como as ruínas): topo com
  // a boca do poço, laterais, fundo e duas divisórias com passagens alternadas, que
  // obrigam o zigue-zague galeria A -> oeste -> galeria B -> leste -> galeria C.
  const undergroundWalls = [
    { x: underground.x, y: underground.y, w: underground.gapX - underground.x, h: 32 },
    { x: underground.gapX + underground.entrance.width, y: underground.y, w: underground.x + underground.width - underground.gapX - underground.entrance.width, h: 32 },
    { x: underground.x, y: underground.y, w: 32, h: underground.height },
    { x: underground.x + underground.width - 32, y: underground.y, w: 32, h: underground.height },
    { x: underground.x, y: underground.y + underground.height - 32, w: underground.width, h: 32 },
    { x: 2912, y: 1124, w: 476, h: 28 },
    { x: 2832, y: 1276, w: 500, h: 28 }
  ];

  // Rocha ao redor dos corredores (border: true = colide mas não desenha parede;
  // a cena pinta só o chão das galerias e o resto fica na escuridão do fundo).
  const undergroundRock = [
    { border: true, x: 150, y: surfaceHeight, w: underground.x - 150, h: world.height - surfaceHeight },
    { border: true, x: underground.x + underground.width, y: surfaceHeight, w: 2360 - underground.x - underground.width, h: world.height - surfaceHeight },
    { border: true, x: underground.x, y: surfaceHeight, w: underground.gapX - underground.x, h: underground.y - surfaceHeight },
    { border: true, x: underground.gapX + underground.entrance.width, y: surfaceHeight, w: underground.x + underground.width - underground.gapX - underground.entrance.width, h: underground.y - surfaceHeight },
    { border: true, x: underground.x, y: underground.y + underground.height, w: underground.width, h: world.height - underground.y - underground.height }
  ];

  // Ruinas: paredes de tijolo do pack (o desenho segue estes retangulos).
  const ruins = [
    { x: 350, y: 120, w: 224, h: 32 }, { x: 350, y: 152, w: 32, h: 128 },
    { x: 610, y: 650, w: 160, h: 32 },
    { x: 1848, y: 125, w: 256, h: 32 }, { x: 2072, y: 157, w: 32, h: 128 },
    { x: 2232, y: 650, w: 192, h: 32 },
    { x: 2880, y: 110, w: 256, h: 32 }, { x: 2880, y: 142, w: 32, h: 128 },
    { x: 3142, y: 665, w: 224, h: 32 }, { x: 3332, y: 570, w: 32, h: 96 }
  ];

  const solids = [...ruins, ...borderBands, ...undergroundWalls, ...undergroundRock];

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
    { band: "east", axis: "y", fixed: 4212, row: "inside", keys: TREE_TALL, scale: 1.95, spacing: 46, jitter: 8, seed: 131 },
    { band: "east", axis: "y", fixed: 4270, row: "outside", keys: TREE_SHORT, scale: 1.75, spacing: 48, jitter: 10, seed: 137 }
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

  // Nenhuma árvore pode nascer sobre a boca do poço: a folhagem sul é filtrada na
  // faixa do poço (com folga para a copa não cobrir a entrada).
  const shaftClear = x => x < underground.entrance.x - 72 || x > underground.entrance.x + 72;
  const borderProps = [
    ...borderRows.map(forestRow).flat(),
    ...undergrowthRow({ band: "north", axis: "x", fixed: 138, spread: 16, spacing: 96, seed: 211 }),
    ...undergrowthRow({ band: "south", axis: "x", fixed: 744, spread: 16, spacing: 96, seed: 223 }),
    ...undergrowthRow({ band: "west", axis: "y", fixed: 160, spread: 16, spacing: 104, seed: 227 }),
    ...undergrowthRow({ band: "east", axis: "y", fixed: 4148, spread: 16, spacing: 104, seed: 229 })
  ].filter(prop => prop.band !== "south" || shaftClear(prop.x));

  // Vegetacao dentro das areas (a mata das ruinas precisa de arvores no meio,
  // nao so nas bordas). Cada uma tem base de colisao no tronco.
  const treeSolid = { w: 40, h: 24 };
  const interior = [
    { key: "tree-big", x: 1765, y: 240, scale: 2, solid: treeSolid },
    { key: "tree-oak", x: 1926, y: 690, scale: 1.9, solid: treeSolid },
    { key: "tree-big-pine", x: 2100, y: 205, scale: 1.95, solid: treeSolid },
    { key: "tree-birch", x: 2312, y: 700, scale: 1.9, solid: treeSolid },
    { key: "tree-spruce", x: 2422, y: 250, scale: 2.1 },
    { key: "tree-oak-small", x: 2164, y: 330, scale: 2, solid: treeSolid },
    { key: "tree-spruce-sparse", x: 1820, y: 660, scale: 2 },
    { key: "tree-big", x: 2880, y: 240, scale: 1.95, solid: treeSolid },
    { key: "tree-birch-small", x: 3205, y: 690, scale: 2, solid: treeSolid },
    { key: "tree-normal", x: 2480, y: 620, scale: 1.9 },
    { key: "tree-oak", x: 2040, y: 480, scale: 2.05, solid: treeSolid },
    { key: "tree-big-pine", x: 730, y: 620, scale: 1.9, solid: treeSolid },
    { key: "tree-spruce", x: 470, y: 250, scale: 2 },
    { key: "tree-birch", x: 3655, y: 300, scale: 1.85, solid: treeSolid },
    { key: "tree-oak-small", x: 3740, y: 620, scale: 1.9, solid: treeSolid },
    // troncos e restos de mata dentro das areas
    { key: "tree-trunk", x: 2135, y: 420, scale: 2.2 },
    { key: "tree-trunk", x: 605, y: 255, scale: 2 },
    { key: "stump", x: 2238, y: 560, scale: 2.4 },
    { key: "stump-mushrooms", x: 2165, y: 600, scale: 2.4 },
    { key: "stump", x: 3015, y: 250, scale: 2.2 },
    { key: "rock-grass", x: 1905, y: 415, scale: 2.6 },
    { key: "rock-grass", x: 3170, y: 300, scale: 2.4 },
    { key: "bush-wide", x: 2050, y: 620, scale: 2.2 },
    { key: "bush", x: 175, y: 610, scale: 2.4 },
    { key: "bush-wide", x: 760, y: 300, scale: 2.1 },
    { key: "grass-tuft-tall", x: 1825, y: 570, scale: 2.4 },
    { key: "grass-tuft", x: 2360, y: 300, scale: 2.4 },
    { key: "grass-tuft-low", x: 3270, y: 640, scale: 2.6 },
    { key: "grass-tuft-small", x: 250, y: 620, scale: 2.6 },
    { key: "grass-tuft-tall", x: 3720, y: 190, scale: 2.4 }
  ];

  // Cenario urbano ao longo da estrada: carcacas, postes, bancos, entulho.
  const street = [
    { key: "car-wreck", x: 300, y: 545, scale: 2.4, solid: { w: 46, h: 22 } },
    { key: "car-overturned", x: 600, y: 355, scale: 2.4, solid: { w: 50, h: 22 } },
    { key: "van-wreck", x: 1790, y: 550, scale: 2.4, solid: { w: 84, h: 26 } },
    { key: "motorcycle-wreck", x: 1930, y: 356, scale: 2.6, solid: { w: 44, h: 16 } },
    { key: "car-scrap", x: 2210, y: 560, scale: 2.5, solid: { w: 74, h: 22 } },
    { key: "truck-wreck", x: 2480, y: 550, scale: 2.2, solid: { w: 104, h: 40 } },
    { key: "car-wreck", x: 3005, y: 360, scale: 2.3, solid: { w: 44, h: 22 } },
    { key: "car-overturned", x: 3240, y: 560, scale: 2.3, solid: { w: 48, h: 22 } },
    { key: "motorcycle-wreck", x: 3625, y: 610, scale: 2.5, solid: { w: 42, h: 16 } },
    { key: "motorcycle-wreck", x: 3780, y: 300, scale: 2.4, solid: { w: 42, h: 16 } },
    { key: "street-light-side", x: 480, y: 300, scale: 2.4, solid: { w: 14, h: 12 } },
    { key: "street-light-side", x: 2060, y: 620, scale: 2.4, solid: { w: 14, h: 12 } },
    { key: "street-light-overgrown", x: 2920, y: 300, scale: 2.4, solid: { w: 14, h: 12 } },
    { key: "street-light-up", x: 3400, y: 620, scale: 2.4, solid: { w: 12, h: 12 } },
    { key: "street-light-up", x: 640, y: 630, scale: 2.4, solid: { w: 12, h: 12 } },
    { key: "street-light-side", x: 3730, y: 470, scale: 2.2, solid: { w: 14, h: 12 } },
    { key: "bench", x: 700, y: 320, scale: 2.4, solid: { w: 60, h: 18 } },
    { key: "bench", x: 2360, y: 350, scale: 2.2, solid: { w: 56, h: 18 } },
    { key: "hydrant", x: 2080, y: 330, scale: 2.6, solid: { w: 18, h: 14 } },
    { key: "hydrant", x: 3120, y: 620, scale: 2.6, solid: { w: 18, h: 14 } },
    { key: "trash-can", x: 420, y: 610, scale: 2.6, solid: { w: 26, h: 16 } },
    { key: "trash-can", x: 2830, y: 620, scale: 2.6, solid: { w: 26, h: 16 } },
    { key: "trash-bag", x: 460, y: 630, scale: 2.6 },
    { key: "trash-bag", x: 2872, y: 645, scale: 2.6 },
    { key: "traffic-cone", x: 2175, y: 470, scale: 2.6 },
    { key: "traffic-cone", x: 2208, y: 500, scale: 2.6 },
    { key: "traffic-cone", x: 2370, y: 545, scale: 2.6 },
    { key: "stop-sign", x: 2958, y: 340, scale: 2.4, solid: { w: 14, h: 12 } },
    { key: "stop-sign", x: 1880, y: 620, scale: 2.4, solid: { w: 14, h: 12 } },
    { key: "iron-beam", x: 2230, y: 605, scale: 2.6 },
    { key: "iron-beam", x: 3370, y: 285, scale: 2.6 },
    { key: "pallet", x: 1780, y: 620, scale: 2.6 },
    { key: "cardboard", x: 1925, y: 625, scale: 2.6 },
    { key: "cardboard", x: 520, y: 560, scale: 2.4 },
    { key: "shopping-cart", x: 2100, y: 590, scale: 2.6, solid: { w: 24, h: 16 } },
    { key: "refrigerator", x: 3110, y: 320, scale: 2.4, solid: { w: 32, h: 16 } },
    { key: "washing-machine", x: 2400, y: 630, scale: 2.6, solid: { w: 28, h: 16 } },
    { key: "vending-machine", x: 680, y: 600, scale: 2.4, solid: { w: 34, h: 16 } },
    { key: "gray-brick", x: 560, y: 250, scale: 2.6 },
    { key: "gray-brick-debris", x: 590, y: 258, scale: 2.4 },
    { key: "gray-brick-debris", x: 2010, y: 260, scale: 2.4 },
    { key: "container", x: 3305, y: 690, scale: 2.4, solid: { w: 50, h: 22 } },
    { key: "container", x: 2480, y: 190, scale: 2.2, solid: { w: 46, h: 20 } },
    { key: "exhaust-pipe", x: 2300, y: 620, scale: 2.8 },
    // entulho das ruinas que sobreviveu a troca das paredes cinzas por tijolo
    { key: "brick-debris", x: 410, y: 290, scale: 2.2 },
    { key: "brick-debris", x: 1920, y: 290, scale: 2.2 },
    { key: "brick-debris", x: 2970, y: 290, scale: 2.2 },
    { key: "destroyed-wall", x: 1905, y: 250, scale: 2.2 },
    { key: "destroyed-wall-corner", x: 1872, y: 250, scale: 2.2 },
    { key: "destroyed-wall", x: 3200, y: 712, scale: 2.2 },
    { key: "destroyed-wall-corner", x: 3232, y: 712, scale: 2.2 },
    { key: "tires-grass", x: 310, y: 700, scale: 2.2 },
    { key: "tire", x: 675, y: 295, scale: 2.6 },
    { key: "garbage-bin", x: 500, y: 590, scale: 2 },
    { key: "barrel-rust-red", x: 2130, y: 610, scale: 2.2, solid: { w: 24, h: 16 } },
    { key: "barrel-rust-red", x: 3000, y: 285, scale: 2.2, solid: { w: 24, h: 16 } },
    // detalhes rentes ao chao (desenhados abaixo dos personagens)
    { key: "manhole", x: 1880, y: 450, scale: 2.6, flat: true },
    { key: "manhole", x: 2980, y: 470, scale: 2.6, flat: true },
    { key: "metal-plates", x: 2250, y: 430, scale: 2.4, flat: true },
    { key: "metal-plates", x: 3640, y: 470, scale: 2.4, flat: true },
    { key: "brick-debris", x: 205, y: 490, scale: 2.4, flat: true },
    { key: "brick-debris", x: 2835, y: 505, scale: 2.4, flat: true }
  ];

  // Boca do poço na superfície e entulho das galerias (só assets já carregados).
  const undergroundProps = [
    { key: "manhole", x: underground.entrance.x, y: 748, scale: 3, flat: true },
    { key: "metal-plates", x: 3020, y: 1092, scale: 2.4, flat: true },
    { key: "metal-plates", x: 3300, y: 1242, scale: 2.4, flat: true },
    { key: "brick-debris", x: 3120, y: 1202, scale: 2.4, flat: true },
    { key: "tires-grass", x: 3220, y: 1382, scale: 2.2, flat: true },
    { key: "garbage-bin", x: 2880, y: 1368, scale: 2, solid: { w: 26, h: 16 } },
    { key: "barrel-rust-red", x: 3360, y: 1092, scale: 2.2, solid: { w: 24, h: 16 } },
    { key: "iron-beam", x: 2970, y: 1258, scale: 2.6 },
    { key: "exhaust-pipe", x: 2872, y: 1052, scale: 2.8 },
    { key: "tire", x: 3320, y: 1332, scale: 2.6 }
  ];

  // Anel de árvores da vila: cerca viva com vãos só na estrada (oeste/leste).
  // Os troncos têm colisão, então a clareira é um recinto de verdade — e os
  // inimigos também só entram pela estrada, onde a zona segura os manda de volta.
  const VILLAGE_TREES = ["tree-big", "tree-oak", "tree-spruce", "tree-birch", "tree-big-pine", "tree-normal"];
  const villageRing = [];
  {
    let pick = 0;
    const nextKey = () => VILLAGE_TREES[(pick++) % VILLAGE_TREES.length];
    for (let x = 1112; x <= 1688; x += 52) {
      villageRing.push({ key: nextKey(), x, y: 196, scale: 2, solid: treeSolid });
      villageRing.push({ key: nextKey(), x: x + 24, y: 724, scale: 2, solid: treeSolid });
    }
    for (let y = 252; y <= 700; y += 56) {
      if (y > 330 && y < 580) continue; // vão da estrada
      villageRing.push({ key: nextKey(), x: 1092, y, scale: 2, solid: treeSolid });
      villageRing.push({ key: nextKey(), x: 1692, y, scale: 2, solid: treeSolid });
    }
  }
  const villageProps = [
    { key: "bench", x: 1330, y: 545, scale: 2.4, solid: { w: 60, h: 18 } },
    { key: "bench", x: 1475, y: 545, scale: 2.4, solid: { w: 60, h: 18 } },
    { key: "street-light-up", x: 1180, y: 430, scale: 2.4, solid: { w: 12, h: 12 } },
    { key: "street-light-up", x: 1630, y: 430, scale: 2.4, solid: { w: 12, h: 12 } },
    { key: "pallet", x: 1565, y: 648, scale: 2.6 },
    { key: "cardboard", x: 1595, y: 668, scale: 2.4 },
    { key: "trash-can", x: 1260, y: 430, scale: 2.6, solid: { w: 26, h: 16 } },
    { key: "barrel-rust-red", x: 1610, y: 600, scale: 2.2, solid: { w: 24, h: 16 } },
    { key: "grass-tuft-tall", x: 1180, y: 620, scale: 2.4 },
    { key: "grass-tuft", x: 1650, y: 260, scale: 2.4 },
    { key: "bush", x: 1140, y: 350, scale: 2.4 },
    { key: "bush-wide", x: 1665, y: 620, scale: 2.1 }
  ];

  const props = [...interior, ...street, ...villageProps, ...villageRing, ...undergroundProps, ...borderProps];

  const groundDetails = [
    [45, 100], [180, 165], [290, 740], [470, 710], [650, 90], [760, 780],
    [1770, 110], [1900, 770], [2040, 180], [2210, 760], [2370, 95], [2480, 690],
    [2860, 85], [2990, 745], [3120, 170], [3260, 760], [3380, 105], [3690, 720], [3830, 120]
  ];

  function areaAt(x, y = 0) {
    // Abaixo da superfície (ou descendo pelo poço) a área é sempre o subterrâneo,
    // qualquer que seja o x: o resto lá embaixo é rocha inalcançável.
    if (y >= surfaceHeight || (y >= underground.entrance.top - 14 && Math.abs(x - underground.entrance.x) <= underground.entrance.width)) return underground;
    return areas.find(area => x >= area.startX && x < area.endX) || areas[areas.length - 1];
  }
  return { world, surfaceHeight, underground, village, playerSpawn, merchant, campfire, safeZoneX, safeZones, isSafeX, areas, areaAt, areaEdges, road, borderBands, enemySpawns, solids, props, groundDetails };
});
