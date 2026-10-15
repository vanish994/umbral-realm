((root, factory) => {
  const combatRules = root.UmbralCombatRules || (typeof require === "function" ? require("./combat-rules.js") : null);
  const enemyRules = root.UmbralEnemyRules || (typeof require === "function" ? require("./enemy-rules.js") : null);
  const itemRules = root.UmbralItemRules || (typeof require === "function" ? require("./item-rules.js") : null);
  const api = factory(combatRules, enemyRules, itemRules);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.UmbralState = api;
})(typeof globalThis !== "undefined" ? globalThis : this, (CombatRules, EnemyRules, ItemRules) => {
  if (!CombatRules || !EnemyRules || !ItemRules) throw new Error("As regras do jogo não carregaram.");

  const MAX_LEVEL = 1000;

  function integer(value, fallback, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.floor(parsed)));
  }

  function maxHp(level) {
    return EnemyRules.playerMaxHp(level);
  }

  function normalizeEnemy(raw, definition) {
    return { id: definition.id, hp: integer(raw?.hp, definition.maxHp, 0, definition.maxHp) };
  }

  function normalizeAmmo(raw = {}, legacyCharges) {
    const revolverFallback = integer(legacyCharges, ItemRules.ITEMS.revolver.magazineSize, 0, ItemRules.ITEMS.revolver.magazineSize);
    return {
      revolver: integer(raw.revolver, revolverFallback, 0, ItemRules.ITEMS.revolver.magazineSize),
      pistol: integer(raw.pistol, ItemRules.ITEMS.pistol.magazineSize, 0, ItemRules.ITEMS.pistol.magazineSize)
    };
  }

  function normalizeOwnedItems(raw, equipment) {
    const owned = new Set(["knife", "revolver"]);
    if (Array.isArray(raw)) raw.filter(itemId => ItemRules.ITEMS[itemId]).forEach(itemId => owned.add(itemId));
    else Object.values(ItemRules.normalizeEquipment(equipment)).filter(Boolean).forEach(itemId => owned.add(itemId));
    return [...owned];
  }

  function normalizeCores(raw = {}) {
    const levels = [...new Set(EnemyRules.ENEMIES.map(enemy => enemy.level))];
    return Object.fromEntries(levels.map(level => [level, integer(raw[level], 0, 0, Number.MAX_SAFE_INTEGER)]));
  }

  function normalize(raw = {}) {
    let level = integer(raw.level, 1, 1, MAX_LEVEL);
    let xp = integer(raw.xp, 0, 0, Number.MAX_SAFE_INTEGER);

    while (level < MAX_LEVEL && xp >= level * 100) {
      xp -= level * 100;
      level += 1;
    }
    if (level === MAX_LEVEL) xp = Math.min(xp, level * 100 - 1);

    let enemies;
    if (Array.isArray(raw.enemies)) {
      const usesIds = raw.enemies.some(enemy => typeof enemy?.id === "string");
      enemies = EnemyRules.ENEMIES.map((definition, index) => normalizeEnemy(usesIds ? raw.enemies.find(enemy => enemy?.id === definition.id) : raw.enemies[index], definition));
    } else if (Array.isArray(raw.rats)) {
      // Migração do playtest anterior: os dois primeiros ratos preservam a proporção de vida.
      enemies = EnemyRules.ENEMIES.map((definition, index) => {
        if (index > 1 || !raw.rats[index]) return normalizeEnemy(null, definition);
        const oldHp = integer(raw.rats[index].hp, 70, 0, 70);
        return { id: definition.id, hp: Math.round(oldHp / 70 * definition.maxHp) };
      });
    } else {
      // Migração do save v6, que possuía somente um rato.
      const first = EnemyRules.ENEMIES[0];
      const legacyHp = integer(raw.enemyHp, 70, 0, 70);
      enemies = EnemyRules.ENEMIES.map((definition, index) => ({
        id: definition.id,
        hp: index === 0 ? (raw.defeated || legacyHp === 0 ? 0 : Math.round(legacyHp / 70 * first.maxHp)) : definition.maxHp
      }));
    }

    const equipment = ItemRules.normalizeEquipment(raw.equipment);
    const ownedItems = normalizeOwnedItems(raw.ownedItems, raw.equipment);
    Object.entries(equipment).forEach(([slot, itemId]) => {
      if (itemId && !ownedItems.includes(itemId)) equipment[slot] = ItemRules.DEFAULT_EQUIPMENT[slot];
    });

    return {
      hp: integer(raw.hp, maxHp(level), 1, maxHp(level)),
      xp,
      level,
      coins: integer(raw.coins, 0, 0, Number.MAX_SAFE_INTEGER),
      talked: Boolean(raw.talked),
      ammo: normalizeAmmo(raw.ammo, raw.charges),
      ownedItems,
      cores: normalizeCores(raw.cores),
      skills: {
        blades: CombatRules.normalizeSkill(raw.skills?.blades),
        firearms: CombatRules.normalizeSkill(raw.skills?.firearms)
      },
      equipment,
      enemies,
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

  return { maxHp, normalize, grantXp };
});
