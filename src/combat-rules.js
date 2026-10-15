((root, factory) => {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.UmbralCombatRules = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  // Flag temporária: carregadores precisam recarregar, mas a reserva não se esgota no playtest.
  const DEVELOPMENT_INFINITE_RESERVE = true;
  const MAX_SKILL_LEVEL = 100;
  const SKILL_XP_PER_HIT = 4;
  const CRITICAL_CHANCE = 0.08;
  const CRITICAL_MULTIPLIER = 1.75;
  const FIREARM_ACCURACY_STILL = 0.94;
  const FIREARM_ACCURACY_MOVING = 0.76;
  const DAMAGE_PER_SKILL_LEVEL = 0.04;
  const DAMAGE_PER_PLAYER_LEVEL = 0.015;
  const WEAPONS = Object.freeze({
    close: Object.freeze({ skill: "blades", minDamage: 9, maxDamage: 13 }),
    far: Object.freeze({ skill: "firearms", minDamage: 20, maxDamage: 28 })
  });

  function whole(value, fallback, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.floor(parsed)));
  }

  function skillXpNeeded(level) {
    const safeLevel = whole(level, 1, 1, MAX_SKILL_LEVEL);
    return Math.min(Number.MAX_SAFE_INTEGER, Math.round(20 * Math.pow(1.45, safeLevel - 1)));
  }

  function normalizeSkill(raw = {}) {
    let level = whole(raw.level, 1, 1, MAX_SKILL_LEVEL);
    let xp = whole(raw.xp, 0, 0, Number.MAX_SAFE_INTEGER);
    while (level < MAX_SKILL_LEVEL && xp >= skillXpNeeded(level)) {
      xp -= skillXpNeeded(level);
      level += 1;
    }
    if (level === MAX_SKILL_LEVEL) xp = Math.min(xp, skillXpNeeded(level) - 1);
    return { level, xp };
  }

  function grantSkillXp(skill, amount = SKILL_XP_PER_HIT) {
    let levelsGained = 0;
    skill.xp += whole(amount, 0, 0, Number.MAX_SAFE_INTEGER);
    while (skill.level < MAX_SKILL_LEVEL && skill.xp >= skillXpNeeded(skill.level)) {
      skill.xp -= skillXpNeeded(skill.level);
      skill.level += 1;
      levelsGained += 1;
    }
    if (skill.level === MAX_SKILL_LEVEL) skill.xp = Math.min(skill.xp, skillXpNeeded(skill.level) - 1);
    return levelsGained;
  }

  function damageRange(action, skillLevel, playerLevel = 1, weaponStats = null) {
    const weapon = weaponStats?.minDamage && weaponStats?.maxDamage ? weaponStats : WEAPONS[action] || WEAPONS.close;
    const level = whole(skillLevel, 1, 1, MAX_SKILL_LEVEL);
    const generalLevel = whole(playerLevel, 1, 1, Number.MAX_SAFE_INTEGER);
    const multiplier = 1 + (level - 1) * DAMAGE_PER_SKILL_LEVEL + (generalLevel - 1) * DAMAGE_PER_PLAYER_LEVEL;
    return {
      min: Math.max(1, Math.round(weapon.minDamage * multiplier)),
      max: Math.max(1, Math.round(weapon.maxDamage * multiplier))
    };
  }

  function hitChance(action, moving) {
    return action === "far" ? (moving ? FIREARM_ACCURACY_MOVING : FIREARM_ACCURACY_STILL) : 1;
  }

  function rollHit(action, moving, random = Math.random) {
    return (Number(random()) || 0) < hitChance(action, moving);
  }

  function rollDamage(action, skillLevel, playerLevel = 1, weaponStats = null, random = Math.random) {
    const range = damageRange(action, skillLevel, playerLevel, weaponStats);
    const baseRoll = Math.max(0, Math.min(0.999999, Number(random()) || 0));
    const baseDamage = range.min + Math.floor(baseRoll * (range.max - range.min + 1));
    const critical = (Number(random()) || 0) < CRITICAL_CHANCE;
    return {
      damage: critical ? Math.round(baseDamage * CRITICAL_MULTIPLIER) : baseDamage,
      baseDamage,
      critical
    };
  }

  return {
    DEVELOPMENT_INFINITE_RESERVE,
    MAX_SKILL_LEVEL,
    SKILL_XP_PER_HIT,
    CRITICAL_CHANCE,
    CRITICAL_MULTIPLIER,
    FIREARM_ACCURACY_STILL,
    FIREARM_ACCURACY_MOVING,
    WEAPONS,
    skillXpNeeded,
    normalizeSkill,
    grantSkillXp,
    damageRange,
    hitChance,
    rollHit,
    rollDamage
  };
});
