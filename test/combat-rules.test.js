const assert = require("node:assert/strict");
const test = require("node:test");
const {
  CRITICAL_CHANCE,
  DEVELOPMENT_INFINITE_AMMO,
  SKILL_XP_PER_HIT,
  damageRange,
  grantSkillXp,
  normalizeSkill,
  rollDamage,
  skillXpNeeded
} = require("../src/combat-rules.js");

test("development playtest keeps revolver ammunition infinite", () => {
  assert.equal(DEVELOPMENT_INFINITE_AMMO, true);
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
  assert.deepEqual(damageRange("close", 1), { min: 11, max: 15 });
  assert.deepEqual(damageRange("far", 1), { min: 20, max: 28 });
  const trained = damageRange("close", 5);
  assert.ok(trained.min > 11);
  assert.ok(trained.max > 15);
});

test("damage rolls vary inside the range and can critically strike", () => {
  const low = rollDamage("close", 1, (() => { const values = [0, 1]; return () => values.shift(); })());
  assert.deepEqual(low, { damage: 11, baseDamage: 11, critical: false });

  const critical = rollDamage("far", 1, (() => { const values = [0.999, CRITICAL_CHANCE / 2]; return () => values.shift(); })());
  assert.equal(critical.baseDamage, 28);
  assert.equal(critical.damage, 49);
  assert.equal(critical.critical, true);
});
