const assert = require("node:assert/strict");
const test = require("node:test");
const { normalize } = require("../src/game-state.js");

test("normalize starts with no ground drops and preserves collected-free loot across reloads", () => {
  assert.deepEqual(normalize().groundDrops, []);
  const state = normalize({ groundDrops: [{ level: 5, x: 300, y: 410 }, { level: 30, x: 2155, y: 400 }] });
  assert.deepEqual(state.groundDrops, [
    { level: 5, x: 300, y: 410 },
    { level: 30, x: 2155, y: 400 }
  ]);
});

test("normalize discards corrupt ground drops instead of spawning false loot", () => {
  const state = normalize({
    groundDrops: [
      { level: 99, x: 10, y: 10 },
      { level: 5, x: "quebrado", y: 10 },
      { level: 1, x: 99999, y: -20 },
      null,
      "lixo"
    ]
  });
  assert.deepEqual(state.groundDrops, [{ level: 1, x: 4300, y: 0 }]);
});

test("ground drops are independent from carried cores and enemy state", () => {
  const state = normalize({ cores: { 5: 2 }, groundDrops: [{ level: 5, x: 10, y: 10 }] });
  assert.equal(state.cores[5], 2, "coletar continua sendo o único caminho para a mochila");
  assert.equal(state.groundDrops.length, 1);
  assert.equal(state.enemies.length, 23);
});
