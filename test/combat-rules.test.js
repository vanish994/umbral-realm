const assert = require("node:assert/strict");
const test = require("node:test");
const {
  CRITICAL_CHANCE,
  DEVELOPMENT_INFINITE_RESERVE,
  SKILL_XP_PER_HIT,
  damageRange,
  grantSkillXp,
  hitChance,
  normalizeSkill,
  rollDamage,
  rollHit,
  skillXpNeeded
} = require("../src/combat-rules.js");

test("development playtest keeps revolver ammunition infinite", () => {
  assert.equal(DEVELOPMENT_INFINITE_RESERVE, true);
});

test("firearms lose accuracy while moving and melee remains certain", () => {
  assert.equal(hitChance("far", false), 0.94);
  assert.equal(hitChance("far", true), 0.76);
  assert.equal(hitChance("close", true), 1);
  assert.equal(rollHit("far", true, () => 0.75), true);
  assert.equal(rollHit("far", true, () => 0.76), false);
});

test("skill requirements grow increasingly difficult", () => {
  assert.equal(skillXpNeeded(1), 20);
  assert.equal(skillXpNeeded(2), 29);
  assert.equal(skillXpNeeded(3), 42);
  assert.ok(skillXpNeeded(8) > skillXpNeeded(7));
});

test("each successful hit grants skill XP and carries excess into levels", () => {
  const skill = normalizeSkill({ level: 1, xp: 18 });
  assert.equal(grantSkillXp(skill, SKILL_XP_PER_HIT), 1);
  assert.deepEqual(skill, { level: 2, xp: 2 });
});

test("weapon skill increases its variable damage range", () => {
  assert.deepEqual(damageRange("close", 1), { min: 9, max: 13 });
  assert.deepEqual(damageRange("far", 1), { min: 20, max: 28 });
  const trained = damageRange("close", 5);
  assert.ok(trained.min > 9);
  assert.ok(trained.max > 13);
  const experienced = damageRange("close", 1, 10);
  assert.ok(experienced.min > 9);
  assert.deepEqual(damageRange("close", 1, 1, { minDamage: 17, maxDamage: 23 }), { min: 17, max: 23 });
  assert.ok(trained.min >= experienced.min, "skill levels must remain more influential than general levels");
});

test("damage rolls vary inside the range and can critically strike", () => {
  const low = rollDamage("close", 1, 1, null, (() => { const values = [0, 1]; return () => values.shift(); })());
  assert.deepEqual(low, { damage: 9, baseDamage: 9, critical: false });

  const critical = rollDamage("far", 1, 1, null, (() => { const values = [0.999, CRITICAL_CHANCE / 2]; return () => values.shift(); })());
  assert.equal(critical.baseDamage, 28);
  assert.equal(critical.damage, 49);
  assert.equal(critical.critical, true);
});
