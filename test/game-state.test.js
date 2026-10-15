const assert = require("node:assert/strict");
const test = require("node:test");
const { maxHp, normalize, grantXp } = require("../src/game-state.js");

test("normalize supplies a playable initial state with four rats", () => {
  const state = normalize();
  assert.equal(state.hp, 100);
  assert.equal(state.xp, 0);
  assert.equal(state.level, 1);
  assert.equal(state.coins, 0);
  assert.equal(state.charges, 7);
  assert.equal(state.action, "close");
  assert.deepEqual(state.rats, [{ hp: 70 }, { hp: 70 }, { hp: 70 }, { hp: 70 }]);
});

test("normalize repairs corrupt fields and rat values", () => {
  const state = normalize({
    hp: "not a number", xp: -20, level: 0, coins: -5, charges: 100,
    rats: [{ hp: -12 }, { hp: 500 }, { hp: "bad" }], action: "unknown"
  });
  assert.equal(state.hp, 100);
  assert.equal(state.xp, 0);
  assert.equal(state.level, 1);
  assert.equal(state.coins, 0);
  assert.equal(state.charges, 7);
  assert.deepEqual(state.rats, [{ hp: 0 }, { hp: 70 }, { hp: 70 }, { hp: 70 }]);
  assert.equal(state.action, "close");
});

test("normalize migrates the single-rat v6 save", () => {
  const alive = normalize({ enemyHp: 25, defeated: false });
  assert.deepEqual(alive.rats, [{ hp: 25 }, { hp: 70 }, { hp: 70 }, { hp: 70 }]);
  const defeated = normalize({ enemyHp: 70, defeated: true });
  assert.equal(defeated.rats[0].hp, 0);
});

test("normalize migrates excess XP through multiple levels", () => {
  const state = normalize({ level: 1, xp: 350, hp: 999 });
  assert.equal(state.level, 3);
  assert.equal(state.xp, 50);
  assert.equal(state.hp, maxHp(3));
});

test("grantXp supports multiple level gains and reports them", () => {
  const state = normalize({ level: 1, xp: 90 });
  assert.equal(grantXp(state, 220), 2);
  assert.equal(state.level, 3);
  assert.equal(state.xp, 10);
});
