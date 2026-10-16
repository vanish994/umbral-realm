((root, factory) => {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.UmbralCombatRules = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  // Parâmetros de balanceamento dirigíveis por dados: valores padrão podem ser
  // sobrescritos em tempo de execução por window.UmbralBalance (útil para testes
  // e ajuste rápido), mantendo fallback aos números atuais.
  const DEFAULT_BALANCE = {
    developmentInfiniteReserve: true,
    maxSkillLevel: 100,
    skillXpPerHit: 4,
    criticalChance: 0.08,
    criticalMultiplier: 1.75,
    firearmAccuracyStill: 0.94,
    firearmAccuracyMoving: 0.76,
    damagePerSkillLevel: 0.04,
    damagePerPlayerLevel: 0.015,
    weapons: {
      close: { skill: "blades", minDamage: 9, maxDamage: 13 },
      far: { skill: "firearms", minDamage: 20, maxDamage: 28 }
    }
  };
  const override = (typeof globalThis !== "undefined" && globalThis && globalThis.UmbralBalance && typeof globalThis.UmbralBalance === "object") ? globalThis.UmbralBalance : {};
  const BALANCE = Object.freeze(Object.assign({}, DEFAULT_BALANCE, override, {
    weapons: Object.freeze(Object.assign({}, DEFAULT_BALANCE.weapons, override.weapons || {}))
  }));
  const DEVELOPMENT_INFINITE_RESERVE = BALANCE.developmentInfiniteReserve;
  const MAX_SKILL_LEVEL = BALANCE.maxSkillLevel;
  const SKILL_XP_PER_HIT = BALANCE.skillXpPerHit;
  const CRITICAL_CHANCE = BALANCE.criticalChance;
  const CRITICAL_MULTIPLIER = BALANCE.criticalMultiplier;
  const FIREARM_ACCURACY_STILL = BALANCE.firearmAccuracyStill;
  const FIREARM_ACCURACY_MOVING = BALANCE.firearmAccuracyMoving;
  const DAMAGE_PER_SKILL_LEVEL = BALANCE.damagePerSkillLevel;
  const DAMAGE_PER_PLAYER_LEVEL = BALANCE.damagePerPlayerLevel;
  const WEAPONS = Object.freeze(Object.fromEntries(Object.entries(BALANCE.weapons).map(([key, value]) => [key, Object.freeze(Object.assign({}, value))])));


  function whole(value, fallback, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.floor(parsed)));
  }

  /** @param {number} level @returns {number} */
  function skillXpNeeded(level) {
    const safeLevel = whole(level, 1, 1, MAX_SKILL_LEVEL);
    return Math.min(Number.MAX_SAFE_INTEGER, Math.round(20 * Math.pow(1.45, safeLevel - 1)));
  }

  /** @param {any} [raw] @returns {{level:number,xp:number}} */
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

  /** @param {any} skill @param {number} [amount] @returns {number} */
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

  /** @param {string} action @param {number} skillLevel @param {number} [playerLevel] @param {any} [weaponStats] @returns {{min:number,max:number}} */
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

  /** @param {string} action @param {boolean} moving @returns {number} */
  function hitChance(action, moving) {
    return action === "far" ? (moving ? FIREARM_ACCURACY_MOVING : FIREARM_ACCURACY_STILL) : 1;
  }

  /** @param {string} action @param {boolean} moving @param {Function} [random] @returns {boolean} */
  function rollHit(action, moving, random = Math.random) {
    return (Number(random()) || 0) < hitChance(action, moving);
  }

  /** @param {string} action @param {number} skillLevel @param {number} [playerLevel] @param {any} [weaponStats] @param {Function} [random] @returns {{damage:number,baseDamage:number,critical:boolean}} */
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
    BALANCE,
    DEFAULT_BALANCE,
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
