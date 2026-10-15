const assert = require("node:assert/strict");
const test = require("node:test");
const world = require("../src/world-config.js");

test("the starter village sits between the rats and the wilds, safe and enclosed by trees", () => {
  assert.deepEqual(world.areas.map(area => area.id), ["outskirts", "village", "wilds", "urban", "refuge"]);
  assert.equal(world.areaAt(world.merchant.x, world.merchant.y).id, "village");
  assert.equal(world.areaAt(world.village.bonfire.x, world.village.bonfire.y).id, "village");
  assert.equal(world.enemySpawns.filter(spawn => world.areaAt(spawn.x, spawn.y).id === "village").length, 0);
  assert.ok(world.isSafeX(world.merchant.x), "o mercador fica em zona segura");
  assert.ok(world.isSafeX(world.campfire.x), "o refúgio do leste continua seguro");
  assert.ok(!world.isSafeX(500) && !world.isSafeX(2200) && !world.isSafeX(3200), "as áreas de mob continuam hostis");

  // O anel tem troncos com colisão e só abre nos vãos da estrada (y 330..580).
  const ring = world.props.filter(prop => prop.solid && prop.x >= 1050 && prop.x <= 1750 && prop.y >= 150 && prop.y <= 760);
  assert.ok(ring.length >= 30, `anel de árvores pequeno demais: ${ring.length}`);
  const westSide = ring.filter(prop => prop.x < 1150);
  assert.ok(westSide.every(prop => prop.y <= 330 || prop.y >= 580), "o vão oeste da estrada precisa ficar aberto");
  assert.equal(world.village.tents.length, 4);
});

test("mob areas are larger, spaced apart, and reinforced", () => {
  const byArea = id => world.enemySpawns.filter(spawn => world.areaAt(spawn.x, spawn.y).id === id);
  assert.equal(byArea("outskirts").length, 5);
  assert.equal(byArea("wilds").length, 5);
  assert.equal(byArea("urban").length, 8);
  // Respiro entre faixas: nenhum spawn encosta na divisa da área vizinha.
  for (const spawn of world.enemySpawns) {
    const area = world.areas.find(candidate => spawn.x >= candidate.startX && spawn.x < candidate.endX);
    if (!area || spawn.y >= world.surfaceHeight) continue;
    assert.ok(spawn.x - area.startX >= 60 || area.id === "outskirts", `${spawn.id} colado no início de ${area.id}`);
  }
});
