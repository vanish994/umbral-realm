const assert = require("node:assert/strict");
const test = require("node:test");
const { ENEMIES, definition, playerMaxHp } = require("../src/enemy-rules.js");

test("enemy roster follows the requested level bands", () => {
  assert.deepEqual(ENEMIES.filter(enemy => enemy.species === "rat").map(enemy => enemy.level), [1, 1, 2, 2]);
  assert.deepEqual(ENEMIES.filter(enemy => enemy.species === "wolf").map(enemy => enemy.level), [5, 5, 6, 6]);
  assert.deepEqual(ENEMIES.filter(enemy => enemy.species === "slow-zombie").map(enemy => enemy.level), [10, 10, 11, 12]);
});

test("higher enemy bands increase health, damage, rewards, and respawn time", () => {
  for (let index = 1; index < ENEMIES.length; index += 1) {
    assert.ok(ENEMIES[index].maxHp >= ENEMIES[index - 1].maxHp);
    assert.ok(ENEMIES[index].damage >= ENEMIES[index - 1].damage);
    assert.ok(ENEMIES[index].xp >= ENEMIES[index - 1].xp);
    assert.ok(ENEMIES[index].coins >= ENEMIES[index - 1].coins);
    assert.ok(ENEMIES[index].respawnMs >= ENEMIES[index - 1].respawnMs);
  }
});

test("wolves are fastest while slow zombies hit harder", () => {
  assert.ok(definition("wolf-6").speed > definition("rat-2").speed);
  assert.ok(definition("rat-2").speed > definition("slow-zombie-10").speed);
  assert.ok(definition("slow-zombie-10").damage > definition("wolf-6").damage);
});

test("player health scales moderately with general level", () => {
  assert.equal(playerMaxHp(1), 100);
  assert.equal(playerMaxHp(5), 148);
  assert.equal(playerMaxHp(12), 232);
});
