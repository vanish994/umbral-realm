((root, factory) => {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.UmbralState = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const MAX_LEVEL = 1000;
  const ENEMY_MAX_HP = 70;
  const RAT_COUNT = 4;
  const MAX_AMMO = 7;

  function integer(value, fallback, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.floor(parsed)));
  }

  function maxHp(level) {
    return 100 + (level - 1) * 10;
  }

  function normalizeRat(raw) {
    return { hp: integer(raw?.hp, ENEMY_MAX_HP, 0, ENEMY_MAX_HP) };
  }

  function normalize(raw = {}) {
    let level = integer(raw.level, 1, 1, MAX_LEVEL);
    let xp = integer(raw.xp, 0, 0, Number.MAX_SAFE_INTEGER);

    while (level < MAX_LEVEL && xp >= level * 100) {
      xp -= level * 100;
      level += 1;
    }
    if (level === MAX_LEVEL) xp = Math.min(xp, level * 100 - 1);

    let rats;
    if (Array.isArray(raw.rats)) {
      rats = Array.from({ length: RAT_COUNT }, (_, index) => normalizeRat(raw.rats[index]));
    } else {
      // Migração do save v6, que possuía somente um rato.
      const legacyHp = integer(raw.enemyHp, ENEMY_MAX_HP, 0, ENEMY_MAX_HP);
      rats = Array.from({ length: RAT_COUNT }, (_, index) => ({
        hp: index === 0 && (raw.defeated || legacyHp === 0) ? 0 : index === 0 ? legacyHp : ENEMY_MAX_HP
      }));
    }

    return {
      hp: integer(raw.hp, maxHp(level), 1, maxHp(level)),
      xp,
      level,
      coins: integer(raw.coins, 0, 0, Number.MAX_SAFE_INTEGER),
      talked: Boolean(raw.talked),
      charges: integer(raw.charges, MAX_AMMO, 0, MAX_AMMO),
      rats,
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

  return { ENEMY_MAX_HP, RAT_COUNT, MAX_AMMO, maxHp, normalize, grantXp };
});
