const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const world = require("../src/world-config.js");

const enemyRules = require("../src/enemy-rules.js");

const root = path.resolve(__dirname, "..");
const sizeCache = {};
function pngSize(key) {
  if (sizeCache[key]) return sizeCache[key];
  for (const folder of ["border", "street", "trail"]) {
    const file = path.join(root, "assets", "environment", folder, `${key}.png`);
    if (!fs.existsSync(file)) continue;
    const header = fs.readFileSync(file);
    assert.equal(header.subarray(1, 4).toString("ascii"), "PNG");
    return (sizeCache[key] = { width: header.readUInt32BE(16), height: header.readUInt32BE(20) });
  }
  throw new Error(`sem PNG para o prop ${key}`);
}

const collisionRects = () => [
  ...world.solids,
  ...world.props.filter(prop => prop.solid).map(prop => ({
    x: prop.x - prop.solid.w / 2,
    y: prop.y - prop.solid.h,
    w: prop.solid.w,
    h: prop.solid.h,
  })),
];

const expectedEnemyIds = [
  "rat-1", "rat-1b", "rat-2", "rat-2b",
  "wolf-5", "wolf-5b", "wolf-6", "wolf-6b",
  "slow-zombie-10", "slow-zombie-10b", "slow-zombie-11", "slow-zombie-12",
  "scavenger-18", "scavenger-20", "mutant-30"
];

test("linear world walks from weak to elite enemies before the refuge", () => {
  assert.deepEqual(world.enemySpawns.map(enemy => enemy.id), expectedEnemyIds);
  assert.deepEqual(world.areas.map(area => area.id), ["outskirts", "wilds", "urban", "refuge"]);
  assert.equal(world.enemySpawns.filter(enemy => world.areaAt(enemy.x).id === "outskirts").length, 4);
  assert.equal(world.enemySpawns.filter(enemy => world.areaAt(enemy.x).id === "wilds").length, 4);
  assert.equal(world.enemySpawns.filter(enemy => world.areaAt(enemy.x).id === "urban").length, 7);
  assert.equal(world.enemySpawns.filter(enemy => world.areaAt(enemy.x).id === "refuge").length, 0, "o refúgio deve continuar sem inimigos");
  assert.ok(world.enemySpawns.every(enemy => enemy.x > world.playerSpawn.x && enemy.x < world.safeZoneX));
});

test("each species band stays ordered west to east and the elite band guards the refuge", () => {
  const band = prefix => world.enemySpawns.filter(enemy => enemy.id.startsWith(prefix));
  for (const prefix of ["rat-", "wolf-", "slow-zombie-", "scavenger-"]) {
    const xs = band(prefix).map(enemy => enemy.x);
    assert.ok(xs.length > 0, `faixa ${prefix} ausente`);
    for (let index = 1; index < xs.length; index += 1) assert.ok(xs[index] > xs[index - 1], `${prefix} fora de ordem`);
  }
  const westOfElites = [band("rat-"), band("wolf-")].flat().map(enemy => enemy.x);
  const elites = [...band("scavenger-"), ...band("mutant-")];
  assert.equal(elites.length, 3);
  assert.ok(elites.every(enemy => enemy.x > Math.max(...westOfElites)), "elites devem ficar a leste das faixas anteriores");
  assert.ok(elites.every(enemy => enemy.x > 2000), "elites guardam a aproximação final do refúgio");
  assert.ok(elites.every(enemy => enemyRules.definition(enemy.id).level >= 18));
});

test("the spawn list keeps the same order as the enemy rules used by the save", () => {
  const spawnIds = world.enemySpawns.map(enemy => enemy.id);
  assert.deepEqual(spawnIds, enemyRules.ENEMIES.map(enemy => enemy.id));
  assert.equal(new Set(spawnIds).size, spawnIds.length, "spawns devem ter ids únicos");
});

test("no enemy spawn starts inside a collision rectangle or prop base", () => {
  const propSolids = world.props
    .filter(prop => prop.solid)
    .map(prop => ({ x: prop.x - prop.solid.w / 2, y: prop.y - prop.solid.h, w: prop.solid.w, h: prop.solid.h }));
  for (const spawn of world.enemySpawns) {
    for (const rect of [...world.solids, ...propSolids]) {
      const inside = spawn.x > rect.x && spawn.x < rect.x + rect.w && spawn.y > rect.y && spawn.y < rect.y + rect.h;
      assert.ok(!inside, `${spawn.id} nasce dentro do obstáculo ${JSON.stringify(rect)}`);
    }
  }
});

test("world entities and collision rectangles stay inside bounds", () => {
  const { width, height } = world.world;
  const points = [world.playerSpawn, world.merchant, world.campfire, ...world.enemySpawns, ...world.props];
  for (const point of points) {
    assert.ok(point.x >= 0 && point.x <= width);
    assert.ok(point.y >= 0 && point.y <= height);
  }
  for (const solid of world.solids) {
    assert.ok(solid.x >= 0 && solid.y >= 0);
    assert.ok(solid.x + solid.w <= width);
    assert.ok(solid.y + solid.h <= height);
  }
});

