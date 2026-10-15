const assert = require("node:assert/strict");
const test = require("node:test");

const rules = require("../src/animation-rules.js");

test("directions and sheet rows keep the order confirmed against the supplied art", () => {
  assert.deepEqual(rules.DIRECTIONS, ["down", "left-down", "left-up", "up", "right-up", "right-down"]);
  assert.deepEqual(
    rules.DIRECTIONS.map(direction => rules.rowFor(direction)),
    [0, 1, 2, 3, 4, 5]
  );
  assert.equal(rules.rowFor("up"), 3, "up must read row 3 of the directional sheets");
  assert.equal(rules.rowFor("down"), 0);
  assert.equal(rules.rowFor("inexistente"), 0, "unknown directions fall back to down");
});

test("aiming directions cover all six poses with balanced 60 degree sectors", () => {
  assert.equal(rules.directionFor(0, 1), "down");
  assert.equal(rules.directionFor(-1, 1), "left-down");
  assert.equal(rules.directionFor(-1, -1), "left-up");
  assert.equal(rules.directionFor(0, -1), "up");
  assert.equal(rules.directionFor(1, -1), "right-up");
  assert.equal(rules.directionFor(1, 1), "right-down");
  // Horizontal aims have no dedicated pose in the art: they resolve to the lower pose.
  assert.equal(rules.directionFor(-1, 0), "left-down");
  assert.equal(rules.directionFor(1, 0), "right-down");
  assert.equal(rules.directionFor(0, 0), "down", "a null vector keeps the current front pose");
  assert.equal(rules.directionFor(Number.NaN, undefined), "down");
  assert.equal(rules.directionOrDefault("left-up"), "left-up");
  assert.equal(rules.directionOrDefault("norte"), "down");
});

test("attack sheets describe the supplied knife and pistol artwork", () => {
  const close = rules.sheetFor("close");
  const far = rules.sheetFor("far");
  assert.equal(close.texture, "player-attack-close");
  assert.equal(close.file, "./assets/characters/male/Attack/knife-attack.png");
  assert.equal(close.frameCount, 12);
  assert.equal(far.texture, "player-attack-far");
  assert.equal(far.file, "./assets/characters/male/Shoot/pistol-shoot.png");
  assert.equal(far.frameCount, 8);
  for (const sheet of [close, far]) {
    assert.equal(sheet.frameWidth, 48);
    assert.equal(sheet.frameHeight, 64);
  }
  assert.equal(rules.sheetFor("close"), rules.sheetFor("qualquer"), "unknown actions use the melee sheet");
  assert.equal(rules.attackKey("close", "left-up"), "player-attack-close-left-up");
  assert.equal(rules.attackKey("far", "right-up"), "player-attack-far-right-up");
  assert.equal(rules.attackKey("far", "x"), "player-attack-far-down");
});

test("attack window follows the weapon cooldown inside safe limits", () => {
  assert.equal(rules.attackWindowMs("close", { cooldown: 320 }), 320);
  assert.equal(rules.attackWindowMs("close", { cooldown: 650 }), 620, "long cooldowns are capped");
  assert.equal(rules.attackWindowMs("far", { cooldown: 700 }), 620);
  assert.equal(rules.attackWindowMs("far", { cooldown: 450 }), 450);
  assert.equal(rules.attackWindowMs("close", { cooldown: 10 }), 260, "very short cooldowns have a floor");
  assert.equal(rules.attackWindowMs("close", {}), rules.ATTACK_WINDOW_MS.max);
  assert.equal(rules.attackWindowMs("close", { cooldown: "nope" }), rules.ATTACK_WINDOW_MS.max);
});

test("animation speed stretches the sheet over the attack window", () => {
  const knife = { cooldown: 320 };
  const katana = { cooldown: 650 };
  const still = rules.baseDurationMs("close") / rules.attackWindowMs("close", knife);
  assert.ok(Math.abs(rules.timeScaleFor("close", knife) - still) < 1e-9);
  assert.ok(rules.timeScaleFor("close", knife) > rules.timeScaleFor("close", katana), "the knife plays faster than the katana");
  assert.ok(rules.timeScaleFor("far", { cooldown: 450 }) > rules.timeScaleFor("far", { cooldown: 700 }));
  assert.equal(rules.baseDurationMs("far"), 8 / rules.BASE_FRAME_RATE * 1000);
});
