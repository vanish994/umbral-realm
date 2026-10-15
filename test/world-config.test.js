const assert = require("node:assert/strict");
const test = require("node:test");
const world = require("../src/world-config.js");

test("authored trail places four rats before the safe clearing", () => {
  assert.equal(world.ratSpawns.length, 4);
  assert.ok(world.ratSpawns.every(rat => rat.x > world.playerSpawn.x));
  assert.ok(world.ratSpawns.every(rat => rat.x < 965));
  assert.ok(world.merchant.x > 965);
  assert.ok(world.campfire.x > 965);
});

test("world entities and collision rectangles stay inside bounds", () => {
  const points = [world.playerSpawn, world.merchant, world.campfire, ...world.ratSpawns, ...world.props];
  for (const point of points) {
    assert.ok(point.x >= 0 && point.x <= world.world.width, `x outside world: ${point.x}`);
    assert.ok(point.y >= 0 && point.y <= world.world.height, `y outside world: ${point.y}`);
  }
  for (const solid of world.solids) {
    assert.ok(solid.x >= 0 && solid.y >= 0);
    assert.ok(solid.x + solid.w <= world.world.width);
    assert.ok(solid.y + solid.h <= world.world.height);
  }
});
