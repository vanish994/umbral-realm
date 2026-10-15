const assert = require("node:assert/strict");
const test = require("node:test");
const world = require("../src/world-config.js");

const expectedEnemyIds = [
  "rat-1", "rat-1b", "rat-2", "rat-2b",
  "wolf-5", "wolf-5b", "wolf-6", "wolf-6b",
  "slow-zombie-10", "slow-zombie-10b", "slow-zombie-11", "slow-zombie-12"
];

test("linear world distributes twelve enemies through three hostile areas before the refuge", () => {
  assert.deepEqual(world.enemySpawns.map(enemy => enemy.id), expectedEnemyIds);
  assert.deepEqual(world.areas.map(area => area.id), ["outskirts", "wilds", "urban", "refuge"]);
  assert.equal(world.enemySpawns.filter(enemy => world.areaAt(enemy.x).id === "outskirts").length, 4);
  assert.equal(world.enemySpawns.filter(enemy => world.areaAt(enemy.x).id === "wilds").length, 4);
  assert.equal(world.enemySpawns.filter(enemy => world.areaAt(enemy.x).id === "urban").length, 4);
  assert.ok(world.enemySpawns.every(enemy => enemy.x > world.playerSpawn.x && enemy.x < world.safeZoneX));
  for (let index = 1; index < world.enemySpawns.length; index += 1) {
    assert.ok(world.enemySpawns[index].x > world.enemySpawns[index - 1].x);
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
