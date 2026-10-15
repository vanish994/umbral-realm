const assert = require("node:assert/strict");
const test = require("node:test");
const world = require("../src/world-config.js");

const enemyRules = require("../src/enemy-rules.js");

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
