const assert = require("node:assert/strict");
const test = require("node:test");
const { maxHp, normalize, grantXp } = require("../src/game-state.js");

test("normalize supplies a playable initial state", () => {
  assert.deepEqual(normalize(), {
    hp: 100, xp: 0, level: 1, coins: 0, talked: false,
    defeated: false, charges: 7, enemyHp: 70, action: "close"
  });
});

test("normalize repairs corrupt and out-of-range save fields", () => {
  const state = normalize({
    hp: "not a number", xp: -20, level: 0, coins: -5,
    charges: 100, enemyHp: -12, action: "unknown"
  });
  assert.equal(state.hp, 100);
  assert.equal(state.xp, 0);
  assert.equal(state.level, 1);
  assert.equal(state.coins, 0);
  assert.equal(state.charges, 7);
  assert.equal(state.enemyHp, 0);
  assert.equal(state.defeated, true);
  assert.equal(state.action, "close");
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
