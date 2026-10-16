((root, factory) => {
  const combatRules = root.UmbralCombatRules || (typeof require === "function" ? require("./combat-rules.js") : null);
  const enemyRules = root.UmbralEnemyRules || (typeof require === "function" ? require("./enemy-rules.js") : null);
  const itemRules = root.UmbralItemRules || (typeof require === "function" ? require("./item-rules.js") : null);
  const dropRules = root.UmbralDropRules || (typeof require === "function" ? require("./drop-rules.js") : null);
  const api = factory(combatRules, enemyRules, itemRules, dropRules);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.UmbralState = api;
})(typeof globalThis !== "undefined" ? globalThis : this, (CombatRules, EnemyRules, ItemRules, DropRules) => {
  if (!CombatRules || !EnemyRules || !ItemRules || !DropRules) throw new Error("As regras do jogo não carregaram.");

  const MAX_LEVEL = 1000;
  const balanceOverride = (typeof globalThis !== "undefined" && globalThis && globalThis.UmbralBalance && typeof globalThis.UmbralBalance === "object") ? globalThis.UmbralBalance : {};
  const GENERAL_XP_PER_LEVEL = Number.isFinite(balanceOverride.generalXpPerLevel) ? balanceOverride.generalXpPerLevel : 100;
  const DEATH_GENERAL_XP_LOSS = Number.isFinite(balanceOverride.deathGeneralXpLoss) ? balanceOverride.deathGeneralXpLoss : 10;
  const DEATH_SKILL_XP_PERCENT = Number.isFinite(balanceOverride.deathSkillXpPercent) ? balanceOverride.deathSkillXpPercent : 0.1;
  const SAVE_VERSION = 1;
  const KNOWN_SAVE_KEYS = new Set([
    "hp", "xp", "level", "coins", "talked", "ammo", "charges", "ownedItems",
    "cores", "groundDrops", "skills", "equipment", "enemies", "rats",
    "enemyHp", "defeated", "action", "saveVersion"
  ]);

  function integer(value, fallback, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.floor(parsed)));
  }

  /** @param {number} level @returns {number} */
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

  // Núcleos ainda no chão sobrevivem à recarga: sem isto, atualizar a página
  // faria o loot visível desaparecer. Níveis desconhecidos são descartados.
  function normalizeGroundDrops(raw) {
    const levels = [...new Set(EnemyRules.ENEMIES.map(enemy => enemy.level))];
    return DropRules.normalizeDrops(raw, levels, { width: 4300, height: 1500 });
  }

  /** @param {any} [raw] @returns {any} */
  function normalize(raw = {}) {
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      Object.keys(raw).forEach(key => {
        if (!KNOWN_SAVE_KEYS.has(key)) console.warn(`[UmbralState] campo de save desconhecido ignorado: ${key}`);
      });
    }
    let level = integer(raw.level, 1, 1, MAX_LEVEL);
    let xp = integer(raw.xp, 0, 0, Number.MAX_SAFE_INTEGER);

    while (level < MAX_LEVEL && xp >= level * GENERAL_XP_PER_LEVEL) {
      xp -= level * GENERAL_XP_PER_LEVEL;
      level += 1;
    }
    if (level === MAX_LEVEL) xp = Math.min(xp, level * GENERAL_XP_PER_LEVEL - 1);

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
      groundDrops: normalizeGroundDrops(raw.groundDrops),
      skills: {
        blades: CombatRules.normalizeSkill(raw.skills?.blades),
        firearms: CombatRules.normalizeSkill(raw.skills?.firearms)
      },
      equipment,
      enemies,
      action: raw.action === "far" ? "far" : "close",
      saveVersion: SAVE_VERSION
    };
  }

  /** @param {any} state @param {number} [amount] @returns {number} */
  function grantXp(state, amount) {
    let levelsGained = 0;
    state.xp += integer(amount, 0, 0, Number.MAX_SAFE_INTEGER);
    while (state.level < MAX_LEVEL && state.xp >= state.level * GENERAL_XP_PER_LEVEL) {
      state.xp -= state.level * GENERAL_XP_PER_LEVEL;
      state.level += 1;
      levelsGained += 1;
    }
    if (state.level === MAX_LEVEL) state.xp = Math.min(state.xp, state.level * GENERAL_XP_PER_LEVEL - 1);
    return levelsGained;
  }

  /** @param {number} level @param {number} xp @param {number} amount @param {Function} requirementForLevel @returns {{level:number,xp:number,levelsLost:number}} */
  function removeProgress(level, xp, amount, requirementForLevel) {
    let safeLevel = integer(level, 1, 1, MAX_LEVEL);
    let safeXp = integer(xp, 0, 0, Number.MAX_SAFE_INTEGER);
    let remaining = integer(amount, 0, 0, Number.MAX_SAFE_INTEGER);
    let levelsLost = 0;
    while (remaining > safeXp && safeLevel > 1) {
      remaining -= safeXp;
      safeLevel -= 1;
      levelsLost += 1;
      safeXp = requirementForLevel(safeLevel);
    }
    safeXp = Math.max(0, safeXp - remaining);
    return { level: safeLevel, xp: safeXp, levelsLost };
  }

  /** @param {any} state @returns {any} */
  function applyDeathPenalty(state) {
    const general = removeProgress(state.level, state.xp, DEATH_GENERAL_XP_LOSS, level => level * GENERAL_XP_PER_LEVEL);
    state.level = general.level;
    state.xp = general.xp;
    const skills = {};
    for (const name of ["blades", "firearms"]) {
      const skill = state.skills[name];
      const loss = Math.ceil(CombatRules.skillXpNeeded(skill.level) * DEATH_SKILL_XP_PERCENT);
      const result = removeProgress(skill.level, skill.xp, loss, CombatRules.skillXpNeeded);
      skill.level = result.level;
      skill.xp = result.xp;
      skills[name] = { xpLost: loss, levelsLost: result.levelsLost };
    }
    return { generalXpLost: DEATH_GENERAL_XP_LOSS, generalLevelsLost: general.levelsLost, skills };
  }

  return { maxHp, normalize, grantXp, applyDeathPenalty, removeProgress, SAVE_VERSION };
});
