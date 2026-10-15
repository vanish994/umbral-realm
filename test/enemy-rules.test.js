const assert = require("node:assert/strict");
const test = require("node:test");
const { ENEMIES, definition, playerMaxHp, coreDropChance, coreValue, rollCoreDrop } = require("../src/enemy-rules.js");

test("enemy roster follows the requested level bands", () => {
  assert.deepEqual(ENEMIES.filter(enemy => enemy.species === "rat").map(enemy => enemy.level), [1, 1, 2, 2]);
  assert.deepEqual(ENEMIES.filter(enemy => enemy.species === "wolf").map(enemy => enemy.level), [5, 5, 6, 6]);
  assert.deepEqual(ENEMIES.filter(enemy => enemy.species === "slow-zombie").map(enemy => enemy.level), [10, 10, 11, 12]);
  assert.deepEqual(ENEMIES.filter(enemy => enemy.species === "scavenger").map(enemy => enemy.level), [18, 20]);
  assert.deepEqual(ENEMIES.filter(enemy => enemy.species === "mutant").map(enemy => enemy.level), [30]);
  // A faixa de elite fica no fim do roster: o índice de cada definição é usado pelo save e pelos spawns.
  assert.deepEqual(ENEMIES.slice(-3).map(enemy => enemy.id), ["scavenger-18", "scavenger-20", "mutant-30"]);
  assert.deepEqual(ENEMIES.slice(-3).map(enemy => enemy.name), ["SAQUEADOR", "SAQUEADOR", "MUTANTE"]);
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

test("speed and damage keep each species role", () => {
  assert.ok(definition("wolf-6").speed > definition("rat-2").speed);
  assert.ok(definition("rat-2").speed > definition("slow-zombie-10").speed);
  assert.ok(definition("slow-zombie-10").damage > definition("wolf-6").damage);
  // Saqueadores são humanos rápidos e agressivos; o mutante é um bruto lento e brutal.
  assert.ok(definition("scavenger-18").speed > definition("wolf-6").speed);
  assert.ok(definition("mutant-30").speed < definition("slow-zombie-10").speed);
  assert.ok(definition("mutant-30").damage > definition("scavenger-20").damage);
  assert.ok(definition("mutant-30").maxHp > definition("slow-zombie-12").maxHp * 3);
  // Leash curto: os elites guardam a entrada do refúgio em vez de varrer o mapa.
  assert.ok(definition("scavenger-18").chaseRange <= definition("slow-zombie-12").chaseRange);
  assert.ok(definition("mutant-30").chaseRange < definition("slow-zombie-10").chaseRange);
});

test("elite rewards stay above the zombie band and pay for the risk", () => {
  const best = definition("slow-zombie-12");
  for (const elite of [definition("scavenger-18"), definition("scavenger-20"), definition("mutant-30")]) {
    assert.ok(elite.xp > best.xp, `${elite.id} deve render mais XP que o zumbi lento final`);
    assert.ok(elite.coins > best.coins, `${elite.id} deve render mais ouro que o zumbi lento final`);
    assert.ok(elite.respawnMs > best.respawnMs, `${elite.id} deve demorar mais para voltar`);
    assert.ok(elite.attackCooldown < best.attackCooldown || elite.id === "mutant-30", `${elite.id} ataca com mais frequencia que o zumbi lento`);
  }
  // Um mutante nível 30 derruba no máximo dois núcleos caros por ciclo longo de respawn.
  assert.equal(coreValue(30), 180);
  assert.deepEqual(rollCoreDrop(definition("mutant-30"), () => 0), { level: 30, value: 180 });
  assert.equal(rollCoreDrop(definition("mutant-30"), () => 0.5), null, "a chance máxima de núcleo continua em 50%");
});

test("higher-level enemies have more valuable cores and a greater drop chance", () => {
  assert.ok(coreDropChance(12) > coreDropChance(1));
  assert.ok(coreValue(12) > coreValue(1));
  assert.deepEqual(rollCoreDrop(definition("wolf-5"), () => 0), { level: 5, value: 30 });
  assert.equal(rollCoreDrop(definition("wolf-5"), () => 0.99), null);
});

test("player health scales moderately with general level", () => {
  assert.equal(playerMaxHp(1), 100);
  assert.equal(playerMaxHp(5), 148);
  assert.equal(playerMaxHp(12), 232);
});
