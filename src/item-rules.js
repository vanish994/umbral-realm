((root, factory) => {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.UmbralItemRules = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const ITEMS = Object.freeze({
    knife: Object.freeze({ id: "knife", name: "Faca", slot: "blade", action: "close", minDamage: 9, maxDamage: 13, cooldown: 320, price: 0, image: "./assets/items/knife.png" }),
    katana: Object.freeze({ id: "katana", name: "Katana", slot: "blade", action: "close", minDamage: 17, maxDamage: 23, cooldown: 650, price: 140, image: "./assets/items/katana.png" }),
    revolver: Object.freeze({ id: "revolver", name: "Revólver .38", slot: "firearm", action: "far", minDamage: 20, maxDamage: 28, cooldown: 700, magazineSize: 6, reloadMs: 1800, price: 0, image: "./assets/items/revolver.png" }),
    pistol: Object.freeze({ id: "pistol", name: "Pistola", slot: "firearm", action: "far", minDamage: 16, maxDamage: 22, cooldown: 450, magazineSize: 12, reloadMs: 1300, price: 180, image: "./assets/items/pistol.png" }),
    vest: Object.freeze({ id: "vest", name: "Colete", slot: "vest", defense: 0.15, price: 120, image: "./assets/items/vest.png" }),
    helmet: Object.freeze({ id: "helmet", name: "Capacete", slot: "helmet", defense: 0.08, price: 80, image: "./assets/items/helmet.png" }),
    pants: Object.freeze({ id: "pants", name: "Calça tática", slot: "pants", defense: 0.07, price: 90, image: "./assets/items/pants.png" })
  });

  const DEFAULT_EQUIPMENT = Object.freeze({ blade: "knife", firearm: "revolver", vest: null, helmet: null, pants: null });
  const SLOTS = Object.freeze(Object.keys(DEFAULT_EQUIPMENT));

  function validForSlot(itemId, slot) {
    return typeof itemId === "string" && ITEMS[itemId]?.slot === slot;
  }

  function normalizeEquipment(raw = {}) {
    return Object.fromEntries(SLOTS.map(slot => [slot, validForSlot(raw[slot], slot) ? raw[slot] : DEFAULT_EQUIPMENT[slot]]));
  }

  function equip(equipment, itemId) {
    const item = ITEMS[itemId];
    if (!item) return normalizeEquipment(equipment);
    const next = normalizeEquipment(equipment);
    const removableArmor = !item.action;
    next[item.slot] = removableArmor && next[item.slot] === itemId ? null : itemId;
    return next;
  }

  function weaponForAction(equipment, action) {
    const normalized = normalizeEquipment(equipment);
    return ITEMS[action === "far" ? normalized.firearm : normalized.blade];
  }

  function defense(equipment) {
    const normalized = normalizeEquipment(equipment);
    return ["vest", "helmet", "pants"].reduce((total, slot) => total + (ITEMS[normalized[slot]]?.defense || 0), 0);
  }

  function incomingDamage(baseDamage, equipment) {
    const base = Math.max(0, Math.floor(Number(baseDamage) || 0));
    return Math.max(base > 0 ? 1 : 0, Math.round(base * (1 - defense(equipment))));
  }

  return { ITEMS, DEFAULT_EQUIPMENT, SLOTS, normalizeEquipment, equip, weaponForAction, defense, incomingDamage };
});
