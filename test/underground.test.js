const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const world = require("../src/world-config.js");
const { definition, rollCoreDrop, coreValue } = require("../src/enemy-rules.js");

test("the only surface opening is the sewer shaft in the south forest band", () => {
  const south = world.borderBands.filter(band => band.id === "south");
  assert.equal(south.length, 2);
  const gapStart = south[0].x + south[0].w;
  const gapEnd = south[1].x;
  assert.equal(gapStart, world.underground.gapX);
  assert.equal(gapEnd - gapStart, world.underground.entrance.width);
  assert.equal(world.areaAt(world.underground.entrance.x, world.surfaceHeight + 40).id, "underground");
  assert.equal(world.areaAt(world.underground.entrance.x, 450).id, "urban", "na superfície o poço continua sendo cidade");
  assert.equal(world.areaAt(190, 450).id, "outskirts");
});

test("sewer zombies are level 20-22 brutes confined to the three galleries", () => {
  const spawns = world.enemySpawns.slice(-5);
  assert.deepEqual(spawns.map(spawn => definition(spawn.id).level), [20, 20, 21, 21, 22]);
  const under = world.underground;
  for (const spawn of spawns) {
    assert.ok(spawn.x > under.x + 32 && spawn.x < under.x + under.width - 32, `${spawn.id} fora das galerias`);
    assert.ok(spawn.y > under.y + 32 && spawn.y < under.y + under.height - 32, `${spawn.id} fora das galerias`);
    assert.ok(definition(spawn.id).speed < definition("scavenger-18").speed, "bruto de corredor é lento");
    assert.ok(definition(spawn.id).maxHp > definition("slow-zombie-12").maxHp, "nível 20+ precisa resistir mais que a superfície");
  }
  assert.equal(coreValue(20), 120);
  assert.deepEqual(rollCoreDrop(definition("sewer-zombie-20"), () => 0), { level: 20, value: 120 });
  const game = fs.readFileSync(path.join(__dirname, "..", "src", "game.js"), "utf8");
  assert.match(game, /"sewer-zombie": Object\.freeze/, "a espécie nova precisa de perfil visual próprio");
});

test("gallery dividers force the west-then-east zigzag path", () => {
  const under = world.underground;
  const walls = world.solids.filter(solid => !solid.border && solid.y >= under.y && solid.x >= under.x && solid.x < under.x + under.width);
  const dividerA = walls.find(solid => solid.y === 1124);
  const dividerB = walls.find(solid => solid.y === 1276);
  assert.ok(dividerA && dividerB);
  assert.ok(dividerA.x > under.x + 32, "a passagem da galeria A fica no oeste");
  assert.ok(dividerB.x + dividerB.w < under.x + under.width - 32, "a passagem da galeria B fica no leste");
});
