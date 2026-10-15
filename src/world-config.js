((root, factory) => {
  const config = factory();
  if (typeof module === "object" && module.exports) module.exports = config;
  root.UmbralWorld = config;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const world = { width: 1280, height: 720 };
  const playerSpawn = { x: 100, y: 360 };
  const merchant = { x: 1120, y: 340 };
  const campfire = { x: 1035, y: 385 };
  const ratSpawns = [
    { x: 300, y: 350 },
    { x: 505, y: 300 },
    { x: 690, y: 370 },
    { x: 865, y: 350 }
  ];

  // Obstáculos autorais: posicionamento fixo, separado da arte que os representa.
  const solids = [
    { x: 410, y: 112, w: 205, h: 18 },
    { x: 410, y: 130, w: 18, h: 82 },
    { x: 597, y: 130, w: 18, h: 82 },
    { x: 760, y: 455, w: 86, h: 20 },
    { x: 760, y: 475, w: 18, h: 58 },
    { x: 828, y: 475, w: 18, h: 58 },
    { x: 932, y: 190, w: 22, h: 92 },
    { x: 1190, y: 260, w: 22, h: 190 }
  ];

  const props = [
    { key: "small-oak", x: 75, y: 205, scale: 2.2, solid: { w: 38, h: 24 } },
    { key: "small-oak", x: 210, y: 520, scale: 2.0, solid: { w: 34, h: 22 } },
    { key: "small-oak", x: 355, y: 145, scale: 2.1, solid: { w: 36, h: 23 } },
    { key: "small-oak", x: 600, y: 555, scale: 2.2, solid: { w: 38, h: 24 } },
    { key: "small-oak", x: 745, y: 150, scale: 2.0, solid: { w: 34, h: 22 } },
    { key: "small-oak", x: 930, y: 555, scale: 2.2, solid: { w: 38, h: 24 } },
    { key: "small-oak", x: 1215, y: 160, scale: 2.1, solid: { w: 36, h: 23 } },
    { key: "small-oak", x: 1220, y: 570, scale: 2.2, solid: { w: 38, h: 24 } },
    { key: "bush", x: 155, y: 235, scale: 2 },
    { key: "bush", x: 385, y: 490, scale: 2 },
    { key: "bush", x: 625, y: 190, scale: 2 },
    { key: "bush", x: 900, y: 205, scale: 2 },
    { key: "bush", x: 1170, y: 505, scale: 2 },
    { key: "tires-grass", x: 240, y: 285, scale: 1.6 },
    { key: "tire", x: 455, y: 385, scale: 1.8 },
    { key: "brick-debris", x: 640, y: 292, scale: 1.7 },
    { key: "garbage-bin", x: 795, y: 438, scale: 1.5 },
    { key: "barrel-rust-red", x: 950, y: 320, scale: 1.8 },
    { key: "destroyed-wall-corner", x: 418, y: 205, scale: 2 },
    { key: "destroyed-wall", x: 448, y: 205, scale: 2 },
    { key: "destroyed-wall", x: 480, y: 205, scale: 2 }
  ];

  const groundDetails = [
    [40, 90], [175, 120], [280, 610], [370, 565], [530, 60], [670, 640],
    [810, 75], [920, 620], [1040, 125], [1160, 610], [1250, 80], [1080, 535]
  ];

  return { world, playerSpawn, merchant, campfire, ratSpawns, solids, props, groundDetails };
});
