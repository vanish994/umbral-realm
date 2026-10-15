const assert = require("node:assert/strict");
const test = require("node:test");
const { PICKUP_RADIUS, MAX_GROUND_DROPS, createDrop, addDrop, isInPickupRange, pickupCandidate, removeDrop, normalizeDrops } = require("../src/drop-rules.js");

test("createDrop keeps valid cores and rejects invalid entries instead of inventing loot", () => {
  assert.deepEqual(createDrop(5, 100.4, 200.6), { level: 5, x: 100, y: 201 });
  assert.equal(createDrop(0, 100, 100), null);
  assert.equal(createDrop(-2, 100, 100), null);
  assert.equal(createDrop(5, "not-a-number", 100), null);
  assert.equal(createDrop(5, 100, undefined), null);
  assert.deepEqual(createDrop(5, 99999, -50), { level: 5, x: 4300, y: 0 });
});

test("addDrop does not mutate the previous list and evicts the oldest beyond the cap", () => {
  const first = createDrop(1, 10, 10);
  const initial = [first];
  const next = addDrop(initial, createDrop(2, 20, 20));
  assert.deepEqual(initial, [first], "a lista salva anterior não pode mudar por referência");
  assert.equal(next.length, 2);

  let drops = [];
  for (let index = 0; index < MAX_GROUND_DROPS + 5; index += 1) drops = addDrop(drops, createDrop(1, index, index));
  assert.equal(drops.length, MAX_GROUND_DROPS);
  assert.equal(drops[0].x, 5, "os cinco drops mais antigos saem primeiro (FIFO)");
  assert.deepEqual(addDrop(drops, null), drops.slice(-MAX_GROUND_DROPS));
});

test("pickup only happens inside the radius and chooses the nearest core", () => {
  const far = createDrop(1, 0, 0);
  const near = createDrop(5, 100, 100);
  const nearest = createDrop(12, 108, 100);
  assert.equal(isInPickupRange(near, 100 + PICKUP_RADIUS, 100), true);
  assert.equal(isInPickupRange(near, 100 + PICKUP_RADIUS + 1, 100), false);
  assert.equal(pickupCandidate([far, near, nearest], 100, 100), near);
  assert.equal(pickupCandidate([far, near, nearest], 106, 100), nearest);
  assert.equal(pickupCandidate([far], 500, 500), null);
  assert.equal(pickupCandidate([], 0, 0), null);
  assert.equal(pickupCandidate(null, 0, 0), null);
});

test("removeDrop removes only the collected instance", () => {
  const a = createDrop(5, 10, 10);
  const b = createDrop(5, 10, 10);
  assert.deepEqual(removeDrop([a, b], a), [b]);
  assert.deepEqual(removeDrop([a, b], createDrop(5, 10, 10)), [a, b], "uma cópia igual não remove o drop errado");
});

test("normalizeDrops keeps only known levels inside the world and respects the cap", () => {
  const validLevels = [1, 2, 5];
  const normalized = normalizeDrops([
    { level: 5, x: 120, y: 220 },
    { level: 99, x: 10, y: 10 },
    { level: 1, x: "bad", y: 10 },
    { level: 2, x: 99999, y: -1 },
    "lixo",
    null
  ], validLevels);
  assert.deepEqual(normalized, [
    { level: 5, x: 120, y: 220 },
    { level: 2, x: 4300, y: 0 }
  ]);
  assert.deepEqual(normalizeDrops(undefined, validLevels), []);
  assert.deepEqual(normalizeDrops([{ level: 1, x: 1, y: 1 }], []), []);
});
