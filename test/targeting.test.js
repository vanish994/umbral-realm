const assert = require("node:assert/strict");
const test = require("node:test");
const { approachVector, findNearest } = require("../src/targeting.js");

test("findNearest ignores unavailable targets and respects attack range", () => {
  const origin = { x: 0, y: 0 };
  const targets = [
    { id: "dead", x: 5, y: 0, available: false },
    { id: "near", x: 30, y: 40, available: true },
    { id: "far", x: 100, y: 0, available: true }
  ];
  assert.equal(findNearest(origin, targets).id, "near");
  assert.equal(findNearest(origin, targets, 49), null);
  assert.equal(findNearest(origin, targets, 51).id, "near");
});

test("approachVector walks toward a target until knife range", () => {
  const approach = approachVector({ x: 0, y: 0 }, { x: 30, y: 40 }, 20);
  assert.equal(approach.reached, false);
  assert.equal(approach.distance, 50);
  assert.equal(approach.x, 0.6);
  assert.equal(approach.y, 0.8);

  assert.deepEqual(approachVector({ x: 20, y: 20 }, { x: 30, y: 30 }, 20), {
    reached: true,
    x: 0,
    y: 0,
    distance: Math.hypot(10, 10)
  });
});
