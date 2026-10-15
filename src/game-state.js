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

  // Núcleos ainda no chão sobrevivem à recarga: sem isto, atualizar a página
  // faria o loot visível desaparecer. Níveis desconhecidos são descartados.
  function normalizeGroundDrops(raw) {
    const levels = [...new Set(EnemyRules.ENEMIES.map(enemy => enemy.level))];
    return DropRules.normalizeDrops(raw, levels, { width: 2500, height: 900 });
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
      groundDrops: normalizeGroundDrops(raw.groundDrops),
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

  function applyDeathPenalty(state) {
    const general = removeProgress(state.level, state.xp, 10, level => level * 100);
    state.level = general.level;
    state.xp = general.xp;
    const skills = {};
    for (const name of ["blades", "firearms"]) {
      const skill = state.skills[name];
      const loss = Math.ceil(CombatRules.skillXpNeeded(skill.level) * 0.1);
      const result = removeProgress(skill.level, skill.xp, loss, CombatRules.skillXpNeeded);
      skill.level = result.level;
      skill.xp = result.xp;
      skills[name] = { xpLost: loss, levelsLost: result.levelsLost };
    }
    return { generalXpLost: 10, generalLevelsLost: general.levelsLost, skills };
  }

  return { maxHp, normalize, grantXp, applyDeathPenalty };
});
