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
    make("slow-zombie-12", "slow-zombie", "ZUMBI LENTO", 12, 190, 14, 20, 175, 1450, 175, 20, 30000),
    // Faixa de elite que guarda a entrada do refúgio. Os números são provisórios e configuráveis:
    // a extrapolação linear da faixa zumbi daria ~266 PV no nível 18; os saqueadores recebem um
    // acréscimo de elite (mais vida, dano, velocidade e recompensa) por serem o conteúdo final do mapa.
    // A zona de perseguição é mais curta que a dos zumbis lentos: eles guardam o portão, não varrem o mapa.
    make("scavenger-18", "scavenger", "SAQUEADOR", 18, 300, 22, 54, 170, 950, 380, 52, 70000),
    make("scavenger-20", "scavenger", "SAQUEADOR", 20, 340, 25, 56, 175, 900, 430, 60, 78000),
    // Chefe de área: o mais lento do mapa, resistente e brutal, com o maior respawn do protótipo.
    make("mutant-30", "mutant", "MUTANTE", 30, 680, 36, 16, 150, 1350, 900, 110, 120000)
  ]);

  const BY_ID = Object.freeze(Object.fromEntries(ENEMIES.map(enemy => [enemy.id, enemy])));
  function definition(idOrIndex) { return typeof idOrIndex === "number" ? ENEMIES[idOrIndex] : BY_ID[idOrIndex]; }
  function playerMaxHp(level) {
    const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
    return 100 + (safeLevel - 1) * 12;
  }
  function coreDropChance(level) {
    const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
    return Math.min(0.5, 0.22 + safeLevel * 0.02);
  }
  function coreValue(level) {
    const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
    return safeLevel * 6;
  }
  function rollCoreDrop(enemy, random = Math.random) {
    if (!enemy || (Number(random()) || 0) >= coreDropChance(enemy.level)) return null;
    return { level: enemy.level, value: coreValue(enemy.level) };
  }
  return { ENEMIES, BY_ID, definition, playerMaxHp, coreDropChance, coreValue, rollCoreDrop };
});
