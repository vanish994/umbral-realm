const assert = require("node:assert/strict");
const test = require("node:test");
const { maxHp, normalize, grantXp, applyDeathPenalty } = require("../src/game-state.js");

const freshEnemies = [
  { id: "rat-1", hp: 45 }, { id: "rat-1b", hp: 45 },
  { id: "rat-2", hp: 58 }, { id: "rat-2b", hp: 58 },
  { id: "wolf-5", hp: 92 }, { id: "wolf-5b", hp: 92 },
  { id: "wolf-6", hp: 108 }, { id: "wolf-6b", hp: 108 },
  { id: "slow-zombie-10", hp: 155 }, { id: "slow-zombie-10b", hp: 155 },
  { id: "slow-zombie-11", hp: 172 }, { id: "slow-zombie-12", hp: 190 },
  { id: "scavenger-18", hp: 300 }, { id: "scavenger-20", hp: 340 },
  { id: "mutant-30", hp: 680 }
];

test("normalize supplies a playable initial state with every scaled enemy", () => {
  const state = normalize();
  assert.equal(state.hp, 100);
  assert.equal(state.xp, 0);
  assert.equal(state.level, 1);
  assert.equal(state.coins, 0);
  assert.deepEqual(state.ammo, { revolver: 6, pistol: 12 });
  assert.deepEqual(state.ownedItems, ["knife", "revolver"]);
  assert.deepEqual(state.cores, { 1: 0, 2: 0, 5: 0, 6: 0, 10: 0, 11: 0, 12: 0, 18: 0, 20: 0, 30: 0 });
  assert.equal(state.action, "close");
  assert.deepEqual(state.skills, { blades: { level: 1, xp: 0 }, firearms: { level: 1, xp: 0 } });
  assert.deepEqual(state.equipment, { blade: "knife", firearm: "revolver", vest: null, helmet: null, pants: null });
  assert.deepEqual(state.enemies, freshEnemies);
});

test("normalize repairs corrupt fields and enemy values", () => {
  const state = normalize({
    hp: "not a number", xp: -20, level: 0, coins: -5, charges: 100,
    skills: { blades: { level: 0, xp: -1 }, firearms: { level: 2, xp: 40 } },
    equipment: { blade: "katana", firearm: "invalid", vest: "vest", helmet: "knife", pants: "pants" },
    enemies: [{ id: "wolf-5", hp: 500 }, { id: "rat-1", hp: -12 }], action: "unknown"
  });
  assert.equal(state.hp, 100);
  assert.equal(state.xp, 0);
  assert.equal(state.level, 1);
  assert.equal(state.coins, 0);
  assert.deepEqual(state.ammo, { revolver: 6, pistol: 12 });
  assert.deepEqual(state.skills, { blades: { level: 1, xp: 0 }, firearms: { level: 3, xp: 11 } });
  assert.deepEqual(state.equipment, { blade: "katana", firearm: "revolver", vest: "vest", helmet: null, pants: "pants" });
  assert.deepEqual(state.enemies, freshEnemies.map(enemy => enemy.id === "rat-1" ? { ...enemy, hp: 0 } : enemy));
  assert.equal(state.action, "close");
});

test("normalize migrates four-rat and single-rat legacy saves", () => {
  const oldPlaytest = normalize({ rats: [{ hp: 0 }, { hp: 70 }, { hp: 12 }] });
  assert.equal(oldPlaytest.enemies[0].hp, 0);
  assert.equal(oldPlaytest.enemies[1].hp, 45);
  assert.equal(oldPlaytest.enemies[2].hp, 58);

  const alive = normalize({ enemyHp: 25, defeated: false });
  assert.equal(alive.enemies[0].hp, 16);
  const defeated = normalize({ enemyHp: 70, defeated: true });
  assert.equal(defeated.enemies[0].hp, 0);
});

test("normalize starts with only the knife and revolver and preserves purchased items and cores", () => {
  const state = normalize({ ownedItems: ["knife", "revolver", "pistol", "invalid"], cores: { 1: 2, 12: 3, 99: 8 } });
  assert.deepEqual(state.ownedItems, ["knife", "revolver", "pistol"]);
  assert.equal(state.cores[1], 2);
  assert.equal(state.cores[12], 3);
  assert.equal(state.cores[99], undefined);
});

test("normalize clamps magazines and migrates legacy revolver charges", () => {
  assert.deepEqual(normalize({ ammo: { revolver: 4, pistol: 99 } }).ammo, { revolver: 4, pistol: 12 });
  assert.deepEqual(normalize({ charges: 3 }).ammo, { revolver: 3, pistol: 12 });
});

test("normalize migrates excess XP through multiple levels", () => {
  const state = normalize({ level: 1, xp: 350, hp: 999 });
  assert.equal(state.level, 3);
  assert.equal(state.xp, 50);
  assert.equal(state.hp, maxHp(3));
  assert.equal(state.hp, 124);
});

test("grantXp supports multiple level gains and reports them", () => {
  const state = normalize({ level: 1, xp: 90 });
  assert.equal(grantXp(state, 220), 2);
  assert.equal(state.level, 3);
  assert.equal(state.xp, 10);
});

test("death removes general and skill XP and can lower levels", () => {
  const state = normalize({
    level: 3,
    xp: 4,
    skills: { blades: { level: 2, xp: 2 }, firearms: { level: 3, xp: 20 } }
  });
  const penalty = applyDeathPenalty(state);
  assert.deepEqual({ level: state.level, xp: state.xp }, { level: 2, xp: 194 });
  assert.deepEqual(state.skills.blades, { level: 1, xp: 19 });
  assert.deepEqual(state.skills.firearms, { level: 3, xp: 15 });
  assert.equal(penalty.generalLevelsLost, 1);
  assert.equal(penalty.skills.blades.levelsLost, 1);
});

test("death penalties never reduce level or XP below their minimum", () => {
  const state = normalize({ level: 1, xp: 5, skills: { blades: { level: 1, xp: 1 }, firearms: { level: 1, xp: 0 } } });
  applyDeathPenalty(state);
  assert.deepEqual({ level: state.level, xp: state.xp }, { level: 1, xp: 0 });
  assert.deepEqual(state.skills, { blades: { level: 1, xp: 0 }, firearms: { level: 1, xp: 0 } });
});
