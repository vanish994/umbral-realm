((root, factory) => {
  const config = factory();
  if (typeof module === "object" && module.exports) module.exports = config;
  root.UmbralWorld = config;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const world = { width: 2500, height: 900 };
  const playerSpawn = { x: 100, y: 450 };
  const merchant = { x: 2350, y: 430 };
  const campfire = { x: 2260, y: 485 };
  const safeZoneX = 2200;
  const areas = [
    { id: "outskirts", name: "SUBÚRBIO INFECTADO", startX: 0, endX: 780, ground: "ground-bleak" },
    { id: "wilds", name: "MATA DAS RUÍNAS", startX: 780, endX: 1580, ground: "ground-dark" },
    { id: "urban", name: "ZONA URBANA MORTA", startX: 1580, endX: safeZoneX, ground: "ground-bleak" },
    { id: "refuge", name: "CLAREIRA DO REFÚGIO", startX: safeZoneX, endX: world.width, ground: "ground-dark" }
  ];

  const enemySpawns = [
    { id: "rat-1", x: 260, y: 420 }, { id: "rat-1b", x: 385, y: 520 },
    { id: "rat-2", x: 550, y: 365 }, { id: "rat-2b", x: 700, y: 485 },
    { id: "wolf-5", x: 900, y: 390 }, { id: "wolf-5b", x: 1050, y: 535 },
    { id: "wolf-6", x: 1260, y: 365 }, { id: "wolf-6b", x: 1470, y: 500 },
    { id: "slow-zombie-10", x: 1660, y: 380 }, { id: "slow-zombie-10b", x: 1810, y: 540 },
    { id: "slow-zombie-11", x: 1990, y: 360 }, { id: "slow-zombie-12", x: 2140, y: 500 }
  ];

  const solids = [
    { x: 350, y: 120, w: 230, h: 22 }, { x: 350, y: 142, w: 20, h: 115 },
    { x: 610, y: 650, w: 135, h: 22 },
    { x: 930, y: 125, w: 250, h: 22 }, { x: 1160, y: 147, w: 20, h: 120 },
    { x: 1320, y: 650, w: 180, h: 22 },
    { x: 1660, y: 110, w: 260, h: 28 }, { x: 1660, y: 138, w: 25, h: 130 },
    { x: 1930, y: 665, w: 210, h: 25 }, { x: 2115, y: 570, w: 25, h: 95 },
    { x: 2440, y: 320, w: 24, h: 240 }
  ];

  const props = [
    { key: "small-oak", x: 90, y: 245, scale: 2.2, solid: { w: 38, h: 24 } },
    { key: "bush", x: 175, y: 610, scale: 2 }, { key: "tires-grass", x: 310, y: 330, scale: 1.7 },
    { key: "garbage-bin", x: 500, y: 590, scale: 1.6 }, { key: "tire", x: 675, y: 295, scale: 1.8 },
    { key: "brick-wall-tile", x: 410, y: 257, scale: 2 }, { key: "brick-ruin-tile", x: 442, y: 257, scale: 2 },
    { key: "small-oak", x: 835, y: 250, scale: 2.3, solid: { w: 40, h: 25 } },
    { key: "small-oak", x: 1010, y: 690, scale: 2.1, solid: { w: 36, h: 23 } },
    { key: "bush", x: 1130, y: 300, scale: 2.2 }, { key: "barrel-rust-red", x: 1210, y: 610, scale: 1.9 },
    { key: "small-oak", x: 1390, y: 245, scale: 2.2, solid: { w: 38, h: 24 } },
    { key: "destroyed-wall-corner", x: 955, y: 270, scale: 2 }, { key: "destroyed-wall", x: 988, y: 270, scale: 2 },
    { key: "brick-debris", x: 1510, y: 590, scale: 1.9 },
    { key: "garbage-bin", x: 1635, y: 600, scale: 1.7 }, { key: "barrel-rust-red", x: 1780, y: 315, scale: 1.9 },
    { key: "tire", x: 1900, y: 570, scale: 2 }, { key: "brick-debris", x: 2070, y: 300, scale: 2 },
    { key: "brick-wall-tile", x: 1710, y: 268, scale: 2 }, { key: "brick-ruin-tile", x: 1742, y: 268, scale: 2 },
    { key: "destroyed-wall-corner", x: 1940, y: 690, scale: 2 }, { key: "destroyed-wall", x: 1972, y: 690, scale: 2 },
    { key: "small-oak", x: 2230, y: 245, scale: 2.2, solid: { w: 38, h: 24 } },
    { key: "small-oak", x: 2410, y: 680, scale: 2.1, solid: { w: 36, h: 23 } }, { key: "bush", x: 2320, y: 650, scale: 2 }
  ];

  const groundDetails = [
    [45, 100], [180, 165], [290, 740], [470, 710], [650, 90], [760, 780],
    [850, 110], [980, 770], [1120, 180], [1290, 760], [1450, 95], [1560, 690],
    [1640, 85], [1770, 745], [1900, 170], [2040, 760], [2160, 105], [2290, 720], [2430, 120]
  ];

  function areaAt(x) { return areas.find(area => x >= area.startX && x < area.endX) || areas[areas.length - 1]; }
  return { world, playerSpawn, merchant, campfire, safeZoneX, areas, areaAt, enemySpawns, solids, props, groundDetails };
});
