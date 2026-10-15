((root, factory) => {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.UmbralEnemyRules = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const ENEMIES = Object.freeze([
    Object.freeze({ id: "rat-1", species: "rat", name: "RATO ZUMBI", level: 1, maxHp: 45, damage: 4, speed: 25, chaseRange: 175, attackCooldown: 1250, xp: 30, coins: 4, respawnMs: 12000 }),
    Object.freeze({ id: "rat-2", species: "rat", name: "RATO ZUMBI", level: 2, maxHp: 58, damage: 5, speed: 27, chaseRange: 180, attackCooldown: 1150, xp: 40, coins: 5, respawnMs: 13000 }),
    Object.freeze({ id: "wolf-5", species: "wolf", name: "LOBO ZUMBI", level: 5, maxHp: 92, damage: 8, speed: 42, chaseRange: 220, attackCooldown: 950, xp: 80, coins: 9, respawnMs: 18000 }),
    Object.freeze({ id: "wolf-6", species: "wolf", name: "LOBO ZUMBI", level: 6, maxHp: 108, damage: 9, speed: 45, chaseRange: 230, attackCooldown: 900, xp: 95, coins: 11, respawnMs: 20000 }),
    Object.freeze({ id: "slow-zombie-10", species: "slow-zombie", name: "ZUMBI LENTO", level: 10, maxHp: 155, damage: 12, speed: 18, chaseRange: 165, attackCooldown: 1550, xp: 140, coins: 16, respawnMs: 26000 }),
    Object.freeze({ id: "slow-zombie-12", species: "slow-zombie", name: "ZUMBI LENTO", level: 12, maxHp: 190, damage: 14, speed: 20, chaseRange: 175, attackCooldown: 1450, xp: 175, coins: 20, respawnMs: 30000 })
  ]);

  const BY_ID = Object.freeze(Object.fromEntries(ENEMIES.map(enemy => [enemy.id, enemy])));

  function definition(idOrIndex) {
    return typeof idOrIndex === "number" ? ENEMIES[idOrIndex] : BY_ID[idOrIndex];
  }

  function playerMaxHp(level) {
    const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
    return 100 + (safeLevel - 1) * 12;
  }

  return { ENEMIES, BY_ID, definition, playerMaxHp };
});