// A mata das bordas é decorativa, mas quem barra o jogador é o retângulo de colisão de
// cada faixa. Os testes abaixo medem sprite por sprite (tamanho real do PNG escalado)
// para garantir que nenhuma árvore invade o corredor andável.
test("a folhagem da mata fica dentro do retângulo de colisão da própria faixa", () => {
  const inner = {
    north: box => box.bottom <= 128,
    south: box => box.top >= 754,
    west: box => box.right <= 150,
    east: box => box.left >= 2360
  };
  const bands = new Set(world.borderBands.map(band => band.id));
  assert.deepEqual([...bands].sort(), ["east", "north", "south", "west"]);
  let checked = 0;
  for (const prop of world.props) {
    if (!prop.band || prop.layer === "undergrowth") continue;
    checked += 1;
    const size = pngSize(prop.key);
    const width = size.width * prop.scale;
    const height = size.height * prop.scale;
    const box = { left: prop.x - width / 2, right: prop.x + width / 2, top: prop.y - height, bottom: prop.y };
    assert.ok(inner[prop.band](box), `${prop.key} (${prop.x},${prop.y}) cruza a borda da faixa ${prop.band}`);
  }
  assert.ok(checked > 200, `poucas árvores de mata cobertas pelo teste: ${checked}`);
});

test("as quatro faixas cobrem a volta do mapa e nenhum spawn fica dentro da mata", () => {
  const { width, height } = world.world;
  for (const [x, y] of [[0, 0], [width, 0], [0, height], [width, height], [width / 2, 0], [width / 2, height], [0, height / 2], [width, height / 2]]) {
    assert.ok(
      world.borderBands.some(band => x >= band.x && x <= band.x + band.w && y >= band.y && y <= band.y + band.h),
      `a borda em ${x},${y} não tem mata`
    );
  }
  for (const spawn of [...world.enemySpawns, world.merchant, world.campfire, world.playerSpawn]) {
    const inside = world.borderBands.some(band =>
      spawn.x > band.x && spawn.x < band.x + band.w && spawn.y > band.y && spawn.y < band.y + band.h);
    assert.ok(!inside, `${spawn.id || JSON.stringify(spawn)} nasce dentro da mata`);
  }
});

test("o jogador não alcança nenhuma beirada do mapa: a mata fecha o corredor", () => {
  const step = 8, halfWidth = 10, halfHeight = 8;
  const { width, height } = world.world;
  const rects = collisionRects();
  const blocked = (x, y) => rects.some(rect =>
    x + halfWidth > rect.x && x - halfWidth < rect.x + rect.w &&
    y + halfHeight > rect.y && y - halfHeight < rect.y + rect.h);
  const columns = Math.floor(width / step), rows = Math.floor(height / step);
  const startColumn = Math.round(world.playerSpawn.x / step), startRow = Math.round(world.playerSpawn.y / step);
  const seen = new Set([startRow * columns + startColumn]);
  const queue = [[startColumn, startRow]];
  while (queue.length) {
    const [column, row] = queue.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nextColumn = column + dx, nextRow = row + dy;
      if (nextColumn < 0 || nextRow < 0 || nextColumn >= columns || nextRow >= rows) continue;
      const key = nextRow * columns + nextColumn;
      if (seen.has(key) || blocked(nextColumn * step, nextRow * step)) continue;
      seen.add(key);
      queue.push([nextColumn, nextRow]);
    }
  }
  const reachable = [...seen].map(key => [key % columns, Math.floor(key / columns)]);
  assert.ok(reachable.length > 2000, "o corredor andável ficou pequeno demais");
  const margin = 40;   // nenhuma célula alcançável pode chegar a menos de 40 px da beirada
  for (const [column, row] of reachable) {
    const x = column * step, y = row * step;
    assert.ok(x >= margin && x <= width - margin, `célula alcançável encostando na beirada em x=${x}`);
    assert.ok(y >= margin && y <= height - margin, `célula alcançável encostando na beirada em y=${y}`);
  }
  const reachableAt = (point) => seen.has(Math.round(point.y / step) * columns + Math.round(point.x / step));
  assert.ok(reachableAt(world.merchant), "o mercador precisa continuar alcançável");
  assert.ok(reachableAt(world.campfire), "a fogueira precisa continuar alcançável");
  for (const spawn of world.enemySpawns) {
    const column = Math.round(spawn.x / step), row = Math.round(spawn.y / step);
    const near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]
      .some(([dx, dy]) => seen.has((row + dy) * columns + column + dx));
    assert.ok(near, `${spawn.id} ficou isolado por um obstáculo`);
  }
});
