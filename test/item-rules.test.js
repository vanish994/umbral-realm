const assert = require("node:assert/strict");
const test = require("node:test");
const { ITEMS, defense, equip, incomingDamage, normalizeEquipment, weaponForAction } = require("../src/item-rules.js");

test("equipment defaults preserve the original knife and revolver", () => {
  assert.deepEqual(normalizeEquipment(), { blade: "knife", firearm: "revolver", vest: null, helmet: null, pants: null });
  assert.equal(weaponForAction({}, "close").id, "knife");
  assert.equal(weaponForAction({}, "far").id, "revolver");
});

test("weapons replace the matching slot and armor toggles", () => {
  let equipment = equip({}, "katana");
  equipment = equip(equipment, "pistol");
  equipment = equip(equipment, "vest");
  assert.deepEqual(equipment, { blade: "katana", firearm: "pistol", vest: "vest", helmet: null, pants: null });
  assert.equal(equip(equipment, "vest").vest, null);
});

test("armor combines to thirty percent mitigation", () => {
  const equipment = { blade: "knife", firearm: "revolver", vest: "vest", helmet: "helmet", pants: "pants" };
  assert.equal(defense(equipment), 0.3);
  assert.equal(incomingDamage(14, equipment), 10);
  assert.equal(incomingDamage(1, equipment), 1);
});

test("equippable weapons expose distinct damage and cooldown tradeoffs", () => {
  assert.ok(ITEMS.katana.minDamage > ITEMS.knife.minDamage);
  assert.ok(ITEMS.revolver.maxDamage > ITEMS.pistol.maxDamage);
  assert.ok(ITEMS.pistol.cooldown < ITEMS.revolver.cooldown);
  assert.deepEqual([ITEMS.knife.minDamage, ITEMS.knife.maxDamage, ITEMS.knife.cooldown], [9, 13, 320]);
  assert.deepEqual([ITEMS.revolver.magazineSize, ITEMS.revolver.reloadMs], [6, 1800]);
  assert.deepEqual([ITEMS.pistol.magazineSize, ITEMS.pistol.reloadMs], [12, 1300]);
  assert.deepEqual([ITEMS.katana.price, ITEMS.pistol.price, ITEMS.vest.price, ITEMS.helmet.price, ITEMS.pants.price], [140, 180, 120, 80, 90]);
});
