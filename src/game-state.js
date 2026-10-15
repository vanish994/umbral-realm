((root, factory) => {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.UmbralState = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const MAX_LEVEL = 1000;
  const ENEMY_MAX_HP = 70;
  const MAX_AMMO = 7;

  function integer(value, fallback, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.floor(parsed)));
  }

  function maxHp(level) {
    return 100 + (level - 1) * 10;
  }

  function normalize(raw = {}) {
    let level = integer(raw.level, 1, 1, MAX_LEVEL);
    let xp = integer(raw.xp, 0, 0, Number.MAX_SAFE_INTEGER);

    // Recupera saves antigos que ficaram com experiência acima do limite.
    while (level < MAX_LEVEL && xp >= level * 100) {
      xp -= level * 100;
      level += 1;
    }
    if (level === MAX_LEVEL) xp = Math.min(xp, level * 100 - 1);

    const enemyHp = integer(raw.enemyHp, ENEMY_MAX_HP, 0, ENEMY_MAX_HP);
    return {
      hp: integer(raw.hp, maxHp(level), 1, maxHp(level)),
      xp,
      level,
      coins: integer(raw.coins, 0, 0, Number.MAX_SAFE_INTEGER),
      talked: Boolean(raw.talked),
      defeated: Boolean(raw.defeated) || enemyHp === 0,
      charges: integer(raw.charges, MAX_AMMO, 0, MAX_AMMO),
      enemyHp,
      action: raw.action === "far" ? "far" : "close"
    };
  }

  function grantXp(state, amount) {
    let levelsGained = 0;
    state.xp += integer(amount, 0, 0, Number.MAX_SAFE_INTEGER);
    while (state.level < MAX_LEVEL && state.xp >= state.level * 100) {
      state.xp -= state.level * 100;
      state.level += 1;
      levelsGained += 1;
    }
    if (state.level === MAX_LEVEL) state.xp = Math.min(state.xp, state.level * 100 - 1);
    return levelsGained;
  }

  return { ENEMY_MAX_HP, MAX_AMMO, maxHp, normalize, grantXp };
});
