const assert = require("node:assert/strict");
const test = require("node:test");
const world = require("../src/world-config.js");

const expectedEnemyIds = ["rat-1", "rat-2", "wolf-5", "wolf-6", "slow-zombie-10", "slow-zombie-12"];

test("authored trail orders six enemies by progression before the safe clearing", () => {
  assert.deepEqual(world.enemySpawns.map(enemy => enemy.id), expectedEnemyIds);
  assert.ok(world.enemySpawns.every(enemy => enemy.x > world.playerSpawn.x));
  assert.ok(world.enemySpawns.every(enemy => enemy.x < 985));
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
