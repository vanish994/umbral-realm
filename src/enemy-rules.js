((root, factory) => {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.UmbralEnemyRules = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const make = (id, species, name, level, maxHp, damage, speed, chaseRange, attackCooldown, xp, coins, respawnMs) => Object.freeze({ id, species, name, level, maxHp, damage, speed, chaseRange, attackCooldown, xp, coins, respawnMs });
  const ENEMIES = Object.freeze([
    make("rat-1", "rat", "RATO ZUMBI", 1, 45, 4, 25, 175, 1250, 30, 4, 12000),
    make("rat-1b", "rat", "RATO ZUMBI", 1, 45, 4, 25, 175, 1250, 30, 4, 12000),
    make("rat-2", "rat", "RATO ZUMBI", 2, 58, 5, 27, 180, 1150, 40, 5, 13000),
    make("rat-2b", "rat", "RATO ZUMBI", 2, 58, 5, 27, 180, 1150, 40, 5, 13000),
    make("wolf-5", "wolf", "LOBO ZUMBI", 5, 92, 8, 42, 220, 950, 80, 9, 18000),
    make("wolf-5b", "wolf", "LOBO ZUMBI", 5, 92, 8, 42, 220, 950, 80, 9, 18000),
    make("wolf-6", "wolf", "LOBO ZUMBI", 6, 108, 9, 45, 230, 900, 95, 11, 20000),
    make("wolf-6b", "wolf", "LOBO ZUMBI", 6, 108, 9, 45, 230, 900, 95, 11, 20000),
    make("slow-zombie-10", "slow-zombie", "ZUMBI LENTO", 10, 155, 12, 18, 165, 1550, 140, 16, 26000),
    make("slow-zombie-10b", "slow-zombie", "ZUMBI LENTO", 10, 155, 12, 18, 165, 1550, 140, 16, 26000),
    make("slow-zombie-11", "slow-zombie", "ZUMBI LENTO", 11, 172, 13, 19, 170, 1500, 155, 18, 28000),
    make("slow-zombie-12", "slow-zombie", "ZUMBI LENTO", 12, 190, 14, 20, 175, 1450, 175, 20, 30000)
  ]);

  const BY_ID = Object.freeze(Object.fromEntries(ENEMIES.map(enemy => [enemy.id, enemy])));
  function definition(idOrIndex) { return typeof idOrIndex === "number" ? ENEMIES[idOrIndex] : BY_ID[idOrIndex]; }
  function playerMaxHp(level) {
    const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
    return 100 + (safeLevel - 1) * 12;
  }
  return { ENEMIES, BY_ID, definition, playerMaxHp };
});
